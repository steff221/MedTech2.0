package com.medtech.application.service;

import com.medtech.domain.repository.AuditLogRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scans recent audit logs every 15 minutes for three anomaly patterns:
 * <ol>
 *   <li>Bulk access — a single user viewed more than {@value #BULK_THRESHOLD} distinct
 *       patients in the last hour.</li>
 *   <li>Off-hours access — any VIEW of a Patient or MedicalRecord between 22:00–06:00
 *       (Europe/Skopje) in the last 15 minutes.</li>
 *   <li>Failed-login surge — an IP had more than {@value #FAILED_LOGIN_THRESHOLD} failed
 *       login attempts in the last 15 minutes.</li>
 * </ol>
 * Detected anomalies generate an ANOMALY notification sent to every ADMIN user.
 *
 * Закажана задача (job): детектира сомнителни/аномални пристапи во ревизорскиот лог.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnomalyDetectionJob {

    static final int  BULK_THRESHOLD         = 10;
    static final int  FAILED_LOGIN_THRESHOLD = 5;
    static final long BULK_WINDOW_MINUTES    = 60;
    static final long SHORT_WINDOW_MINUTES   = 15;
    // Suppress duplicate alerts for the same key within this window
    static final long DEDUP_WINDOW_MINUTES   = 60;

    private final AuditLogRepository auditLogRepository;
    private final UserRepository     userRepository;
    private final NotificationService notificationService;

    // In-memory dedup: alertKey → time last alerted. Resets on restart which is acceptable.
    private final java.util.concurrent.ConcurrentHashMap<String, Instant> recentAlerts =
            new java.util.concurrent.ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 900_000) // every 15 minutes
    public void scan() {
        try {
            Instant now        = Instant.now();
            Instant oneHourAgo = now.minus(BULK_WINDOW_MINUTES, ChronoUnit.MINUTES);
            Instant fifteenAgo = now.minus(SHORT_WINDOW_MINUTES, ChronoUnit.MINUTES);

            checkBulkAccess(oneHourAgo);
            checkOffHoursAccess(fifteenAgo);
            checkFailedLoginSurge(fifteenAgo);

            // Evict expired dedup entries
            Instant dedupCutoff = now.minus(DEDUP_WINDOW_MINUTES, ChronoUnit.MINUTES);
            recentAlerts.entrySet().removeIf(e -> e.getValue().isBefore(dedupCutoff));
        } catch (Exception ex) {
            log.error("AnomalyDetectionJob.scan failed — will retry next cycle", ex);
        }
    }

    private boolean isDuplicate(String key) {
        Instant cutoff = Instant.now().minus(DEDUP_WINDOW_MINUTES, ChronoUnit.MINUTES);
        Instant last = recentAlerts.get(key);
        if (last != null && last.isAfter(cutoff)) return true;
        recentAlerts.put(key, Instant.now());
        return false;
    }

    private void checkBulkAccess(Instant since) {
        List<Long> activeUsers = auditLogRepository.findUserIdsWithPatientViewsSince(since);
        for (Long userId : activeUsers) {
            long count = auditLogRepository.countDistinctPatientsViewedByUserSince(userId, since);
            if (count > BULK_THRESHOLD) {
                String key = "bulk_access:" + userId;
                if (isDuplicate(key)) continue;
                String msg = "User id=" + userId + " accessed " + count
                        + " distinct patient records within the last hour (threshold: " + BULK_THRESHOLD + ").";
                log.warn("ANOMALY bulk_access — {}", msg);
                notifyAdmins("ANOMALY", "Bulk Patient Access Detected", msg);
            }
        }
    }

    private void checkOffHoursAccess(Instant since) {
        var entries = auditLogRepository.findOffHoursAccessesSince(since);
        if (!entries.isEmpty()) {
            String key = "off_hours";
            if (isDuplicate(key)) return;
            String msg = entries.size() + " off-hours record access event(s) detected between 22:00–06:00.";
            log.warn("ANOMALY off_hours — {}", msg);
            notifyAdmins("ANOMALY", "Off-Hours Access Detected", msg);
        }
    }

    private void checkFailedLoginSurge(Instant since) {
        List<String> ips = auditLogRepository.findIpsWithFailedLoginsSince(since);
        for (String ip : ips) {
            long count = auditLogRepository.countFailedLoginsByIpSince(ip, since);
            if (count > FAILED_LOGIN_THRESHOLD) {
                String key = "failed_login:" + ip;
                if (isDuplicate(key)) continue;
                String msg = "IP " + ip + " had " + count
                        + " failed login attempts in the last 15 minutes (threshold: " + FAILED_LOGIN_THRESHOLD + ").";
                log.warn("ANOMALY failed_login_surge — {}", msg);
                notifyAdmins("ANOMALY", "Failed Login Surge Detected", msg);
            }
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void notifyAdmins(String type, String title, String body) {
        userRepository.findAllByRoleIn(List.of(UserRole.ADMIN), PageRequest.of(0, 50))
                .forEach(admin -> notificationService.create(admin.getId(), type, title, body, null));
    }
}
