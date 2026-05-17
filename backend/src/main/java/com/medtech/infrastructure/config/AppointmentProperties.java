package com.medtech.infrastructure.config;

import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "medtech.appointment")
public record AppointmentProperties(
        @Positive int defaultDurationMinutes,
        @Positive int cancellationWindowHours
) {}
