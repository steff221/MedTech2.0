package com.medtech.application.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Влезен DTO: барање за затворање/комплетирање на упат.
 */
public record CompleteReferralRequest(
        @NotNull LocalDate outcomeDate,

        @Size(max = 2000) String outcomeNote
) {}
