package com.medtech.application.dto.request;

import com.medtech.domain.vo.ReferralType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

        @NotNull @FutureOrPresent LocalDate scheduledDate,

        /** Работна единица — Одделение. Required by БУ, ignored by the rest. */
        @Size(max = 200) String wardUnit,

        /** Број на лекарски дневник — printed in the issuer block. */
        @Size(max = 50) String medicalJournalNo,

        /** Специјалност. Required by СУ and БУ. */
        @Size(max = 200) String referredSpecialty,

        /** Вид на услуга (ЛУ) / назив на апарат (РДУ). */
        @Size(max = 1000) String serviceDetail,

        /** Образец СУ "УПАТ ЗА" — 1, 2 or 3. */
        @Min(1) @Max(3) Short formSubtype
) {}
