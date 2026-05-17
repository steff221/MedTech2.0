package com.medtech.application.dto.request;

import com.medtech.domain.vo.PrescriptionRoute;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record IssuePrescriptionRequest(
        @NotNull Long patientId,
        Long medicalRecordId,

        @NotBlank @Size(max = 255) String medicationName,
        @NotBlank @Size(max = 100) String dosage,
        @NotBlank @Size(max = 100) String frequency,
        @Positive Integer durationDays,
        @Positive Integer quantity,
        PrescriptionRoute route,
        @Size(max = 4000) String instructions,
        @NotNull LocalDate startDate,
        LocalDate endDate,
        @PositiveOrZero Integer refillsAllowed
) {}
