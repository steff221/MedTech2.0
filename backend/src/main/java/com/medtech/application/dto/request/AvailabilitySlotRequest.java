package com.medtech.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

/**
 * Влезен DTO: барање за дефинирање на слободен термин (достапност) на докторот.
 */
public record AvailabilitySlotRequest(
        @NotNull @Min(1) @Max(7) Integer dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean active
) {}
