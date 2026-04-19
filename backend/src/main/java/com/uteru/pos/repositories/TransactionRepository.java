package com.uteru.pos.repositories;

import com.uteru.pos.models.Transaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    @EntityGraph(attributePaths = {"details", "details.product", "details.product.category"})
    List<Transaction> findByTransactionDateBetweenOrderByTransactionDateDesc(LocalDateTime start, LocalDateTime end);
}
