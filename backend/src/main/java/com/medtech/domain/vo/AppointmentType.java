package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code appointment_type_enum}. */
/**
 * Енумерација: тип на термин (на пр. во живо, видео).
 */
public enum AppointmentType {
    CONSULTATION,
    FOLLOW_UP,
    PROCEDURE,
    CHECKUP,
    VIRTUAL
}
