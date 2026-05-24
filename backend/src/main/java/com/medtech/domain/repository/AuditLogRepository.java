package com.medtech.domain.repository;

import com.medtech.domain.entity.AuditLog;
import com.medtech.domain.vo.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByUserId(Long userId, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);

    Page<AuditLog> findByActionType(AuditAction actionType, Pageable pageable);

    /** Distinct patient IDs viewed by a user in the given time window. */
    @Query("""
           SELECT COUNT(DISTINCT a.entityId)
           FROM AuditLog a
           WHERE a.user.id = :userId
             AND a.entityType = 'Patient'
             AND a.actionType = com.medtech.domain.vo.AuditAction.VIEW
             AND a.createdAt >= :since
           """)
    long countDistinctPatientsViewedByUserSince(@Param("userId") Long userId,
                                                @Param("since") Instant since);

    /** Failed LOGIN attempts from a given IP since the given instant. */
    @Query("""
           SELECT COUNT(a)
           FROM AuditLog a
           WHERE a.actionType = com.medtech.domain.vo.AuditAction.LOGIN
             AND a.status = com.medtech.domain.vo.AuditStatus.FAILURE
             AND a.ipAddress = :ip
             AND a.createdAt >= :since
           """)
    long countFailedLoginsByIpSince(@Param("ip") String ip, @Param("since") Instant since);

    /** All users who performed VIEW actions since a given instant (for bulk-access scan). */
    @Query("""
           SELECT DISTINCT a.user.id FROM AuditLog a
           WHERE a.actionType = com.medtech.domain.vo.AuditAction.VIEW
             AND a.entityType = 'Patient'
             AND a.createdAt >= :since
             AND a.user IS NOT NULL
           """)
    List<Long> findUserIdsWithPatientViewsSince(@Param("since") Instant since);

    /** Off-hours VIEW entries (hour < 6 or hour >= 22) since the given instant. */
    @Query(value = """
           SELECT * FROM audit_logs
           WHERE action_type = 'VIEW'
             AND entity_type IN ('Patient', 'MedicalRecord')
             AND created_at >= :since
             AND (EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Skopje') < 6
                  OR EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Skopje') >= 22)
           """, nativeQuery = true)
    List<AuditLog> findOffHoursAccessesSince(@Param("since") Instant since);

    /** Distinct IPs with failed logins since the given instant. */
    @Query("""
           SELECT DISTINCT a.ipAddress FROM AuditLog a
           WHERE a.actionType = com.medtech.domain.vo.AuditAction.LOGIN
             AND a.status = com.medtech.domain.vo.AuditStatus.FAILURE
             AND a.createdAt >= :since
             AND a.ipAddress IS NOT NULL
           """)
    List<String> findIpsWithFailedLoginsSince(@Param("since") Instant since);
}
