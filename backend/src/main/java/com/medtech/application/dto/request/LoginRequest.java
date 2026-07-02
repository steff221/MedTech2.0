package com.medtech.application.dto.request;

import com.medtech.constant.ValidationMessages;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Влезен DTO: барање за најава (email и лозинка).
 */
public record LoginRequest(
        @NotBlank(message = ValidationMessages.EMAIL_REQUIRED)
        @Email(message = ValidationMessages.EMAIL_FORMAT)
        String email,

        @NotBlank(message = ValidationMessages.PASSWORD_REQUIRED)
        String password
) {}
