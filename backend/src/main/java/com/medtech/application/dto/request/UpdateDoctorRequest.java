package com.medtech.application.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Влезен DTO: барање за ажурирање на податоци на доктор.
 */
public record UpdateDoctorRequest(
        @Size(max = 500) String qualification,
        @PositiveOrZero Integer experienceYears,
        @Size(max = 50)  String officeNumber,

        /** Факсимил — the Fund-issued stamp number printed beside the signature. */
        @Size(max = 20)  String facsimileNumber,
        @PositiveOrZero BigDecimal consultationFee,
        @Size(max = 255) String availabilityHours,
        @Size(max = 5000) String bio
) {}
