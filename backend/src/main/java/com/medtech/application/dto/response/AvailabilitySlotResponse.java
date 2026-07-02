package com.medtech.application.dto.response;

import java.time.LocalTime;

/**
 * Излезен DTO: слободен термин (достапност) на доктор.
 */
public record AvailabilitySlotResponse(
        Integer dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean active
) {}
