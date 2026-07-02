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

/**
 * Spring Data JPA репозиториум: пристап до записите од ревизорскиот лог.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByCreatedAtAfterOrderByCreatedAtDesc(Instant since, Pageable pageable);

    Page<AuditLog> findByUserId(Long userId, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);

    Page<AuditLog> findByActionType(AuditAction actionType, Pageable pageable);

    /** Distinct patient IDs viewed by a user in the given time window. */
    @Query(value = """
           SELECT COUNT(DISTINCT entity_id)
           FROM audit_logs
           WHERE user_id = :userId
             AND entity_type = 'Patient'
             AND action_type = 'VIEW'::audit_action_enum
             AND created_at >= :since
           """, nativeQuery = true)
    long countDistinctPatientsViewedByUserSince(@Param("userId") Long userId,
                                                @Param("since") Instant since);

    /** Failed LOGIN attempts from a given IP since the given instant. */
    @Query(value = """
           SELECT COUNT(*)
           FROM audit_logs
           WHERE action_type = 'LOGIN'::audit_action_enum
             AND status = 'FAILURE'::audit_status_enum
             AND ip_address = :ip
             AND created_at >= :since
           """, nativeQuery = true)
    long countFailedLoginsByIpSince(@Param("ip") String ip, @Param("since") Instant since);

    /** All users who performed VIEW actions since a given instant (for bulk-access scan). */
    @Query(value = """
           SELECT DISTINCT user_id FROM audit_logs
           WHERE action_type = 'VIEW'::audit_action_enum
             AND entity_type = 'Patient'
             AND created_at >= :since
             AND user_id IS NOT NULL
           """, nativeQuery = true)
    List<Long> findUserIdsWithPatientViewsSince(@Param("since") Instant since);

    /** Off-hours VIEW entries (hour < 6 or hour >= 22) since the given instant. */
    @Query(value = """
           SELECT * FROM audit_logs
           WHERE action_type = 'VIEW'::audit_action_enum
             AND entity_type IN ('Patient', 'MedicalRecord')
             AND created_at >= :since
             AND (EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Skopje') < 6
                  OR EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Skopje') >= 22)
           """, nativeQuery = true)
    List<AuditLog> findOffHoursAccessesSince(@Param("since") Instant since);

    /** Distinct IPs with failed logins since the given instant. */
    @Query(value = """
           SELECT DISTINCT ip_address FROM audit_logs
           WHERE action_type = 'LOGIN'::audit_action_enum
             AND status = 'FAILURE'::audit_status_enum
             AND created_at >= :since
             AND ip_address IS NOT NULL
           """, nativeQuery = true)
    List<String> findIpsWithFailedLoginsSince(@Param("since") Instant since);
}
