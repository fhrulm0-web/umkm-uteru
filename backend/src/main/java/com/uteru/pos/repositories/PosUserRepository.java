package com.uteru.pos.repositories;

import com.uteru.pos.models.PosUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PosUserRepository extends JpaRepository<PosUser, Long> {
    List<PosUser> findByIsActiveTrueOrderByIdAsc();

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            SELECT u FROM PosUser u
            WHERE u.isActive = true
              AND (
                LOWER(u.username) = LOWER(:identity)
                OR LOWER(COALESCE(u.email, '')) = LOWER(:identity)
              )
            """)
    Optional<PosUser> findActiveByIdentity(@Param("identity") String identity);
}
