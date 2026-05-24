package com.medtech.domain.repository;

import com.medtech.domain.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true, t.usedAt = :now WHERE t.user.id = :userId AND t.used = false")
    int invalidateAllForUser(@Param("userId") Long userId, @Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :cutoff")
    int deleteExpired(@Param("cutoff") Instant cutoff);
}
