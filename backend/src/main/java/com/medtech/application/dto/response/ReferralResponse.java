package com.medtech.application.dto.response;

import com.medtech.domain.vo.ReferralStatus;
import com.medtech.domain.vo.ReferralType;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;

@Builder
public record ReferralResponse(
        Long id,
        String referralNumber,
        Long doctorId,
        String doctorName,
        Long patientId,
        String patientName,
        ReferralType referralType,
        String referredTo,
        String mkb10Code,
        String description,
        LocalDate scheduledDate,
        ReferralStatus status,
        String outcomeNote,
        LocalDate outcomeDate,
        Instant createdAt
) {}
