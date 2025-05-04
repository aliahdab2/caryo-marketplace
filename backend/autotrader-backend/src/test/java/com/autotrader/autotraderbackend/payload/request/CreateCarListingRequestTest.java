package com.autotrader.autotraderbackend.payload.request;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CreateCarListingRequestTest {
    private static Validator validator;

    @BeforeAll
    static void setupValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void validRequest_passesValidation() {
        CreateCarListingRequest req = new CreateCarListingRequest();
        req.setTitle("Great Car");
        req.setBrand("Toyota");
        req.setModel("Corolla");
        req.setModelYear(2020);
        req.setMileage(10000);
        req.setPrice(new BigDecimal("15000.00"));
        req.setLocation("Berlin");
        req.setDescription("A well-maintained car.");
        req.setTransmission("AUTOMATIC");

        Set<ConstraintViolation<CreateCarListingRequest>> violations = validator.validate(req);
        assertTrue(violations.isEmpty(), "There should be no validation errors");
    }

    @Test
    void missingRequiredFields_failsValidation() {
        CreateCarListingRequest req = new CreateCarListingRequest();
        Set<ConstraintViolation<CreateCarListingRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty(), "Validation should fail for missing required fields");
    }

    @Test
    void invalidYear_failsValidation() {
        CreateCarListingRequest req = new CreateCarListingRequest();
        req.setTitle("Car");
        req.setBrand("Brand");
        req.setModel("Model");
        req.setModelYear(1800); // too old
        req.setMileage(100);
        req.setPrice(new BigDecimal("1000.00"));
        req.setLocation("Loc");
        req.setTransmission("MANUAL");
        Set<ConstraintViolation<CreateCarListingRequest>> violations = validator.validate(req);
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("modelYear")));
    }

    @Test
    void invalidTransmission_failsValidation() {
        CreateCarListingRequest req = new CreateCarListingRequest();
        req.setTitle("Car");
        req.setBrand("Brand");
        req.setModel("Model");
        req.setModelYear(2020);
        req.setMileage(100);
        req.setPrice(new BigDecimal("1000.00"));
        req.setLocation("Loc");
        req.setTransmission("SEMI-AUTO"); // invalid
        Set<ConstraintViolation<CreateCarListingRequest>> violations = validator.validate(req);
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("transmission")));
    }
}
