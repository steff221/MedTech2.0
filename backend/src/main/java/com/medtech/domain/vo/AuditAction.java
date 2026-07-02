package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code audit_action_enum}. */
/**
 * Енумерација: видови дејства што се запишуваат во ревизорскиот лог.
 */
public enum AuditAction {
    INSERT,
    UPDATE,
    DELETE,
    VIEW,
    LOGIN,
    LOGOUT
}
