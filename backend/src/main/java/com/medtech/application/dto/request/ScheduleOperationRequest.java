package com.medtech.application.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ScheduleOperationRequest(
        @NotNull Long patientId,
        @NotNull Long hospitalId,
        @NotBlank @Size(max = 255) String operationName,
        @NotNull @FutureOrPresent LocalDate operationDate,
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Time must be HH:mm")
        String operationTime,
        @Positive Integer durationMinutes,
        @Size(max = 50)  String operationRoom,
        @Size(max = 500) String surgicalTeam,
        @Size(max = 100) String anesthesiaType,
        @Size(max = 255) String anesthesiologist,
        String preOperativeNotes,
        String implantsUsed
) {}
