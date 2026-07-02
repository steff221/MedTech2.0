package com.medtech.application.dto.response;

import com.medtech.domain.vo.PrescriptionRoute;
import com.medtech.domain.vo.PrescriptionStatus;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Излезен DTO: податоци за рецепт што се враќаат кон клиентот.
 */
@Builder
public record PrescriptionResponse(
        Long id,
        Long patientId,
        Long doctorId,
        String doctorName,
        Long medicalRecordId,
        String medicationName,
        String dosage,
        String frequency,
        Integer durationDays,
        Integer quantity,
        PrescriptionRoute route,
        String instructions,
        LocalDate startDate,
        LocalDate endDate,
        PrescriptionStatus status,
        LocalDate filledAtPharmacy,
        String pharmacyName,
        int refillsAllowed,
        int refillsUsed,
        Instant createdAt
) {}
