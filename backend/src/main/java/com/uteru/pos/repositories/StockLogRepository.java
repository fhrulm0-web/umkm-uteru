package com.uteru.pos.repositories;

import com.uteru.pos.models.StockLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockLogRepository extends JpaRepository<StockLog, Long> {
    Optional<StockLog> findByProductIdAndLogDate(Long productId, LocalDate logDate);
    List<StockLog> findByLogDate(LocalDate logDate);
}
