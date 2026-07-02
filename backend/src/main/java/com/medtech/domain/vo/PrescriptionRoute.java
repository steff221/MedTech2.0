package com.medtech.domain.vo;

/** Mirror of PostgreSQL ENUM {@code prescription_route_enum}. */
/**
 * Енумерација: начин на примање на лекот (на пр. орално, интравенозно).
 */
public enum PrescriptionRoute {
    ORAL,
    INJECTION,
    TOPICAL,
    INHALED,
    IV,
    IM,
    SC
}
