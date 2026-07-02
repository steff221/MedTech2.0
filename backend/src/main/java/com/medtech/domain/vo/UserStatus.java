package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code user_status_enum}. Reused by {@code doctors.status}. */
/**
 * Енумерација: статус на корисничка сметка (активна, блокирана и сл.).
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED
}
