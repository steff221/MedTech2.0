package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code appointment_status_enum}. */
/**
 * Енумерација: можни статуси на термин (на пр. закажан, потврден, откажан).
 */
public enum AppointmentStatus {
    SCHEDULED,
    COMPLETED,
    CANCELLED,
    NO_SHOW,
    RESCHEDULED;

    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED || this == NO_SHOW;
    }
}
