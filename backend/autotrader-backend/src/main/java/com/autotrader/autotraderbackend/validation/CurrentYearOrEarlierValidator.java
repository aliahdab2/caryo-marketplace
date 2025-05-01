package com.autotrader.autotraderbackend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.time.Year;

/**
 * Validator that ensures a year value is not greater than the current year.
 */
public class CurrentYearOrEarlierValidator implements ConstraintValidator<CurrentYearOrEarlier, Integer> {

    @Override
    public void initialize(CurrentYearOrEarlier constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(Integer year, ConstraintValidatorContext context) {
        // Skip validation if year is null (this should be handled by @NotNull if needed)
        if (year == null) {
            return true;
        }
        
        // Get the current year from the system clock
        int currentYear = Year.now().getValue();
        
        // The year is valid if it's less than or equal to the current year
        return year <= currentYear;
    }
}
