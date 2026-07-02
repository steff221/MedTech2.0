package com.medtech.application.dto.request;

import com.medtech.constant.ValidationMessages;
import jakarta.validation.constraints.NotBlank;


/**
 * Влезен DTO: барање за обновување на access токен преку refresh токен.
 */
public record RefreshTokenRequest(
        @NotBlank(message = ValidationMessages.REFRESH_TOKEN_REQUIRED)
        String refreshToken
) {}
