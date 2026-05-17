package com.medtech.application.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record RescheduleAppointmentRequest(
        @NotNull @FutureOrPresent LocalDate newDate,
        @NotBlank
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Time must be HH:mm")
        String newTime
) {}
