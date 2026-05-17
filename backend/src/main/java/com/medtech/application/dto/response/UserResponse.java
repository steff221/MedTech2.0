package com.medtech.application.dto.response;

import com.medtech.domain.entity.User;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import lombok.Builder;

import java.time.Instant;

@Builder
public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        UserRole role,
        UserStatus status,
        boolean emailVerified,
        Instant lastLogin
) {
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .emailVerified(user.isEmailVerified())
                .lastLogin(user.getLastLogin())
                .build();
    }
}
