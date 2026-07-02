package com.medtech.application.dto.request;

import com.medtech.constant.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Влезен DTO: барање за поставување нова лозинка преку токен за ресет.
 */
public record ResetPasswordRequest(
        @NotBlank(message = "Reset token is required")
        String token,

        @NotBlank(message = ValidationMessages.PASSWORD_REQUIRED)
        @Size(min = 12, message = "Password must be at least 12 characters")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).+$",
            message = ValidationMessages.PASSWORD_STRENGTH
        )
        String newPassword
) {}
