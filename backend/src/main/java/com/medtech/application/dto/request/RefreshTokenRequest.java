package com.medtech.application.dto.request;

import com.medtech.constant.ValidationMessages;
import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = ValidationMessages.REFRESH_TOKEN_REQUIRED)
        String refreshToken
) {}
