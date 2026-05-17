package com.medtech.application.dto.request;

import com.medtech.domain.vo.AppointmentType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record BookAppointmentRequest(
        @NotNull Long doctorId,
        @NotNull Long patientId,
        @NotNull @FutureOrPresent LocalDate appointmentDate,

        /** 24h time, format {@code HH:mm}. */
        @NotBlank
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Time must be HH:mm")
        String appointmentTime,

        @Positive Integer durationMinutes,
        AppointmentType appointmentType,
        @Size(max = 500) String reason,
        @Size(max = 2000) String notes
) {}
