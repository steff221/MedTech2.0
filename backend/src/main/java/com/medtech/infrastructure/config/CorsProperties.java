package com.medtech.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Binds {@code medtech.security.cors.*}. */
/**
 * Конфигурациски својства за CORS (дозволени origins, методи и сл.).
 */
@ConfigurationProperties(prefix = "medtech.security.cors")
public record CorsProperties(
        List<String> allowedOrigins,
        List<String> allowedMethods,
        List<String> allowedHeaders,
        List<String> exposedHeaders,
        boolean allowCredentials,
        long maxAgeSeconds
) {}
