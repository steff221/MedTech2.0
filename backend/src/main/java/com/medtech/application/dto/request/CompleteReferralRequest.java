package com.medtech.application.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CompleteReferralRequest(
        @NotNull LocalDate outcomeDate,

        @Size(max = 2000) String outcomeNote
) {}
