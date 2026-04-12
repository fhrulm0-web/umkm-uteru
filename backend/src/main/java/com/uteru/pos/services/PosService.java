package com.uteru.pos.services;

import com.uteru.pos.models.Product;
import com.uteru.pos.models.StockLog;
import com.uteru.pos.models.Transaction;
import com.uteru.pos.models.TransactionDetail;
import com.uteru.pos.payload.MasterStockRequest;
import com.uteru.pos.payload.StockInputRequest;
import com.uteru.pos.repositories.ProductRepository;
import com.uteru.pos.repositories.StockLogRepository;
import com.uteru.pos.repositories.TransactionRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PosService {

    private final TransactionRepository transactionRepository;
    private final StockLogRepository stockLogRepository;
    private final ProductRepository productRepository;

    public PosService(TransactionRepository transactionRepository,
            StockLogRepository stockLogRepository,
            ProductRepository productRepository) {
        this.transactionRepository = transactionRepository;
        this.stockLogRepository = stockLogRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Transaction processCheckout(Transaction transaction) {
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setTransactionCode(generateTransactionCode());

        if (transaction.getDetails() != null) {
            for (TransactionDetail detail : transaction.getDetails()) {
                detail.setTransaction(transaction);
            }
        }
        return transactionRepository.save(transaction);
    }

    @Transactional
    public StockLog inputMorningStock(StockInputRequest request) {
        Product product = getTrackedProduct(request.getProductId());
        int pcsQuantity = toTotalPcs(product, request.getPackQuantity(), request.getLoosePcsQuantity());

        LocalDate today = LocalDate.now();
        StockLog log = stockLogRepository.findByProductIdAndLogDate(product.getId(), today)
                .orElseGet(() -> createDailyLog(product, today));

        int previousActualUsed = safeInt(log.getActualUsedQty());

        log.setMorningStock(pcsQuantity);
        log.setMorningStaffName(request.getStaffName());

        if (log.getNightStock() != null) {
            int newActualUsed = computeActualUsed(pcsQuantity, log.getNightStock());
            applyActualUsageDelta(product, log, previousActualUsed, newActualUsed);
        }

        return stockLogRepository.save(log);
    }

    @Transactional
    public StockLog inputNightStock(StockInputRequest request) {
        Product product = getTrackedProduct(request.getProductId());
        int totalPcsLeft = toTotalPcs(product, request.getPackQuantity(), request.getLoosePcsQuantity());

        LocalDate today = LocalDate.now();
        StockLog log = stockLogRepository.findByProductIdAndLogDate(product.getId(), today)
                .orElseThrow(() -> new RuntimeException("No morning stock found for today"));

        int morningStock = safeInt(log.getMorningStock());
        int previousActualUsed = safeInt(log.getActualUsedQty());
        int newActualUsed = computeActualUsed(morningStock, totalPcsLeft);

        log.setNightStock(totalPcsLeft);
        log.setNightStaffName(request.getStaffName());
        applyActualUsageDelta(product, log, previousActualUsed, newActualUsed);

        return stockLogRepository.save(log);
    }

    @Transactional
    public Product updateMasterStock(MasterStockRequest request) {
        Product product = getTrackedProduct(request.getProductId());
        Integer setTotalPcs = request.getSetTotalPcs();

        if (setTotalPcs != null) {
            if (setTotalPcs < 0) {
                throw new RuntimeException("Total stock cannot be negative");
            }
            product.setCurrentStockPcs(setTotalPcs);
            return productRepository.save(product);
        }

        int addPcs = toTotalPcs(product, request.getAddPackQuantity(), request.getAddLoosePcsQuantity());
        if (addPcs <= 0) {
            throw new RuntimeException("Additional stock must be greater than zero");
        }

        product.setCurrentStockPcs(safeInt(product.getCurrentStockPcs()) + addPcs);
        return productRepository.save(product);
    }

    public List<Transaction> getTransactionsByDateRange(LocalDateTime start, LocalDateTime end) {
        return transactionRepository.findByTransactionDateBetweenOrderByTransactionDateDesc(start, end);
    }

    public List<StockLog> getStockLogsByDate(LocalDate date) {
        return stockLogRepository.findByLogDate(date);
    }

    @Transactional
    public void deleteTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        transactionRepository.delete(transaction);
    }

    private Product getTrackedProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (!Boolean.TRUE.equals(product.getTrackStock())) {
            throw new RuntimeException("Product does not support stock tracking");
        }
        return product;
    }

    private StockLog createDailyLog(Product product, LocalDate date) {
        StockLog log = new StockLog();
        log.setProduct(product);
        log.setLogDate(date);
        return log;
    }

    private int toTotalPcs(Product product, Integer packQuantity, Integer loosePcsQuantity) {
        int packs = safeInt(packQuantity);
        int loosePcs = safeInt(loosePcsQuantity);
        if (packs < 0 || loosePcs < 0) {
            throw new RuntimeException("Stock values cannot be negative");
        }
        return (packs * safeInt(product.getPcsPerPack())) + loosePcs;
    }

    private int computeActualUsed(int morningStock, int nightStock) {
        int actualUsed = morningStock - nightStock;
        if (actualUsed < 0) {
            throw new RuntimeException("Night stock cannot exceed morning stock");
        }
        return actualUsed;
    }

    private void applyActualUsageDelta(Product product, StockLog log, int previousActualUsed, int newActualUsed) {
        int delta = newActualUsed - previousActualUsed;
        int currentStock = safeInt(product.getCurrentStockPcs()) - delta;
        if (currentStock < 0) {
            throw new RuntimeException("Master stock is not enough for this usage");
        }

        product.setCurrentStockPcs(currentStock);
        log.setActualUsedQty(newActualUsed);
        productRepository.save(product);
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private String generateTransactionCode() {
        return "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
