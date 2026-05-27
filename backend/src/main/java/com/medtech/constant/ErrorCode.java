package com.medtech.constant;

/**
 * Stable, machine-readable error codes returned in API error responses.
 * <p>Format: {@code <DOMAIN>_<KIND>}. Never renumber/rename — clients depend on these.
 */
public final class ErrorCode {

    private ErrorCode() {}

    // Generic
    public static final String VALIDATION_FAILED      = "VALIDATION_FAILED";
    public static final String RESOURCE_NOT_FOUND     = "RESOURCE_NOT_FOUND";
    public static final String CONFLICT               = "CONFLICT";
    public static final String INTERNAL_ERROR         = "INTERNAL_ERROR";
    public static final String BAD_REQUEST            = "BAD_REQUEST";
    public static final String METHOD_NOT_ALLOWED     = "METHOD_NOT_ALLOWED";

    // Authentication / authorization
    public static final String AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS";
    public static final String AUTH_ACCOUNT_LOCKED      = "AUTH_ACCOUNT_LOCKED";
    public static final String AUTH_ACCOUNT_INACTIVE    = "AUTH_ACCOUNT_INACTIVE";
    public static final String AUTH_TOKEN_INVALID       = "AUTH_TOKEN_INVALID";
    public static final String AUTH_TOKEN_EXPIRED       = "AUTH_TOKEN_EXPIRED";
    public static final String AUTH_FORBIDDEN           = "AUTH_FORBIDDEN";
    public static final String AUTH_EMAIL_TAKEN              = "AUTH_EMAIL_TAKEN";
    public static final String AUTH_RESET_TOKEN_INVALID      = "AUTH_RESET_TOKEN_INVALID";

    // Domain
    public static final String APPOINTMENT_CONFLICT               = "APPOINTMENT_CONFLICT";
    public static final String APPOINTMENT_IN_PAST                = "APPOINTMENT_IN_PAST";
    public static final String APPOINTMENT_CANCEL_WINDOW          = "APPOINTMENT_CANCEL_WINDOW";
    public static final String APPOINTMENT_OUTSIDE_AVAILABILITY   = "APPOINTMENT_OUTSIDE_AVAILABILITY";
    public static final String PRESCRIPTION_REFILLS_EXHAUSTED = "PRESCRIPTION_REFILLS_EXHAUSTED";
    public static final String PRESCRIPTION_EXPIRED         = "PRESCRIPTION_EXPIRED";
    public static final String MEDICAL_RECORD_IMMUTABLE     = "MEDICAL_RECORD_IMMUTABLE";
}
