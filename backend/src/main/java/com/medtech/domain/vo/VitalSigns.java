package com.medtech.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;

/**
 * Immutable value object capturing a snapshot of patient vital signs.
 * Persisted in {@code medical_records.vital_signs} as {@code JSONB}.
 *
 * <p>All fields nullable to represent partial recordings.
 *
 * Value object: виталните знаци на пациент (крвен притисок, пулс, температура...).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record VitalSigns(
        String bloodPressure,         // e.g. "120/80"
        Integer heartRateBpm,
        BigDecimal temperatureCelsius,
        Integer respiratoryRateBpm,
        Integer oxygenSaturationPercent,
        BigDecimal weightKg,
        BigDecimal heightCm
) {
    public static VitalSigns empty() {
        return new VitalSigns(null, null, null, null, null, null, null);
    }
}
