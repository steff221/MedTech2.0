package com.medtech.infrastructure.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validates Macedonian EGN/EMBG: exactly 13 digits, null/blank accepted
 * (use @NotBlank separately if the field is required).
 */
public class EgnValidator implements ConstraintValidator<ValidEgn, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null || value.isBlank()) return true;
        return value.matches("\\d{13}");
    }
}
