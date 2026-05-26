package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.AuditLogMapper;
import com.medtech.application.dto.response.AuditLogResponse;
import com.medtech.application.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Audit log access. ADMIN-only — compliance reporting surface.
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "Compliance trail (admin only)")
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final AuditLogMapper mapper;

    @GetMapping
    @Operation(summary = "Search audit rows by user, entity, or time window")
    public ResponseEntity<Page<AuditLogResponse>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since,
            Pageable pageable) {

        // Default to last 24 hours when no explicit window is provided
        Instant effectiveSince = since != null ? since : Instant.now().minus(24, ChronoUnit.HOURS);

        Page<AuditLogResponse> page;
        if (userId != null) {
            page = auditLogService.forUser(userId, pageable).map(mapper::toResponse);
        } else if (entityType != null && entityId != null) {
            page = auditLogService.forEntity(entityType, entityId, pageable).map(mapper::toResponse);
        } else {
            page = auditLogService.recent(effectiveSince, pageable).map(mapper::toResponse);
        }
        return ResponseEntity.ok(page);
    }
}
