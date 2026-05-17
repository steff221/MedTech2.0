package com.medtech.domain.vo;

import java.util.Arrays;
import java.util.Optional;

/**
 * Immutable value object representing an ABO/Rh blood type.
 *
 * <p>The PostgreSQL {@code blood_type_enum} literals ({@code O+}, {@code A-}, …)
 * contain {@code +}/{@code -} characters that are illegal in Java identifiers,
 * so the corresponding entity field is persisted as a {@code String} and wrapped
 * by this value object at the service / DTO layer.
 */
public enum BloodType {
    O_POSITIVE ("O+"),
    O_NEGATIVE ("O-"),
    A_POSITIVE ("A+"),
    A_NEGATIVE ("A-"),
    B_POSITIVE ("B+"),
    B_NEGATIVE ("B-"),
    AB_POSITIVE("AB+"),
    AB_NEGATIVE("AB-");

    private final String dbValue;

    BloodType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String dbValue() {
        return dbValue;
    }

    public static Optional<BloodType> fromDbValue(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(bt -> bt.dbValue.equals(raw))
                .findFirst();
    }

    public static BloodType requireFromDbValue(String raw) {
        return fromDbValue(raw).orElseThrow(
                () -> new IllegalArgumentException("Unknown blood type: " + raw));
    }
}
