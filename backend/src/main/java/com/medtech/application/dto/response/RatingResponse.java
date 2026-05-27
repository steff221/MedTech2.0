package com.medtech.application.dto.response;

import lombok.Builder;

import java.time.Instant;

@Builder
public record RatingResponse(
        Long id,
        Long appointmentId,
        Long doctorId,
        String patientName,
        Short rating,
        String comment,
        Instant createdAt
) {}
