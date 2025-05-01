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
    void shouldValidateYearBetween1920AndCurrentYear() {
        // Arrange
        ListingFilterRequest request = new ListingFilterRequest();
        request.setMinYear(1920); // Min allowed value
        
        // Act
        Set<ConstraintViolation<ListingFilterRequest>> violations = validator.validate(request);
        
        // Assert
        assertTrue(violations.isEmpty(), "1920 should be a valid minimum year");
        
        // Test current year (which should be valid)
        request.setMaxYear(Year.now().getValue());
        violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Current year should be a valid maximum year");
    }
    
    @Test
    void shouldRejectMinYearBelow1920() {
        // Arrange
        ListingFilterRequest request = new ListingFilterRequest();
        request.setMinYear(1919);
        
        // Act
        Set<ConstraintViolation<ListingFilterRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        ConstraintViolation<ListingFilterRequest> violation = violations.iterator().next();
        assertEquals("Minimum year filter must be 1920 or later", violation.getMessage());
    }
    
    @Test
    void shouldRejectMaxYearAboveCurrentYear() {
        // Arrange
        ListingFilterRequest request = new ListingFilterRequest();
        request.setMaxYear(Year.now().getValue() + 1); // Next year
        
        // Act
        Set<ConstraintViolation<ListingFilterRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        ConstraintViolation<ListingFilterRequest> violation = violations.iterator().next();
        assertEquals("Maximum year filter must not be later than the current year", violation.getMessage());
    }
    
    @Test
    void shouldRejectNon4DigitYear() {
        // Arrange
        ListingFilterRequest request = new ListingFilterRequest();
        request.setMinYear(12345); // 5 digits
        
        // Act
        Set<ConstraintViolation<ListingFilterRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        ConstraintViolation<ListingFilterRequest> violation = violations.iterator().next();
        assertEquals("Minimum year filter must be a 4-digit number", violation.getMessage());
        
        // Test max year too
        request = new ListingFilterRequest();
        request.setMaxYear(12345); // 5 digits
        
        violations = validator.validate(request);
        
        assertEquals(1, violations.size());
        violation = violations.iterator().next();
        assertEquals("Maximum year filter must be a 4-digit number", violation.getMessage());
    }
}
