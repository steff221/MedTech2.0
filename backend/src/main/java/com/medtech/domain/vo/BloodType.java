package com.medtech.domain.vo;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;
import java.util.Optional;

/**
 * Immutable value object representing an ABO/Rh blood type.
 *
 * <p>The PostgreSQL {@code blood_type_enum} literals ({@code O+}, {@code A-}, …)
 * contain {@code +}/{@code -} characters that are illegal in Java identifiers,
 * so the corresponding entity field is persisted as a {@code String} and wrapped
 * by this value object at the service / DTO layer.
 *
 * <p>JSON serialization uses the short API name ({@code O_POS}, {@code A_NEG}, …)
 * to match the TypeScript {@code BloodType} union type on the frontend.
 *
 * Енумерација: крвни групи (A, B, AB, 0 со Rh фактор).
 */
public enum BloodType {
    O_POSITIVE ("O+",  "O_POS"),
    O_NEGATIVE ("O-",  "O_NEG"),
    A_POSITIVE ("A+",  "A_POS"),
    A_NEGATIVE ("A-",  "A_NEG"),
    B_POSITIVE ("B+",  "B_POS"),
    B_NEGATIVE ("B-",  "B_NEG"),
    AB_POSITIVE("AB+", "AB_POS"),
    AB_NEGATIVE("AB-", "AB_NEG");

    private final String dbValue;
    private final String apiName;

    BloodType(String dbValue, String apiName) {
        this.dbValue = dbValue;
        this.apiName = apiName;
    }

    public String dbValue() {
        return dbValue;
    }

    /** Used by Jackson to serialize this enum — produces {@code "O_POS"}, {@code "A_NEG"}, etc. */
    @JsonValue
    public String apiName() {
        return apiName;
    }

    /** Used by Jackson to deserialize — accepts both {@code "O_POS"} and {@code "O_POSITIVE"}. */
    @JsonCreator
    public static BloodType fromJson(String value) {
        if (value == null) return null;
        return Arrays.stream(values())
                .filter(bt -> bt.apiName.equals(value) || bt.name().equals(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Непозната крвна група: " + value));
    }

    public static Optional<BloodType> fromDbValue(String raw) {
        if (raw == null) return Optional.empty();
        return Arrays.stream(values())
                .filter(bt -> bt.dbValue.equals(raw))
                .findFirst();
    }

    public static BloodType requireFromDbValue(String raw) {
        return fromDbValue(raw).orElseThrow(
                () -> new IllegalArgumentException("Непозната крвна група: " + raw));
    }
}
