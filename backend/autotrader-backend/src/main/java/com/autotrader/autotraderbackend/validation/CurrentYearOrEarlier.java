package com.autotrader.autotraderbackend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to validate that a year is not in the future (not later than the current year).
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CurrentYearOrEarlierValidator.class)
public @interface CurrentYearOrEarlier {
    String message() default "Year must not be later than the current year";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
