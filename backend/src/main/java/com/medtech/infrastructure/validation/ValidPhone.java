package com.medtech.infrastructure.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Pattern;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Accepts international phone numbers: optional leading +, then 7–15 digits,
 * spaces/dashes allowed between groups. Null/blank passes (combine with @NotBlank).
 */
@Documented
@Constraint(validatedBy = {})
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Pattern(
    regexp = "^(\\+?[0-9][\\s\\-]?){7,15}$",
    message = "Invalid phone number format"
)
/**
 * Кастомна валидациска анотација: означува дека полето мора да биде валиден телефонски број.
 */
public @interface ValidPhone {
    String message() default "Invalid phone number format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
