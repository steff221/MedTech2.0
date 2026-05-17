package com.medtech.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateDoctorRequest(
        @NotNull Long hospitalId,
        @NotBlank @Size(max = 100) String licenseNumber,
        @NotBlank @Size(max = 255) String specialization,
        @Size(max = 255) String subSpecialization,
        @Size(max = 500) String qualification,
        @PositiveOrZero Integer experienceYears,
        @Size(max = 50)  String officeNumber,
        @PositiveOrZero BigDecimal consultationFee,
        @Size(max = 255) String availabilityHours,
        @Size(max = 5000) String bio
) {}
