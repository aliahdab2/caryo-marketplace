package com.autotrader.autotraderbackend.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class PasswordValidatorTest {

    private PasswordValidator passwordValidator;

    @BeforeEach
    void setUp() {
        passwordValidator = new PasswordValidator();
    }

    @Test
    void validatePassword_WithValidPassword_ShouldReturnValid() {
        // Arrange
        String validPassword = "MySecure@Pass1";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(validPassword);

        // Assert
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    void validatePassword_WithNullPassword_ShouldReturnInvalid() {
        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(null);

        // Assert
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("cannot be empty"));
    }

    @Test
    void validatePassword_WithEmptyPassword_ShouldReturnInvalid() {
        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword("");

        // Assert
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("cannot be empty"));
    }

    @Test
    void validatePassword_WithWhitespaceOnlyPassword_ShouldReturnInvalid() {
        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword("   ");

        // Assert
        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
        assertTrue(result.getErrors().get(0).contains("cannot be empty"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"1234567", "abc", "A1!", "short"})
    void validatePassword_WithTooShortPassword_ShouldReturnInvalid(String shortPassword) {
        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(shortPassword);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("at least 8 characters")));
    }

    @Test
    void validatePassword_WithTooLongPassword_ShouldReturnInvalid() {
        // Arrange
        String longPassword = "A".repeat(129) + "1!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(longPassword);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("must not exceed 128 characters")));
    }

    @Test
    void validatePassword_WithNoLowercase_ShouldReturnInvalid() {
        // Arrange
        String password = "PASSWORD123!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("lowercase letter")));
    }

    @Test
    void validatePassword_WithNoUppercase_ShouldReturnInvalid() {
        // Arrange
        String password = "password123!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("uppercase letter")));
    }

    @Test
    void validatePassword_WithNoDigit_ShouldReturnInvalid() {
        // Arrange
        String password = "Password!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("digit")));
    }

    @Test
    void validatePassword_WithNoSpecialCharacter_ShouldReturnInvalid() {
        // Arrange
        String password = "Password123";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("special character")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"MySecure@Pass1", "Strong#Key9", "Valid$Code2", "Safe&Token8"})
    void validatePassword_WithValidPasswords_ShouldReturnValid(String validPassword) {
        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(validPassword);

        // Assert
        assertTrue(result.isValid(), "Password should be valid: " + validPassword);
        assertTrue(result.getErrors().isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"password123!", "PASSWORD123!", "Password!", "Password123"})
    void validatePassword_WithMissingRequirements_ShouldReturnInvalid(String invalidPassword) {
        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(invalidPassword);

        // Assert
        assertFalse(result.isValid(), "Password should be invalid: " + invalidPassword);
        assertFalse(result.getErrors().isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"password123!", "Password123password", "letmein123!", "admin123!"})
    void validatePassword_WithCommonWeakPatterns_ShouldReturnInvalid(String weakPassword) {
        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(weakPassword);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("common weak patterns")));
    }

    @Test
    void validatePassword_WithObviousSequentialCharacters_ShouldReturnInvalid() {
        // Arrange
        String password = "MySecret123!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("sequential characters")));
    }

    @Test
    void validatePassword_WithExcessiveRepeatedCharacters_ShouldReturnInvalid() {
        // Arrange - More than 3 repeated characters should be invalid
        String password = "Passsssword1!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("repeated characters")));
    }

    @Test
    void validatePassword_WithAllowedRepeatedCharacters_ShouldReturnValid() {
        // Arrange - Up to 3 repeated characters should be allowed
        String password = "Passsword1!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertTrue(result.isValid());
    }

    @Test
    void validatePassword_WithDescendingSequence_ShouldReturnInvalid() {
        // Arrange
        String password = "MySecret321!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("sequential characters")));
    }

    @Test
    void validatePassword_WithAlphabeticalSequence_ShouldReturnInvalid() {
        // Arrange
        String password = "MySecretabc1!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("sequential characters")));
    }
    
    @Test
    void validatePassword_WithNonObviousSequence_ShouldReturnValid() {
        // Arrange - Non-obvious sequences should be allowed
        String password = "MySecret159!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertTrue(result.isValid());
    }

    @Test
    void validatePassword_WithMultipleErrors_ShouldReturnAllErrors() {
        // Arrange - Password with multiple issues
        String password = "pass";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() > 1);
        
        // Should have errors for: length, uppercase, digit, special character
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("at least 8 characters")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("uppercase letter")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("digit")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("special character")));
    }

    @Test
    void validatePassword_GetErrorMessage_ShouldJoinAllErrors() {
        // Arrange
        String password = "pass";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        String errorMessage = result.getErrorMessage();
        assertNotNull(errorMessage);
        assertFalse(errorMessage.isEmpty());
        assertTrue(errorMessage.contains(";"));
    }

    @Test
    void validatePassword_WithSpecialCharacters_ShouldAcceptVariousSpecialChars() {
        // Test various special characters
        String[] specialChars = {"!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "-", "=", "[", "]", "{", "}", ";", "'", ":", "\"", "\\", "|", ",", ".", "<", ">", "/", "?"};
        
        for (String specialChar : specialChars) {
            String password = "MySecret1" + specialChar;
            PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);
            assertTrue(result.isValid(), "Password with special character '" + specialChar + "' should be valid");
        }
    }

    @Test
    void validatePassword_WithWhitespaceInMiddle_ShouldBeValid() {
        // Arrange - Passwords with spaces should be allowed
        String password = "My Secret 159!";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertTrue(result.isValid());
    }
}
