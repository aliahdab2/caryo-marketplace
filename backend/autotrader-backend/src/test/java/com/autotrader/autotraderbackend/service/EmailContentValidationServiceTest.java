package com.autotrader.autotraderbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for EmailContentValidationService.
 * Tests spam detection, content filtering, and security checks.
 */
@ExtendWith(MockitoExtension.class)
class EmailContentValidationServiceTest {

    private EmailContentValidationService validationService;

    @BeforeEach
    void setUp() {
        validationService = new EmailContentValidationService();
    }

    @Test
    void testValidateEmailContent_ValidContent_ReturnsValid() {
        // Arrange
        String subject = "Welcome to AutoTrader";
        String content = "Thank you for joining our platform!";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getWarnings().isEmpty());
    }

    @Test
    void testValidateEmailContent_EmptySubject_ReturnsInvalid() {
        // Arrange
        String subject = "";
        String content = "Some content";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("cannot be empty")));
    }

    @Test
    void testValidateEmailContent_EmptyContent_ReturnsInvalid() {
        // Arrange
        String subject = "Valid Subject";
        String content = "";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("cannot be empty")));
    }

    @Test
    void testValidateEmailContent_SpamKeywords_ReturnsInvalid() {
        // Arrange
        String subject = "BUY NOW LIMITED TIME OFFER";
        String content = "Act now before it's too late!";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("spam keyword")));
    }

    @Test
    void testValidateEmailContent_ExcessiveCaps_ReturnsWarning() {
        // Arrange
        String subject = "IMPORTANT ANNOUNCEMENT";
        String content = "This is a normal message";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.hasWarnings());
        assertTrue(result.getWarnings().stream()
            .anyMatch(warning -> warning.contains("capital letters")));
    }

    @Test
    void testValidateEmailContent_ExcessivePunctuation_ReturnsWarning() {
        // Arrange
        String subject = "Important!!!";
        String content = "This is a test message???";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.hasWarnings());
        assertTrue(result.getWarnings().stream()
            .anyMatch(warning -> warning.contains("punctuation")));
    }

    @Test
    void testValidateEmailContent_SubjectTooLong_ReturnsInvalid() {
        // Arrange
        String subject = "A".repeat(101); // 101 characters
        String content = "Normal content";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("too long")));
    }

    @Test
    void testValidateEmailContent_ContentTooLong_ReturnsInvalid() {
        // Arrange
        String subject = "Normal subject";
        String content = "A".repeat(10001); // 10,001 characters
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("too long")));
    }

    @Test
    void testValidateEmailContent_MaliciousScript_ReturnsInvalid() {
        // Arrange
        String subject = "Normal subject";
        String content = "Click here: <script>alert('xss')</script>";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("malicious code")));
    }

    @Test
    void testValidateEmailContent_JavaScriptProtocol_ReturnsInvalid() {
        // Arrange
        String subject = "Normal subject";
        String content = "Click here: javascript:alert('xss')";
        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content, recipient);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream()
            .anyMatch(error -> error.contains("malicious code")));
    }

    @Test
    void testValidateEmailContent_ExcessiveLinks_ReturnsWarning() {
        // Arrange
        String subject = "Normal subject";
        StringBuilder content = new StringBuilder("Check these links:");
        for (int i = 0; i < 11; i++) {
            content.append(" https://example").append(i).append(".com");
        }

        String recipient = "user@example.com";

        // Act
        EmailContentValidationService.ValidationResult result = 
            validationService.validateEmailContent(subject, content.toString(), recipient);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.hasWarnings());
        assertTrue(result.getWarnings().stream()
            .anyMatch(warning -> warning.contains("many links")));
    }

    @Test
    void testValidationResult_ImmutableLists() {
        // Arrange
        EmailContentValidationService.ValidationResult result = new EmailContentValidationService.ValidationResult();
        result.addError("Test error");
        result.addWarning("Test warning");

        // Act
        result.getErrors().add("Should not be added");
        result.getWarnings().add("Should not be added");

        // Assert
        assertEquals(1, result.getErrors().size());
        assertEquals(1, result.getWarnings().size());
        assertTrue(result.getErrors().contains("Test error"));
        assertTrue(result.getWarnings().contains("Test warning"));
    }
}
