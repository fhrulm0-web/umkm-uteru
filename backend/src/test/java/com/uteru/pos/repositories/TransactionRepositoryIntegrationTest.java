package com.uteru.pos.repositories;

import com.uteru.pos.models.Transaction;
import com.uteru.pos.models.TransactionDetail;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class TransactionRepositoryIntegrationTest {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void savesTransactionsWithDetailsAndLoadsThemBackByDateRange() {
        Transaction earlierTransaction = buildTransaction(
                "TX-EARLY001",
                LocalDateTime.of(2026, 4, 18, 9, 15, 0),
                "CASH",
                BigDecimal.valueOf(6000),
                buildDetail("Es Teh Cup Kecil", 2, 3000, 6000));

        Transaction laterTransaction = buildTransaction(
                "TX-LATER001",
                LocalDateTime.of(2026, 4, 19, 21, 45, 30),
                "QRIS",
                BigDecimal.valueOf(18000),
                buildDetail("Kelapa Bijian", 1, 18000, 18000));

        transactionRepository.save(earlierTransaction);
        transactionRepository.save(laterTransaction);
        entityManager.flush();
        entityManager.clear();

        List<Transaction> loadedTransactions =
                transactionRepository.findByTransactionDateBetweenOrderByTransactionDateDesc(
                        LocalDateTime.of(2026, 4, 18, 0, 0, 0),
                        LocalDateTime.of(2026, 4, 19, 23, 59, 59));

        assertThat(loadedTransactions).hasSize(2);
        assertThat(loadedTransactions)
                .extracting(Transaction::getTransactionCode)
                .containsExactly("TX-LATER001", "TX-EARLY001");

        Transaction loadedLaterTransaction = loadedTransactions.getFirst();
        assertThat(loadedLaterTransaction.getDetails()).hasSize(1);

        TransactionDetail loadedDetail = loadedLaterTransaction.getDetails().getFirst();
        assertThat(loadedDetail.getId()).isNotNull();
        assertThat(loadedDetail.getProductName()).isEqualTo("Kelapa Bijian");
        assertThat(loadedDetail.getQuantity()).isEqualTo(1);
        assertThat(loadedDetail.getPriceAtTime()).isEqualByComparingTo("18000");
        assertThat(loadedDetail.getSubtotal()).isEqualByComparingTo("18000");
    }

    private Transaction buildTransaction(String code,
                                         LocalDateTime transactionDate,
                                         String paymentMethod,
                                         BigDecimal totalAmount,
                                         TransactionDetail detail) {
        Transaction transaction = new Transaction();
        transaction.setTransactionCode(code);
        transaction.setTransactionDate(transactionDate);
        transaction.setCashierName("Owner");
        transaction.setPaymentMethod(paymentMethod);
        transaction.setTotalAmount(totalAmount);
        transaction.setAmountPaid(totalAmount);
        transaction.setChangeAmount(BigDecimal.ZERO);

        detail.setTransaction(transaction);
        transaction.setDetails(new ArrayList<>(List.of(detail)));
        return transaction;
    }

    private TransactionDetail buildDetail(String productName,
                                          int quantity,
                                          int priceAtTime,
                                          int subtotal) {
        TransactionDetail detail = new TransactionDetail();
        detail.setProductName(productName);
        detail.setQuantity(quantity);
        detail.setPriceAtTime(BigDecimal.valueOf(priceAtTime));
        detail.setSubtotal(BigDecimal.valueOf(subtotal));
        return detail;
    }
}
