package com.medtech.application.service;

import com.medtech.domain.entity.User;
import com.medtech.domain.repository.AuditLogRepository;
import com.medtech.domain.repository.UserAccessFeatures;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.ml.AccessAnomalyScoreResponse;
import com.medtech.infrastructure.ml.AnomalyScoreClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static com.medtech.application.service.AnomalyDetectionJob.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnomalyDetectionJobTest {

    @Mock AuditLogRepository  auditLogRepository;
    @Mock UserRepository      userRepository;
    @Mock NotificationService notificationService;
    @Mock AnomalyScoreClient  anomalyScoreClient;

    AnomalyDetectionJob job;
    User admin;

    @BeforeEach
    void setUp() {
        job   = new AnomalyDetectionJob(auditLogRepository, userRepository, notificationService, anomalyScoreClient);
        admin = Entities.user(100L, UserRole.ADMIN);

        // default stubs — no anomalies
        lenient().when(auditLogRepository.findUserIdsWithPatientViewsSince(any())).thenReturn(List.of());
        lenient().when(auditLogRepository.findOffHoursAccessesSince(any())).thenReturn(List.of());
        lenient().when(auditLogRepository.findIpsWithFailedLoginsSince(any())).thenReturn(List.of());
        lenient().when(auditLogRepository.aggregateUserAccessSince(any())).thenReturn(List.of());
        lenient().when(anomalyScoreClient.scoreAccessAnomaly(anyLong(), any())).thenReturn(Optional.empty());
        lenient().when(userRepository.findAllByRoleIn(anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(admin)));
    }

    /** Minimal UserAccessFeatures stub for the behavioural-anomaly test. */
    private static UserAccessFeatures accessRow(long userId) {
        return new UserAccessFeatures() {
            public Long getUserId() { return userId; }
            public int getTotalActions() { return 80; }
            public int getDistinctPatientsViewed() { return 40; }
            public int getOffHoursActions() { return 70; }
            public int getDistinctIps() { return 4; }
            public int getFailedActions() { return 10; }
            public int getDistinctEntityTypes() { return 3; }
        };
    }

    @Test
    void scan_noAnomalies_sendsNoNotifications() {
        job.scan();

        verify(notificationService, never()).create(anyLong(), any(), any(), any(), any());
    }

    @Test
    void scan_bulkAccess_aboveThreshold_notifiesAdmins() {
        when(auditLogRepository.findUserIdsWithPatientViewsSince(any())).thenReturn(List.of(42L));
        when(auditLogRepository.countDistinctPatientsViewedByUserSince(eq(42L), any(Instant.class)))
                .thenReturn((long) BULK_THRESHOLD + 1);
        when(userRepository.findAllByRoleIn(anyList(), any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(admin)));

        job.scan();

        verify(notificationService).create(eq(admin.getId()), eq("ANOMALY"),
                contains("Bulk"), anyString(), isNull());
    }

    @Test
    void scan_bulkAccess_atThreshold_doesNotNotify() {
        when(auditLogRepository.findUserIdsWithPatientViewsSince(any())).thenReturn(List.of(42L));
        when(auditLogRepository.countDistinctPatientsViewedByUserSince(eq(42L), any(Instant.class)))
                .thenReturn((long) BULK_THRESHOLD);

        job.scan();

        verify(notificationService, never()).create(anyLong(), any(), any(), any(), any());
    }

    @Test
    void scan_offHoursAccess_notifiesAdmins() {
        var fakeEntry = new com.medtech.domain.entity.AuditLog();
        when(auditLogRepository.findOffHoursAccessesSince(any())).thenReturn(List.of(fakeEntry));
        when(userRepository.findAllByRoleIn(anyList(), any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(admin)));

        job.scan();

        verify(notificationService).create(eq(admin.getId()), eq("ANOMALY"),
                contains("Off-Hours"), anyString(), isNull());
    }

    @Test
    void scan_failedLoginSurge_aboveThreshold_notifiesAdmins() {
        String ip = "192.168.1.1";
        when(auditLogRepository.findIpsWithFailedLoginsSince(any())).thenReturn(List.of(ip));
        when(auditLogRepository.countFailedLoginsByIpSince(eq(ip), any(Instant.class)))
                .thenReturn((long) FAILED_LOGIN_THRESHOLD + 1);
        when(userRepository.findAllByRoleIn(anyList(), any(PageRequest.class))).thenReturn(new PageImpl<>(List.of(admin)));

        job.scan();

        verify(notificationService).create(eq(admin.getId()), eq("ANOMALY"),
                contains("Failed Login"), anyString(), isNull());
    }

    @Test
    void scan_failedLoginSurge_atThreshold_doesNotNotify() {
        String ip = "10.0.0.1";
        when(auditLogRepository.findIpsWithFailedLoginsSince(any())).thenReturn(List.of(ip));
        when(auditLogRepository.countFailedLoginsByIpSince(eq(ip), any(Instant.class)))
                .thenReturn((long) FAILED_LOGIN_THRESHOLD);

        job.scan();

        verify(notificationService, never()).create(anyLong(), any(), any(), any(), any());
    }

    @Test
    void scan_behavioralAnomaly_highBand_notifiesAdmins() {
        when(auditLogRepository.aggregateUserAccessSince(any())).thenReturn(List.of(accessRow(42L)));
        when(anomalyScoreClient.scoreAccessAnomaly(eq(42L), any())).thenReturn(Optional.of(
                new AccessAnomalyScoreResponse(42L, 0.92, "HIGH",
                        List.of("distinct_patients_viewed", "off_hours_actions"), "access-iforest-v1")));

        job.scan();

        verify(notificationService).create(eq(admin.getId()), eq("ANOMALY"),
                contains("Behavioral"), anyString(), isNull());
    }

    @Test
    void scan_behavioralAnomaly_nonHighBand_doesNotNotify() {
        when(auditLogRepository.aggregateUserAccessSince(any())).thenReturn(List.of(accessRow(42L)));
        when(anomalyScoreClient.scoreAccessAnomaly(eq(42L), any())).thenReturn(Optional.of(
                new AccessAnomalyScoreResponse(42L, 0.40, "MEDIUM", List.of("total_actions"), "access-iforest-v1")));

        job.scan();

        verify(notificationService, never()).create(anyLong(), any(), any(), any(), any());
    }

    @Test
    void scan_behavioralAnomaly_scoringDisabledOrDown_doesNotNotify() {
        // Client returns empty (ML disabled or service unavailable) — best-effort no-op.
        when(auditLogRepository.aggregateUserAccessSince(any())).thenReturn(List.of(accessRow(42L)));
        when(anomalyScoreClient.scoreAccessAnomaly(anyLong(), any())).thenReturn(Optional.empty());

        job.scan();

        verify(notificationService, never()).create(anyLong(), any(), any(), any(), any());
    }

    @Test
    void scan_multipleAdmins_eachReceivesNotification() {
        User admin2 = Entities.user(101L, UserRole.ADMIN);
        when(auditLogRepository.findOffHoursAccessesSince(any()))
                .thenReturn(List.of(new com.medtech.domain.entity.AuditLog()));
        when(userRepository.findAllByRoleIn(anyList(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(admin, admin2)));

        job.scan();

        verify(notificationService).create(eq(admin.getId()),  eq("ANOMALY"), any(), any(), isNull());
        verify(notificationService).create(eq(admin2.getId()), eq("ANOMALY"), any(), any(), isNull());
    }
}
