package com.medtech.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtech.domain.entity.AuditLog;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.AuditLogRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.AuditAction;
import com.medtech.domain.vo.AuditStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Compliance-grade audit trail.
 *
 * <p>The PostgreSQL triggers ({@code fn_users_audit}, {@code fn_appointments_audit},
 * {@code fn_prescriptions_audit}) already capture insert / update / delete on
 * those tables. This service captures the events the database cannot see on
 * its own: {@link AuditAction#LOGIN}, {@link AuditAction#LOGOUT},
 * {@link AuditAction#VIEW}, and request-context metadata (IP, user-agent).
 *
 * <p>Writes use {@link Propagation#REQUIRES_NEW} so an audit insert never
 * rolls back when the surrounding business transaction fails — audit is
 * append-only by regulation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /** Convenience overload for callers that only have a userId (e.g. controllers). */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordByUserId(Long userId,
                               AuditAction action,
                               String entityType,
                               Long entityId,
                               String description,
                               String ipAddress,
                               String userAgent,
                               AuditStatus status) {
        userRepository.findById(userId).ifPresent(user ->
            record(user, action, entityType, entityId, null, description, ipAddress, userAgent, status)
        );
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(User user,
                       AuditAction action,
                       String entityType,
                       Long entityId,
                       Object newValues,
                       String description,
                       String ipAddress,
                       String userAgent,
                       AuditStatus status) {
        try {
            AuditLog row = new AuditLog();
            row.setUser(user);
            row.setActionType(action);
            row.setEntityType(entityType);
            row.setEntityId(entityId);
            row.setNewValues(toJsonOrNull(newValues));
            row.setDescription(description);
            row.setIpAddress(ipAddress);
            row.setUserAgent(userAgent);
            row.setStatus(status);
            auditLogRepository.save(row);
        } catch (RuntimeException ex) {
            // Audit must never break the caller; log and swallow.
            log.error("Failed to write audit row action={} entity={} id={}", action, entityType, entityId, ex);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> forUser(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> forEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> recent(Instant since, Pageable pageable) {
        return auditLogRepository.findByCreatedAtAfterOrderByCreatedAtDesc(since, pageable);
    }

    private String toJsonOrNull(Object payload) {
        if (payload == null) return null;
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialise audit payload of type {}", payload.getClass(), ex);
            return null;
        }
    }
}
