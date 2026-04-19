package com.uteru.pos.controllers;

import com.uteru.pos.models.Transaction;
import com.uteru.pos.models.TransactionDetail;
import com.uteru.pos.services.PosService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PosController.class)
class PosControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PosService posService;

    @Test
    void checkoutReturnsSavedTransactionWithDetails() throws Exception {
        Transaction savedTransaction = new Transaction();
        savedTransaction.setId(10L);
        savedTransaction.setTransactionCode("TX-ABCD1234");
        savedTransaction.setTransactionDate(LocalDateTime.of(2026, 4, 19, 10, 30, 15));
        savedTransaction.setCashierName("Owner");
        savedTransaction.setPaymentMethod("CASH");
        savedTransaction.setTotalAmount(BigDecimal.valueOf(18000));
        savedTransaction.setAmountPaid(BigDecimal.valueOf(20000));
        savedTransaction.setChangeAmount(BigDecimal.valueOf(2000));

        TransactionDetail detail = new TransactionDetail();
        detail.setId(99L);
        detail.setProductName("Kelapa Bijian");
        detail.setQuantity(1);
        detail.setPriceAtTime(BigDecimal.valueOf(18000));
        detail.setSubtotal(BigDecimal.valueOf(18000));
        detail.setTransaction(savedTransaction);
        savedTransaction.setDetails(List.of(detail));

        when(posService.processCheckout(any(Transaction.class))).thenReturn(savedTransaction);

        mockMvc.perform(post("/api/pos/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "paymentMethod": "CASH",
                                  "cashierName": "Owner",
                                  "totalAmount": 18000,
                                  "amountPaid": 20000,
                                  "changeAmount": 2000,
                                  "details": [
                                    {
                                      "productName": "Kelapa Bijian",
                                      "quantity": 1,
                                      "priceAtTime": 18000,
                                      "subtotal": 18000
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.transactionCode").value("TX-ABCD1234"))
                .andExpect(jsonPath("$.transactionDate").value("2026-04-19T10:30:15"))
                .andExpect(jsonPath("$.cashierName").value("Owner"))
                .andExpect(jsonPath("$.paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.totalAmount").value(18000))
                .andExpect(jsonPath("$.details", hasSize(1)))
                .andExpect(jsonPath("$.details[0].productName").value("Kelapa Bijian"))
                .andExpect(jsonPath("$.details[0].quantity").value(1))
                .andExpect(jsonPath("$.details[0].priceAtTime").value(18000));

        verify(posService).processCheckout(any(Transaction.class));
    }

    @Test
    void getTransactionsUsesWholeDayRange() throws Exception {
        Transaction transaction = new Transaction();
        transaction.setId(11L);
        transaction.setTransactionCode("TX-LOAD123");
        transaction.setTransactionDate(LocalDateTime.of(2026, 4, 19, 21, 45, 30));
        transaction.setCashierName("Bu Rani");
        transaction.setPaymentMethod("QRIS");
        transaction.setTotalAmount(BigDecimal.valueOf(24000));

        when(posService.getTransactionsByDateRange(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(transaction));

        mockMvc.perform(get("/api/pos/transactions")
                        .param("from", "2026-04-18")
                        .param("to", "2026-04-19"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(11))
                .andExpect(jsonPath("$[0].transactionCode").value("TX-LOAD123"))
                .andExpect(jsonPath("$[0].transactionDate").value("2026-04-19T21:45:30"))
                .andExpect(jsonPath("$[0].cashierName").value("Bu Rani"))
                .andExpect(jsonPath("$[0].paymentMethod").value("QRIS"))
                .andExpect(jsonPath("$[0].totalAmount").value(24000));

        verify(posService).getTransactionsByDateRange(
                LocalDateTime.of(2026, 4, 18, 0, 0, 0),
                LocalDateTime.of(2026, 4, 19, 23, 59, 59));
    }

    @Test
    void deleteTransactionReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/pos/transactions/123"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(posService).deleteTransaction(123L);
    }
}
