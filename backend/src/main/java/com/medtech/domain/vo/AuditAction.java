package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code audit_action_enum}. */
public enum AuditAction {
    INSERT,
    UPDATE,
    DELETE,
    VIEW,
    LOGIN,
    LOGOUT
}
