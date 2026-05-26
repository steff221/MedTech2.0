package com.medtech.application.dto.request;

import com.medtech.domain.vo.ReferralType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateReferralRequest(
        @NotNull Long patientId,

        @NotNull ReferralType referralType,

        @NotBlank @Size(max = 200) String referredTo,

        @Size(max = 20) String mkb10Code,

        @Size(max = 1000) String description,

        @NotNull @Future LocalDate scheduledDate
) {}
