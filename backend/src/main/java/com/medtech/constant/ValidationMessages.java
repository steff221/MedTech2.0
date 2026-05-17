package com.medtech.constant;

/**
 * Reusable validation message keys / strings.
 * Externalisation to a ResourceBundle is a Phase 6 concern.
 */
public final class ValidationMessages {

    private ValidationMessages() {}

    public static final String EMAIL_REQUIRED     = "Email is required";
    public static final String EMAIL_FORMAT       = "Email must be a valid address";
    public static final String PASSWORD_REQUIRED  = "Password is required";
    public static final String PASSWORD_STRENGTH  =
            "Password must be at least 12 characters and contain upper, lower, digit, and special characters";
    public static final String FIRST_NAME_REQUIRED = "First name is required";
    public static final String LAST_NAME_REQUIRED  = "Last name is required";
    public static final String ROLE_REQUIRED       = "Role is required";
    public static final String REFRESH_TOKEN_REQUIRED = "Refresh token is required";
}
