package com.medtech.application.dto.request;

import com.medtech.constant.ValidationMessages;
import com.medtech.domain.vo.UserRole;
import com.medtech.infrastructure.validation.ValidPhone;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Self-registration payload. */
/**
 * Влезен DTO: барање за регистрација на нов корисник.
 */
public record RegisterRequest(
        @NotBlank(message = ValidationMessages.EMAIL_REQUIRED)
        @Email(message = ValidationMessages.EMAIL_FORMAT)
        String email,

        @NotBlank(message = ValidationMessages.PASSWORD_REQUIRED)
        @Size(min = 12, max = 128, message = ValidationMessages.PASSWORD_STRENGTH)
        @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
            message = ValidationMessages.PASSWORD_STRENGTH)
        String password,

        @NotBlank(message = ValidationMessages.FIRST_NAME_REQUIRED)
        @Size(max = 100)
        String firstName,

        @NotBlank(message = ValidationMessages.LAST_NAME_REQUIRED)
        @Size(max = 100)
        String lastName,

        @Size(max = 20)
        @ValidPhone
        String phoneNumber,

        @NotNull(message = ValidationMessages.ROLE_REQUIRED)
        UserRole role
) {}
