package com.autotrader.autotraderbackend.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.Year;

import static org.junit.jupiter.api.Assertions.*;

class CurrentYearOrEarlierValidatorTest {
    
    private CurrentYearOrEarlierValidator validator;
    
    @Mock
    private ConstraintValidatorContext context;
    
    private AutoCloseable closeable;
    
    @BeforeEach
    void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        validator = new CurrentYearOrEarlierValidator();
    }
    
    @AfterEach
    void tearDown() throws Exception {
        closeable.close();
    }
    
    @Test
    void shouldReturnTrueForCurrentYear() {
        // Arrange
        int currentYear = Year.now().getValue();
        
        // Act
        boolean result = validator.isValid(currentYear, context);
        
        // Assert
        assertTrue(result);
    }
    
    @Test
    void shouldReturnTrueForPastYear() {
        // Arrange
        int pastYear = Year.now().getValue() - 10; // 10 years ago
        
        // Act
        boolean result = validator.isValid(pastYear, context);
        
        // Assert
        assertTrue(result);
    }
    
    @Test
    void shouldReturnFalseForFutureYear() {
        // Arrange
        int futureYear = Year.now().getValue() + 1; // Next year
        
        // Act
        boolean result = validator.isValid(futureYear, context);
        
        // Assert
        assertFalse(result);
    }
    
    @Test
    void shouldReturnTrueForNullYear() {
        // Act
        boolean result = validator.isValid(null, context);
        
        // Assert
        assertTrue(result, "Null values should be considered valid and handled by @NotNull annotations");
    }
}
