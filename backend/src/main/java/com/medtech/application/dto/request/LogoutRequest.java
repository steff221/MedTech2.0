package com.medtech.application.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Влезен DTO: барање за одјава — го носи refresh токенот што се поништува.
 */
public record LogoutRequest(@NotBlank String refreshToken) {}
