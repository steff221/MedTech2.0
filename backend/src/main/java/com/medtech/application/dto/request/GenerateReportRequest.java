package com.medtech.application.dto.request;

import com.medtech.domain.vo.ReportPeriodType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GenerateReportRequest(
        @NotNull ReportPeriodType periodType,
        @NotNull @Min(2000) @Max(2100) Integer year,
        /** 1–12 for MONTHLY; 1–4 for QUARTERLY; ignored for ANNUAL */
        Integer periodUnit
) {}
