package com.medtech.infrastructure.security;

/**
 * Central source of truth for Spring Security role expression strings.
 * Use these constants in @PreAuthorize to avoid typos and make future
 * role additions a single-file change.
 *
 * Константи: имиња на улогите/овластувањата што се користат во безбедносните правила.
 */
public final class Roles {

    public static final String CLINICIAN   = "hasAnyRole('DOCTOR', 'GENERAL_PRACTITIONER')";
    public static final String CARE_TEAM   = "hasAnyRole('DOCTOR', 'GENERAL_PRACTITIONER', 'NURSE')";
    public static final String PATIENT     = "hasRole('PATIENT')";
    public static final String ADMIN       = "hasRole('ADMIN')";
    public static final String AUTHENTICATED = "isAuthenticated()";

    // Common combinations
    public static final String PATIENT_OR_CLINICIAN  = "hasAnyRole('PATIENT', 'DOCTOR', 'GENERAL_PRACTITIONER')";
    public static final String PATIENT_OR_CARE_TEAM  = "hasAnyRole('PATIENT', 'DOCTOR', 'GENERAL_PRACTITIONER', 'NURSE')";
    public static final String CARE_TEAM_OR_ADMIN    = "hasAnyRole('DOCTOR', 'GENERAL_PRACTITIONER', 'NURSE', 'ADMIN')";

    private Roles() {}
}
