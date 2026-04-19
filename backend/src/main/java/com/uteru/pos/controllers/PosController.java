package com.uteru.pos.controllers;

import com.uteru.pos.models.StockLog;
import com.uteru.pos.models.Transaction;
import com.uteru.pos.models.Product;
import com.uteru.pos.payload.MasterStockRequest;
import com.uteru.pos.payload.StockInputRequest;
import com.uteru.pos.services.PosService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pos")
@CrossOrigin(origins = "*")
public class PosController {

    private final PosService posService;

    public PosController(PosService posService) {
        this.posService = posService;
    }

    @PostMapping("/checkout")
    public Transaction checkout(@RequestBody Transaction transaction) {
        return posService.processCheckout(transaction);
    }

    @PostMapping("/stock/morning")
    public StockLog inputMorningStock(@RequestBody StockInputRequest request) {
        return posService.inputMorningStock(request);
    }

    @PostMapping("/stock/night")
    public StockLog inputNightStock(@RequestBody StockInputRequest request) {
        return posService.inputNightStock(request);
    }

    @PostMapping("/stock/master")
    public Product updateMasterStock(@RequestBody MasterStockRequest request) {
        return posService.updateMasterStock(request);
    }

    @GetMapping("/transactions")
    public List<Transaction> getTransactions(
            @RequestParam String from,
            @RequestParam String to) {
        LocalDateTime start = LocalDate.parse(from).atStartOfDay();
        LocalDateTime end = LocalDate.parse(to).atTime(23, 59, 59);
        return posService.getTransactionsByDateRange(start, end);
    }

    @GetMapping("/stock/logs")
    public List<StockLog> getStockLogs(@RequestParam String date) {
        return posService.getStockLogsByDate(LocalDate.parse(date));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        posService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}
