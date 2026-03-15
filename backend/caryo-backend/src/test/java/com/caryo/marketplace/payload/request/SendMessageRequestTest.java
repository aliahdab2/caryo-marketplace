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

@DisplayName("SendMessageRequest DTO Tests")
class SendMessageRequestTest {

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
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Hello, is this car still available?");
        request.setMessageType("text");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should have no validation violations");
    }

    @Test
    @DisplayName("Should validate with default message type")
    void shouldValidateWithDefaultMessageType() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Test message");
        // messageType defaults to "text"

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept default message type");
        assertEquals("text", request.getMessageType());
    }

    @Test
    @DisplayName("Should validate with minimum valid message length")
    void shouldValidateWithMinimumValidMessageLength() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Hi");
        request.setMessageType("text");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept minimum length message");
    }

    @Test
    @DisplayName("Should validate with maximum valid message length")
    void shouldValidateWithMaximumValidMessageLength() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("A".repeat(1000)); // Max length
        request.setMessageType("text");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept maximum length message");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("Should reject blank content")
    void shouldRejectBlankContent(String blankContent) {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent(blankContent);
        request.setMessageType("text");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty(), "Should reject blank message content");
        assertEquals("content", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    @DisplayName("Should fail validation when content exceeds maximum length")
    void shouldFailValidationWhenContentExceedsMaximumLength() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("A".repeat(1001)); // Exceeds max length
        request.setMessageType("text");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertEquals(1, violations.size(), "Should have exactly one validation violation");
        assertEquals("content", violations.iterator().next().getPropertyPath().toString());
    }

    @Test
    @DisplayName("Should accept different message types")
    void shouldAcceptDifferentMessageTypes() {
        // Test text type
        SendMessageRequest textRequest = new SendMessageRequest();
        textRequest.setContent("Text message");
        textRequest.setMessageType("text");

        Set<ConstraintViolation<SendMessageRequest>> textViolations = validator.validate(textRequest);
        assertTrue(textViolations.isEmpty(), "Should accept text message type");

        // Test image type
        SendMessageRequest imageRequest = new SendMessageRequest();
        imageRequest.setContent("Image message");
        imageRequest.setMessageType("image");

        Set<ConstraintViolation<SendMessageRequest>> imageViolations = validator.validate(imageRequest);
        assertTrue(imageViolations.isEmpty(), "Should accept image message type");

        // Test system type
        SendMessageRequest systemRequest = new SendMessageRequest();
        systemRequest.setContent("System message");
        systemRequest.setMessageType("system");

        Set<ConstraintViolation<SendMessageRequest>> systemViolations = validator.validate(systemRequest);
        assertTrue(systemViolations.isEmpty(), "Should accept system message type");
    }

    @Test
    @DisplayName("Should test getter and setter methods")
    void shouldTestGetterAndSetterMethods() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        String content = "Test message content";
        String messageType = "image";

        // Act
        request.setContent(content);
        request.setMessageType(messageType);

        // Assert
        assertEquals(content, request.getContent());
        assertEquals(messageType, request.getMessageType());
    }

    @Test
    @DisplayName("Should handle special characters in content")
    void shouldHandleSpecialCharactersInContent() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Hello! How are you? 😊 This car looks great! @#$%^&*()");
        request.setMessageType("text");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept messages with special characters");
    }

    @Test
    @DisplayName("Should handle multilingual content")
    void shouldHandleMultilingualContent() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("مرحبا، هل هذه السيارة متوفرة؟ Hello, is this car available?");
        request.setMessageType("text");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept multilingual messages");
    }

    @Test
    @DisplayName("Should handle edge case content lengths")
    void shouldHandleEdgeCaseContentLengths() {
        // Test exactly 1 character
        SendMessageRequest request1 = new SendMessageRequest();
        request1.setContent("A");
        request1.setMessageType("text");

        Set<ConstraintViolation<SendMessageRequest>> violations1 = validator.validate(request1);
        assertTrue(violations1.isEmpty(), "Should accept single character message");

        // Test exactly 1000 characters
        SendMessageRequest request2 = new SendMessageRequest();
        request2.setContent("A".repeat(1000));
        request2.setMessageType("text");

        Set<ConstraintViolation<SendMessageRequest>> violations2 = validator.validate(request2);
        assertTrue(violations2.isEmpty(), "Should accept exactly 1000 character message");
    }

    @Test
    @DisplayName("Should validate multiple requests independently")
    void shouldValidateMultipleRequestsIndependently() {
        // Arrange
        SendMessageRequest request1 = new SendMessageRequest();
        request1.setContent("First message");
        request1.setMessageType("text");

        SendMessageRequest request2 = new SendMessageRequest();
        request2.setContent("Second message");
        request2.setMessageType("image");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations1 = validator.validate(request1);
        Set<ConstraintViolation<SendMessageRequest>> violations2 = validator.validate(request2);

        // Assert
        assertTrue(violations1.isEmpty(), "First request should be valid");
        assertTrue(violations2.isEmpty(), "Second request should be valid");
    }

    @Test
    @DisplayName("Should handle null message type")
    void shouldHandleNullMessageType() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Test message");
        request.setMessageType(null);

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept null message type (will use default)");
    }

    @Test
    @DisplayName("Should handle empty message type")
    void shouldHandleEmptyMessageType() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Test message");
        request.setMessageType("");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept empty message type");
    }

    @Test
    @DisplayName("Should handle whitespace message type")
    void shouldHandleWhitespaceMessageType() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Test message");
        request.setMessageType("   ");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept whitespace message type");
    }

    @Test
    @DisplayName("Should maintain default message type when not set")
    void shouldMaintainDefaultMessageTypeWhenNotSet() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Test message");
        // Don't set messageType

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should be valid with default message type");
        assertEquals("text", request.getMessageType(), "Should have default message type");
    }

    @Test
    @DisplayName("Should handle very long message types")
    void shouldHandleVeryLongMessageTypes() {
        // Arrange
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Test message");
        request.setMessageType("very_long_message_type_name_that_exceeds_normal_length");

        // Act
        Set<ConstraintViolation<SendMessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty(), "Should accept long message types");
    }
}
