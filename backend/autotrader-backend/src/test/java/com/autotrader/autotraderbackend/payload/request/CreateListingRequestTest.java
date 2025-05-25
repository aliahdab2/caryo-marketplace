package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CreateListingRequestTest {

    private Validator validator;
    
    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    
    private CreateListingRequest createValidRequest() {
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Valid Title");
        request.setModelId(1L); // Use modelId instead of brand and model
        request.setModelYear(LocalDate.now().getYear()); // Use current year for default valid
        request.setPrice(new BigDecimal("20000.00"));
        request.setMileage(10000);
        request.setLocationId(1L); // Use setLocationId instead of setLocation
        request.setDescription("Valid description.");
        return request;
    }
    
    @Test
    void whenAllFieldsValid_thenNoViolations() {
        // Arrange
        CreateListingRequest request = createValidRequest();
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(0, violations.size());
    }
    
    @Test
    void whenTitleIsBlank_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = createValidRequest();
        request.setTitle(""); // Blank title
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Title is required", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenModelIdIsNull_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = createValidRequest();
        request.setModelId(null); // Null modelId
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Model is required", violations.iterator().next().getMessage());
    }
    
    @ParameterizedTest
    @ValueSource(ints = {1919, 1800, 1000})
    void whenModelYearTooOld_thenViolationOccurs(int year) {
        // Arrange
        CreateListingRequest request = createValidRequest();
        request.setModelYear(year);
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Year must be 1920 or later", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenModelYearInFuture_thenViolationOccurs() {
        // Arrange
        int futureYear = LocalDate.now().getYear() + 1;
        CreateListingRequest request = createValidRequest();
        request.setModelYear(futureYear);
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Year must not be later than the current year", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenModelYearNotFourDigits_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = createValidRequest();
        request.setModelYear(20200); // Invalid year (5 digits)
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertTrue(violations.stream()
                .anyMatch(v -> "Year must be a 4-digit number".equals(v.getMessage())));
    }
    
    @Test
    void whenMileageIsNegative_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = createValidRequest();
        request.setMileage(-10); // Invalid mileage
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Mileage must be a positive number or zero", violations.iterator().next().getMessage());
    }
    
    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "-100.50"})
    void whenPriceIsNotPositive_thenViolationOccurs(String price) {
        // Arrange
        CreateListingRequest request = createValidRequest();
        request.setPrice(new BigDecimal(price)); // Invalid price
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Price must be a positive number", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenLocationIsBlank_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = createValidRequest();
        request.setLocationId(null); // Invalid location - should be null to trigger @NotNull
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Location is required", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenDescriptionIsNullOrEmpty_thenNoViolations() {
        // Arrange
        CreateListingRequest request = createValidRequest();
        request.setDescription(null); // Can be null
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(0, violations.size());
        
        // Test with empty string
        request.setDescription("");
        violations = validator.validate(request);
        assertEquals(0, violations.size());
    }
    
    @Test
    void whenGettersAndSettersWork_thenFieldsAreAccessibleAndModifiable() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        String title = "Test Car";
        Long modelId = 1L; // Use Long for modelId
        Integer modelYear = 2020;
        Integer mileage = 50000;
        BigDecimal price = new BigDecimal("15000.00");
        Long locationId = 1L; // Changed from String location to Long locationId
        String description = "Test Description";
        
        // Act - Set values
        request.setTitle(title);
        request.setModelId(modelId); // Use setModelId
        request.setModelYear(modelYear);
        request.setMileage(mileage);
        request.setPrice(price);
        request.setLocationId(locationId); // Use setLocationId
        request.setDescription(description);
        
        // Assert - Get values
        assertEquals(title, request.getTitle());
        assertEquals(modelId, request.getModelId()); // Use getModelId
        assertEquals(modelYear, request.getModelYear());
        assertEquals(mileage, request.getMileage());
        assertEquals(price, request.getPrice());
        assertEquals(locationId, request.getLocationId()); // Use getLocationId and assert against locationId
        assertEquals(description, request.getDescription());
    }
    
    @Test
    void whenRequiredFieldsNull_thenViolationsOccur() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(6, violations.size()); // Check for exactly 6 violations for the required fields
        
        // Check for specific violations
        boolean hasTitleViolation = false;
        boolean hasModelIdViolation = false;
        boolean hasYearViolation = false;
        boolean hasMileageViolation = false;
        boolean hasPriceViolation = false;
        boolean hasLocationViolation = false;
        
        for (ConstraintViolation<CreateListingRequest> violation : violations) {
            String path = violation.getPropertyPath().toString();
            switch (path) {
                case "title": hasTitleViolation = true; break;
                case "modelId": hasModelIdViolation = true; break;
                case "modelYear": hasYearViolation = true; break;
                case "mileage": hasMileageViolation = true; break;
                case "price": hasPriceViolation = true; break;
                case "locationId": hasLocationViolation = true; break;
            }
        }
        
        assertTrue(hasTitleViolation, "Missing title violation");
        assertTrue(hasModelIdViolation, "Missing modelId violation");
        assertTrue(hasYearViolation, "Missing modelYear violation");
        assertTrue(hasMileageViolation, "Missing mileage violation");
        assertTrue(hasPriceViolation, "Missing price violation");
        assertTrue(hasLocationViolation, "Missing location violation");
    }
}
