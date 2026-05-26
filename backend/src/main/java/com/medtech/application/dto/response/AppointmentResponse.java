package com.medtech.application.dto.response;

import com.medtech.domain.vo.AppointmentStatus;
import com.medtech.domain.vo.AppointmentType;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Builder
public record AppointmentResponse(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String doctorSpecialization,
        Long hospitalId,
        String hospitalName,
        LocalDate appointmentDate,
        LocalTime appointmentTime,
        Integer durationMinutes,
        AppointmentStatus status,
        AppointmentType appointmentType,
        String reason,
        String cancellationReason,
        String videoCallUrl,
        Instant createdAt
) {}
