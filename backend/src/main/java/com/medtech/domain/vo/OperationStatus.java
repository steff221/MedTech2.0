package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code operation_status_enum}. */
/**
 * Енумерација: можни статуси на операција.
 */
public enum OperationStatus {
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
