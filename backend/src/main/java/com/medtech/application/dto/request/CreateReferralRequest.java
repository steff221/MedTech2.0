package com.medtech.application.dto.request;

import com.medtech.domain.vo.ReferralType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Влезен DTO: барање за креирање нов упат кон друг доктор/специјалист.
 */
public record CreateReferralRequest(
        @NotNull Long patientId,

        @NotNull ReferralType referralType,

        @NotBlank @Size(max = 200) String referredTo,

        @Size(max = 20) String mkb10Code,

        @Size(max = 1000) String description,

        @NotNull @FutureOrPresent LocalDate scheduledDate
) {}
