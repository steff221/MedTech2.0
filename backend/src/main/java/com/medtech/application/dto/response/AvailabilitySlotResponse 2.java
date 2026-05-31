package com.medtech.application.dto.response;

import java.time.LocalTime;

public record AvailabilitySlotResponse(
        Integer dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean active
) {}
