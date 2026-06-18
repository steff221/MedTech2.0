package com.medtech.infrastructure.security;

import com.medtech.application.service.AuditLogService;
import com.medtech.domain.vo.AuditAction;
import com.medtech.domain.vo.AuditStatus;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Records a {@link AuditAction#VIEW} audit row whenever PHI (protected health
 * information) is read. HIPAA's audit-controls rule (45 CFR §164.312(b))
 * requires every disclosure of PHI to be traceable to a user, a time, and an
 * origin — including reads, which database triggers cannot see.
 *
 * <p>Call this after the {@link PatientAccessGuard} check passes, so denied
 * attempts surface as {@code AuthorizationException}s and successful reads are
 * logged here.
 */
@Component
@RequiredArgsConstructor
public class PhiViewAuditor {

    private final AuditLogService auditLogService;

    public void recordView(String entityType, Long entityId, String description, HttpServletRequest request) {
        SecurityUtils.currentUserId().ifPresent(uid ->
            auditLogService.recordByUserId(uid, AuditAction.VIEW, entityType, entityId,
                description, clientIp(request), request.getHeader("User-Agent"), AuditStatus.SUCCESS));
    }

    public static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }
}
