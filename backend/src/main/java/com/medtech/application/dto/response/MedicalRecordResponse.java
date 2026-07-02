package com.medtech.application.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Излезен DTO: податоци за медицински картон што се враќаат кон клиентот.
 */
@Builder
public record MedicalRecordResponse(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String doctorSpecialization,
        Long hospitalId,
        Long appointmentId,
        String diagnosis,
        String mkb10Code,
        String clinicalNotes,
        /** Raw JSONB payload — clients deserialise into their own {@code VitalSigns} model. */
        String vitalSigns,
        String bloodPressure,
        Integer heartRate,
        BigDecimal temperature,
        BigDecimal weight,
        BigDecimal height,
        BigDecimal bmi,
        String assessment,
        String plan,
        boolean confidential,
        Instant createdAt,
        Instant updatedAt
) {}
