package com.medtech.application.dto.response;

import com.medtech.domain.vo.ReportPeriodType;
import com.medtech.domain.vo.ReportStatus;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;

@Builder
public record DoctorReportResponse(
        Long id,
        String reportNumber,
        ReportPeriodType periodType,
        String periodLabel,
        LocalDate periodStart,
        LocalDate periodEnd,
        int patientCount,
        int diagnosisCount,
        int appointmentCount,
        int prescriptionCount,
        ReportStatus status,
        Instant submittedAt,
        Instant createdAt
) {}
