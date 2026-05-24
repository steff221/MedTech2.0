package com.medtech.application.dto.request;

import com.medtech.constant.ValidationMessages;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = ValidationMessages.EMAIL_REQUIRED)
        @Email(message = ValidationMessages.EMAIL_FORMAT)
        String email
) {}
