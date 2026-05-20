package com.medtech.infrastructure.validation;

/**
 * Lightweight XSS/HTML sanitizer for free-text fields stored in the database.
 * Strips angle-bracket tags and encodes the five dangerous HTML entities.
 * Apply at service boundaries before persisting user-supplied strings.
 */
public final class Sanitizer {

    private Sanitizer() {}

    /** Strip HTML tags and encode the five dangerous HTML entities. */
    public static String sanitize(String input) {
        if (input == null) return null;
        return input
                .replaceAll("<[^>]*>", "")
                .replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    /** Sanitize only if non-null, return null otherwise. */
    public static String sanitizeOrNull(String input) {
        return input == null ? null : sanitize(input);
    }
}
