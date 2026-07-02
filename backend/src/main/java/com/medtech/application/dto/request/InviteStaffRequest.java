package com.medtech.application.dto.request;

import com.medtech.constant.ValidationMessages;
import com.medtech.domain.vo.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Влезен DTO: барање за покана на нов вработен (staff) во системот.
 */
public record InviteStaffRequest(
        @NotBlank(message = ValidationMessages.EMAIL_REQUIRED)
        @Email(message = ValidationMessages.EMAIL_FORMAT)
        String email,

        @NotBlank(message = ValidationMessages.FIRST_NAME_REQUIRED)
        @Size(max = 100)
        String firstName,

        @NotBlank(message = ValidationMessages.LAST_NAME_REQUIRED)
        @Size(max = 100)
        String lastName,

        @Size(max = 20)
        String phoneNumber,

        @NotNull(message = "Role is required (DOCTOR or NURSE)")
        UserRole role,

        // Doctor-specific — required when role = DOCTOR
        Long hospitalId,

        @Size(max = 100)
        String licenseNumber,

        @Size(max = 255)
        String specialization
) {}
