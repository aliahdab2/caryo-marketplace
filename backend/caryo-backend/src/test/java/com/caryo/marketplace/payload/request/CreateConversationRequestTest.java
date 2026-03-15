package com.caryo.marketplace.payload.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("CreateConversationRequest DTO Tests")
class CreateConversationRequestTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Should validate when all fields are valid")
    void shouldValidateWhenAllFieldsAreValid() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(1L);
        request.setInitialMessage("Hello, is this car still available?");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should have no validation violations");
    }

    @Test
    @DisplayName("Should validate with minimum valid message length")
    void shouldValidateWithMinimumValidMessageLength() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(1L);
        request.setInitialMessage("Hi");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept minimum length message");
    }

    @Test
    @DisplayName("Should validate with maximum valid message length")
    void shouldValidateWithMaximumValidMessageLength() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(1L);
        request.setInitialMessage("A".repeat(1000)); // Max length

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept maximum length message");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("Should fail validation when initial message is invalid")
    void shouldFailValidationWhenInitialMessageIsInvalid(String invalidMessage) {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(1L);
        request.setInitialMessage(invalidMessage);

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertEquals(1, violations.size(), "Should have exactly one validation violation");
        assertEquals("initialMessage", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    @DisplayName("Should fail validation when initial message exceeds maximum length")
    void shouldFailValidationWhenInitialMessageExceedsMaximumLength() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(1L);
        request.setInitialMessage("A".repeat(1001)); // Exceeds max length

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertEquals(1, violations.size(), "Should have exactly one validation violation");
        assertEquals("initialMessage", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    @DisplayName("Should fail validation when listing ID is null")
    void shouldFailValidationWhenListingIdIsNull() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(null);
        request.setInitialMessage("Hello, is this car still available?");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertEquals(1, violations.size(), "Should have exactly one validation violation");
        assertEquals("listingId", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    @DisplayName("Should fail validation when listing ID is negative")
    void shouldFailValidationWhenListingIdIsNegative() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(-1L);
        request.setInitialMessage("Hello, is this car still available?");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertEquals(1, violations.size(), "Should have exactly one validation violation");
        assertEquals("listingId", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    @DisplayName("Should fail validation when listing ID is zero")
    void shouldFailValidationWhenListingIdIsZero() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(0L);
        request.setInitialMessage("Hello, is this car still available?");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertEquals(1, violations.size(), "Should have exactly one validation violation");
        assertEquals("listingId", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    @DisplayName("Should test getter and setter methods")
    void shouldTestGetterAndSetterMethods() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        Long listingId = 123L;
        String initialMessage = "Test message";

        // Act
        request.setListingId(listingId);
        request.setInitialMessage(initialMessage);

        // Assert
        assertEquals(listingId, request.getListingId());
        assertEquals(initialMessage, request.getInitialMessage());
    }

    @Test
    @DisplayName("Should handle special characters in message")
    void shouldHandleSpecialCharactersInMessage() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(1L);
        request.setInitialMessage("Hello! How are you? 😊 This car looks great! @#$%^&*()");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept messages with special characters");
    }

    @Test
    @DisplayName("Should handle multilingual messages")
    void shouldHandleMultilingualMessages() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(1L);
        request.setInitialMessage("مرحبا، هل هذه السيارة متوفرة؟ Hello, is this car available?");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept multilingual messages");
    }

    @Test
    @DisplayName("Should handle edge case message lengths")
    void shouldHandleEdgeCaseMessageLengths() {
        // Test exactly 1 character
        CreateConversationRequest request1 = new CreateConversationRequest();
        request1.setListingId(1L);
        request1.setInitialMessage("A");

        Set<ConstraintViolation<CreateConversationRequest>> violations1 = validator.validate(request1);
        assertTrue(violations1.isEmpty(), "Should accept single character message");

        // Test exactly 1000 characters
        CreateConversationRequest request2 = new CreateConversationRequest();
        request2.setListingId(1L);
        request2.setInitialMessage("A".repeat(1000));

        Set<ConstraintViolation<CreateConversationRequest>> violations2 = validator.validate(request2);
        assertTrue(violations2.isEmpty(), "Should accept exactly 1000 character message");
    }

    @Test
    @DisplayName("Should validate multiple requests independently")
    void shouldValidateMultipleRequestsIndependently() {
        // Arrange
        CreateConversationRequest request1 = new CreateConversationRequest();
        request1.setListingId(1L);
        request1.setInitialMessage("First message");

        CreateConversationRequest request2 = new CreateConversationRequest();
        request2.setListingId(2L);
        request2.setInitialMessage("Second message");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations1 = validator.validate(request1);
        Set<ConstraintViolation<CreateConversationRequest>> violations2 = validator.validate(request2);

        // Assert
        assertTrue(violations1.isEmpty(), "First request should be valid");
        assertTrue(violations2.isEmpty(), "Second request should be valid");
    }

    @Test
    @DisplayName("Should handle large listing IDs")
    void shouldHandleLargeListingIds() {
        // Arrange
        CreateConversationRequest request = new CreateConversationRequest();
        request.setListingId(Long.MAX_VALUE);
        request.setInitialMessage("Test message");

        // Act
        Set<ConstraintViolation<CreateConversationRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept large listing IDs");
    }
}
