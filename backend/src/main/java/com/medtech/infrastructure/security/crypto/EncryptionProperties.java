package com.medtech.infrastructure.security.crypto;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Strongly-typed binding for {@code medtech.security.encryption.*}.
 *
 * <p>The {@code key} is the base64-encoded 256-bit master key used for
 * application-level (at-rest) encryption of PHI columns. It has no default so
 * startup fails fast when the {@code MEDTECH_PHI_ENCRYPTION_KEY} env var is
 * missing, mirroring the JWT-secret convention.
 *
 * Конфигурациски својства за шифрирање на чувствителни податоци (PHI) во база.
 */
@Validated
@ConfigurationProperties(prefix = "medtech.security.encryption")
public record EncryptionProperties(
        @NotBlank(message = "PHI encryption key (MEDTECH_PHI_ENCRYPTION_KEY) must be set")
        String key
) {
}
