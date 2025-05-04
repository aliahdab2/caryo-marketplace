package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
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
    
    @Test
    void whenAllFieldsValid_thenNoViolations() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(2020);
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        request.setDescription("Test Description");
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(0, violations.size());
    }
    
    @Test
    void whenTitleIsBlank_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(2020);
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Title is required", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenBrandIsBlank_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("");
        request.setModel("Camry");
        request.setModelYear(2020);
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Brand is required", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenModelIsBlank_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("");
        request.setModelYear(2020);
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        
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
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(year);
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        
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
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(futureYear);
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Year must not be later than the current year", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenModelYearNotFourDigits_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(20200); // 5 digits
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(2, violations.size());
        // Check that one of the violations is the expected message
        boolean hasDigitsViolation = false;
        for (ConstraintViolation<CreateListingRequest> violation : violations) {
            if ("Year must be a 4-digit number".equals(violation.getMessage())) {
                hasDigitsViolation = true;
                break;
            }
        }
        assertTrue(hasDigitsViolation, "Expected digits validation violation not found");
    }
    
    @Test
    void whenMileageIsNegative_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(2020);
        request.setMileage(-10);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        
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
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(2020);
        request.setMileage(50000);
        request.setPrice(new BigDecimal(price));
        request.setLocation("Test Location");
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Price must be a positive number", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenLocationIsBlank_thenViolationOccurs() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(2020);
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("");
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertEquals(1, violations.size());
        assertEquals("Location is required", violations.iterator().next().getMessage());
    }
    
    @Test
    void whenDescriptionIsNullOrEmpty_thenNoViolations() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("Toyota");
        request.setModel("Camry");
        request.setModelYear(2020);
        request.setMileage(50000);
        request.setPrice(new BigDecimal("15000.00"));
        request.setLocation("Test Location");
        request.setDescription(null); // Description can be null
        
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
        String brand = "Toyota";
        String model = "Camry";
        Integer modelYear = 2020;
        Integer mileage = 50000;
        BigDecimal price = new BigDecimal("15000.00");
        String location = "Test Location";
        String description = "Test Description";
        String imageUrl = "http://example.com/image.jpg";
        
        // Act - Set values
        request.setTitle(title);
        request.setBrand(brand);
        request.setModel(model);
        request.setModelYear(modelYear);
        request.setMileage(mileage);
        request.setPrice(price);
        request.setLocation(location);
        request.setDescription(description);
        request.setImageUrl(imageUrl);
        
        // Assert - Get values
        assertEquals(title, request.getTitle());
        assertEquals(brand, request.getBrand());
        assertEquals(model, request.getModel());
        assertEquals(modelYear, request.getModelYear());
        assertEquals(mileage, request.getMileage());
        assertEquals(price, request.getPrice());
        assertEquals(location, request.getLocation());
        assertEquals(description, request.getDescription());
        assertEquals(imageUrl, request.getImageUrl());
    }
    
    @Test
    void whenRequiredFieldsNull_thenViolationsOccur() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        
        // Act
        Set<ConstraintViolation<CreateListingRequest>> violations = validator.validate(request);
        
        // Assert
        assertTrue(violations.size() >= 7); // At least 7 required fields
        
        // Check for specific violations
        boolean hasTitleViolation = false;
        boolean hasBrandViolation = false;
        boolean hasModelViolation = false;
        boolean hasYearViolation = false;
        boolean hasMileageViolation = false;
        boolean hasPriceViolation = false;
        boolean hasLocationViolation = false;
        
        for (ConstraintViolation<CreateListingRequest> violation : violations) {
            String path = violation.getPropertyPath().toString();
            switch (path) {
                case "title": hasTitleViolation = true; break;
                case "brand": hasBrandViolation = true; break;
                case "model": hasModelViolation = true; break;
                case "modelYear": hasYearViolation = true; break;
                case "mileage": hasMileageViolation = true; break;
                case "price": hasPriceViolation = true; break;
                case "location": hasLocationViolation = true; break;
            }
        }
        
        assertTrue(hasTitleViolation, "Missing title violation");
        assertTrue(hasBrandViolation, "Missing brand violation");
        assertTrue(hasModelViolation, "Missing model violation");
        assertTrue(hasYearViolation, "Missing modelYear violation");
        assertTrue(hasMileageViolation, "Missing mileage violation");
        assertTrue(hasPriceViolation, "Missing price violation");
        assertTrue(hasLocationViolation, "Missing location violation");
    }
}
