package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Year;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class ListingFilterRequestTest {
    
    private static ValidatorFactory validatorFactory;
    private Validator validator;
    
    @BeforeAll
    static void setUpValidatorFactory() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
    }
    
    @AfterAll
    static void closeValidatorFactory() {
        if (validatorFactory != null) {
            validatorFactory.close();
        }
    }
    
    @BeforeEach
    void setUp() {
        validator = validatorFactory.getValidator();
    }
    
    @Test
    void shouldValidateModelYearBetween1920AndCurrentYear() {
        // Arrange
        ListingFilterRequest request = new ListingFilterRequest();
        request.setModelYear(1920); // Min allowed value
        
        // Act
        Set<ConstraintViolation<ListingFilterRequest>> violations = validator.validate(request);
        
        // Assert
        assertTrue(violations.isEmpty(), "1920 should be a valid model year");
        
        // Test current year (which should be valid)
        request.setModelYear(Year.now().getValue());
        violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Current year should be a valid model year");
    }
    
    @Test
    void shouldRejectModelYearBelow1920() {
        // Arrange
        ListingFilterRequest request = new ListingFilterRequest();
        request.setModelYear(1919);
        
        // Act
        Set<ConstraintViolation<ListingFilterRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        ConstraintViolation<ListingFilterRequest> violation = violations.iterator().next();
        assertEquals("Year filter must be 1920 or later", violation.getMessage());
    }
    
    @Test
    void shouldRejectModelYearAboveCurrentYear() {
        // Arrange
        ListingFilterRequest request = new ListingFilterRequest();
        request.setModelYear(Year.now().getValue() + 1); // Next year
        
        // Act
        Set<ConstraintViolation<ListingFilterRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        ConstraintViolation<ListingFilterRequest> violation = violations.iterator().next();
        assertEquals("Year filter must not be later than the current year", violation.getMessage());
    }
    
    @Test
    void shouldRejectNon4DigitModelYear() {
        // Arrange
        ListingFilterRequest request = new ListingFilterRequest();
        request.setModelYear(12345); // 5 digits
        
        // Act
        Set<ConstraintViolation<ListingFilterRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        ConstraintViolation<ListingFilterRequest> violation = violations.iterator().next();
        assertEquals("Year filter must be a 4-digit number", violation.getMessage());
    }
}
