package com.medtech.infrastructure.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Кастомна валидациска анотација: означува дека полето мора да биде валиден ЕГН.
 */
@Documented
@Constraint(validatedBy = EgnValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEgn {
    String message() default "Invalid EGN/EMBG — must be exactly 13 digits";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
