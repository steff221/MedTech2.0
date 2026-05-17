package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code operation_status_enum}. */
public enum OperationStatus {
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
