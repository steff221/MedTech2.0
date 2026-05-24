package com.medtech.domain.repository;

import com.medtech.domain.entity.EmailOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailOutboxRepository extends JpaRepository<EmailOutbox, Long> {

    @Query("SELECT e FROM EmailOutbox e WHERE e.status = 'PENDING' AND e.attempts < :maxAttempts ORDER BY e.createdAt ASC")
    List<EmailOutbox> findPendingForDelivery(@Param("maxAttempts") int maxAttempts);
}
