package com.medtech.domain.repository;

/**
 * Projection of one user's aggregated access behaviour over a time window, used to feed
 * the ML access-anomaly scorer. Mirrors {@code AccessAnomalyScoreRequest.Features}.
 *
 * <p>Aggregated in a single native query (see
 * {@link AuditLogRepository#aggregateUserAccessSince}) so the AnomalyDetectionJob makes
 * one round-trip rather than N per active user.
 */
public interface UserAccessFeatures {
    Long getUserId();
    int getTotalActions();
    int getDistinctPatientsViewed();
    int getOffHoursActions();
    int getDistinctIps();
    int getFailedActions();
    int getDistinctEntityTypes();
}
