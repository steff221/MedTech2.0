package com.medtech.application.dto.response;

import com.medtech.domain.vo.ReferralStatus;
import com.medtech.domain.vo.ReferralType;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Излезен DTO: податоци за упат што се враќаат кон клиентот.
 */
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
        /** Resolved ФЗОМ form: СУ, ЛУ-1, ЛУ-2, РДУ-1, РДУ-2, БУ. */
        String fzomFormCode,
        String referredSpecialty,
        String serviceDetail,
        Short formSubtype,
        String wardUnit,
        String medicalJournalNo,
        String cancellationReason,
        Instant cancelledAt,
        /** Non-null once a paper copy has been produced. */
        Instant printedAt,
        Instant createdAt
) {}
