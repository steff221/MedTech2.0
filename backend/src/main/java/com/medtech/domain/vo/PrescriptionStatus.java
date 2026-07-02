package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code prescription_status_enum}. */
/**
 * Енумерација: можни статуси на рецепт (активен, повлечен, истечен).
 */
public enum PrescriptionStatus {
    ACTIVE,
    COMPLETED,
    CANCELLED,
    SUSPENDED
}
