package com.medtech.domain.vo;

/**
 * Mirror of PostgreSQL ENUM {@code user_role_enum}.
 * Values MUST match the database enum literals exactly (case-sensitive).
 */
public enum UserRole {
    PATIENT,
    DOCTOR,
    GENERAL_PRACTITIONER,
    NURSE,
    ADMIN
}
