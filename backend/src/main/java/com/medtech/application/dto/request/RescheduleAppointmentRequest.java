package com.medtech.application.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record RescheduleAppointmentRequest(
        @NotNull @FutureOrPresent LocalDate newDate,
        @NotNull LocalTime newTime
) {}
