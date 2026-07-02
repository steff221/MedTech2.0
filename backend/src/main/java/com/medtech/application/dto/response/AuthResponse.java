package com.medtech.application.dto.response;

import lombok.Builder;

/**
 * Излезен DTO: одговор при најава/регистрација — ги носи access и refresh токените.
 */
@Builder
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UserResponse user
) {}
