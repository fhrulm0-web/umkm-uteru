package com.uteru.pos.services;

import com.uteru.pos.models.Transaction;
import com.uteru.pos.models.TransactionDetail;
import com.uteru.pos.repositories.ProductRepository;
import com.uteru.pos.repositories.StockLogRepository;
import com.uteru.pos.repositories.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PosServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private StockLogRepository stockLogRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private PosService posService;

    @Test
    void processCheckoutAssignsCodeDateAndBackReferences() {
        Transaction transaction = new Transaction();
        transaction.setCashierName("Owner");
        transaction.setPaymentMethod("CASH");
        transaction.setTotalAmount(BigDecimal.valueOf(24000));
        transaction.setAmountPaid(BigDecimal.valueOf(25000));
        transaction.setChangeAmount(BigDecimal.valueOf(1000));

        TransactionDetail firstDetail = new TransactionDetail();
        firstDetail.setProductName("Es Kelapa Cup Besar");
        firstDetail.setQuantity(2);
        firstDetail.setPriceAtTime(BigDecimal.valueOf(10000));
        firstDetail.setSubtotal(BigDecimal.valueOf(20000));

        TransactionDetail secondDetail = new TransactionDetail();
        secondDetail.setProductName("Es Teh Cup Kecil");
        secondDetail.setQuantity(1);
        secondDetail.setPriceAtTime(BigDecimal.valueOf(4000));
        secondDetail.setSubtotal(BigDecimal.valueOf(4000));

        transaction.setDetails(new ArrayList<>(List.of(firstDetail, secondDetail)));

        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        LocalDateTime before = LocalDateTime.now().minusSeconds(1);
        Transaction savedTransaction = posService.processCheckout(transaction);
        LocalDateTime after = LocalDateTime.now().plusSeconds(1);

        assertSame(transaction, savedTransaction);
        assertNotNull(savedTransaction.getTransactionDate());
        assertFalse(savedTransaction.getTransactionDate().isBefore(before));
        assertFalse(savedTransaction.getTransactionDate().isAfter(after));
        assertNotNull(savedTransaction.getTransactionCode());
        assertTrue(savedTransaction.getTransactionCode().matches("TX-[A-Z0-9]{8}"));
        assertEquals(2, savedTransaction.getDetails().size());
        assertSame(savedTransaction, firstDetail.getTransaction());
        assertSame(savedTransaction, secondDetail.getTransaction());

        verify(transactionRepository).save(transaction);
    }
}
