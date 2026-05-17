package com.medtech.application.dto.response;

import com.medtech.domain.vo.AuditAction;
import com.medtech.domain.vo.AuditStatus;
import lombok.Builder;

import java.time.Instant;

@Builder
public record AuditLogResponse(
        Long id,
        Long userId,
        AuditAction actionType,
        String entityType,
        Long entityId,
        String oldValues,
        String newValues,
        String description,
        String ipAddress,
        String userAgent,
        AuditStatus status,
        Instant createdAt
) {}
