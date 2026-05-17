package com.medtech.domain.vo;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Immutable value object for an MKB-10 diagnostic code
 * (Macedonian ICD-10 implementation, e.g. {@code I10}, {@code E11.9}).
 *
 * <p>Format: 1 letter, 2 digits, optional dot + 1–2 digits.
 */
public record MKB10Code(String value) {

    private static final Pattern PATTERN = Pattern.compile("^[A-Z]\\d{2}(\\.\\d{1,2})?$");

    public MKB10Code {
        Objects.requireNonNull(value, "MKB-10 code must not be null");
        if (!PATTERN.matcher(value).matches()) {
            throw new IllegalArgumentException("Invalid MKB-10 code: " + value);
        }
    }

    public static MKB10Code of(String raw) {
        return new MKB10Code(raw);
    }

    @Override
    public String toString() {
        return value;
    }
}
