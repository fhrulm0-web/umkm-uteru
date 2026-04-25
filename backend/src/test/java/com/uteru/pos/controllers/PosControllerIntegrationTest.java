package com.uteru.pos.controllers;

import com.uteru.pos.models.Transaction;
import com.uteru.pos.models.TransactionDetail;
import com.uteru.pos.repositories.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class PosControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository transactionRepository;

    @Test
    void getTransactionsReturnsPersistedDetailsFromDatabase() throws Exception {
        Transaction transaction = new Transaction();
        transaction.setTransactionCode("TX-PERSIST01");
        transaction.setTransactionDate(LocalDateTime.of(2026, 4, 19, 11, 20, 30));
        transaction.setCashierName("Owner");
        transaction.setPaymentMethod("CASH");
        transaction.setTotalAmount(BigDecimal.valueOf(18000));
        transaction.setAmountPaid(BigDecimal.valueOf(18000));
        transaction.setChangeAmount(BigDecimal.ZERO);

        TransactionDetail detail = new TransactionDetail();
        detail.setProductName("Kelapa Bijian");
        detail.setQuantity(1);
        detail.setPriceAtTime(BigDecimal.valueOf(18000));
        detail.setSubtotal(BigDecimal.valueOf(18000));
        detail.setTransaction(transaction);
        transaction.setDetails(new ArrayList<>(List.of(detail)));

        transactionRepository.saveAndFlush(transaction);

        mockMvc.perform(get("/api/pos/transactions")
                        .param("from", "2026-04-19")
                        .param("to", "2026-04-19")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].transactionCode").value("TX-PERSIST01"))
                .andExpect(jsonPath("$[0].details[0].productName").value("Kelapa Bijian"))
                .andExpect(jsonPath("$[0].details[0].quantity").value(1))
                .andExpect(jsonPath("$[0].details[0].priceAtTime").value(18000));
    }
}
