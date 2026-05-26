package com.medtech.application.dto.request;

import com.medtech.domain.vo.AppointmentType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookAppointmentRequest(
        @NotNull Long doctorId,
        @NotNull Long patientId,
        @NotNull @FutureOrPresent LocalDate appointmentDate,

        @NotNull LocalTime appointmentTime,

        @Positive Integer durationMinutes,
        AppointmentType appointmentType,
        @Size(max = 500) String reason,
        @Size(max = 2000) String notes
) {}
