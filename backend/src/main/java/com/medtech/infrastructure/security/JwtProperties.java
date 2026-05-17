package com.medtech.infrastructure.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Strongly-typed binding for {@code medtech.security.jwt.*} properties.
 */
@Validated
@ConfigurationProperties(prefix = "medtech.security.jwt")
public record JwtProperties(
        @NotBlank @Size(min = 32, message = "JWT secret must be at least 32 characters")
        String secret,

        @Positive
        long accessTokenTtlMinutes,

        @Positive
        long refreshTokenTtlDays,

        @NotBlank
        String issuer
) {}
