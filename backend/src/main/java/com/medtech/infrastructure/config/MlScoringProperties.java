package com.medtech.infrastructure.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the external ML scoring service (ml-service).
 *
 * <p>{@code enabled} is the master switch: when {@code false} (the default) the
 * backend never calls the service and behaves exactly as before. This lets the
 * integration ship dark and be flipped on per-environment.
 */
@ConfigurationProperties(prefix = "medtech.ml")
public record MlScoringProperties(
        boolean enabled,
        @NotBlank String baseUrl,
        @Positive int connectTimeoutMs,
        @Positive int readTimeoutMs
) {}
