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
    void validatePassword_Ali123123_ShouldReturnValid() {
        // Arrange - The user's example password
        String password = "Ali123123";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertTrue(result.isValid(), "Ali123123 should be valid (has uppercase + lowercase + digits = 3 types)");
    }

    @Test
    void validatePassword_WithOnlyOneCharacterType_ShouldReturnInvalid() {
        // Arrange - Only lowercase letters
        String password = "password";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("2 different character types")));
    }

    @Test
    void validatePassword_WithTwoCharacterTypes_ShouldReturnValid() {
        // Arrange - Use passwords that aren't in the common passwords list
        String password1 = "MySecret"; // Uppercase + lowercase (2 types) - 8 chars
        String password2 = "mysecret456"; // Lowercase + digits (2 types)  
        String password3 = "MYSECRET!!!"; // Uppercase + special (2 types)

        // Act
        PasswordValidator.PasswordValidationResult result1 = passwordValidator.validatePassword(password1);
        PasswordValidator.PasswordValidationResult result2 = passwordValidator.validatePassword(password2);
        PasswordValidator.PasswordValidationResult result3 = passwordValidator.validatePassword(password3);

        // Assert
        assertTrue(result1.isValid(), "MySecret with uppercase + lowercase should be valid");
        assertTrue(result2.isValid(), "mysecret456 should be valid");
        assertTrue(result3.isValid(), "MYSECRET!!! should be valid");
    }
    
    @Test
    void validatePassword_PreviouslyStrictPasswords_ShouldNowBeValid() {
        // Arrange - These were invalid under strict rules but should be valid now (avoid common passwords)
        String password1 = "mysecret456!"; // lowercase + digits + special (3 types)
        String password2 = "MYSECRET456!"; // uppercase + digits + special (3 types)  
        String password3 = "MySecret!"; // uppercase + lowercase + special (3 types)
        String password4 = "MySecret456"; // uppercase + lowercase + digits (3 types)

        // Act
        PasswordValidator.PasswordValidationResult result1 = passwordValidator.validatePassword(password1);
        PasswordValidator.PasswordValidationResult result2 = passwordValidator.validatePassword(password2);
        PasswordValidator.PasswordValidationResult result3 = passwordValidator.validatePassword(password3);
        PasswordValidator.PasswordValidationResult result4 = passwordValidator.validatePassword(password4);

        // Assert
        assertTrue(result1.isValid(), "mysecret456! should be valid (3 character types)");
        assertTrue(result2.isValid(), "MYSECRET456! should be valid (3 character types)");
        assertTrue(result3.isValid(), "MySecret! should be valid (3 character types)");
        assertTrue(result4.isValid(), "MySecret456 should be valid (3 character types)");
    }

    @Test
    void validatePassword_WithThreeCharacterTypes_ShouldReturnValid() {
        // Arrange - MySecret456 has uppercase + lowercase + digits (3 types)
        String password = "MySecret456";

        // Act
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(password);

        // Assert
        assertTrue(result.isValid(), "MySecret456 should be valid (has 3 character types)");
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
    @ValueSource(strings = {"password", "PASSWORD", "12345678", "!@#$%^&*"})
    void validatePassword_WithOnlyOneCharacterType_ShouldReturnInvalid(String invalidPassword) {
        // Act - These passwords only have 1 character type, should be invalid
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(invalidPassword);

        // Assert
        assertFalse(result.isValid(), "Password should be invalid (only 1 character type): " + invalidPassword);
        assertFalse(result.getErrors().isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"password", "123456", "admin", "qwerty", "letmein"})
    void validatePassword_WithExactCommonWeakPasswords_ShouldReturnInvalid(String weakPassword) {
        // Act - These are exact matches to common weak passwords
        PasswordValidator.PasswordValidationResult result = passwordValidator.validatePassword(weakPassword);

        // Assert
        assertFalse(result.isValid());
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("too common and weak")));
    }

    // Removed sequential character tests - too restrictive

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

    // Removed sequential character tests - too restrictive

    // Removed sequential character tests - too restrictive
    
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
    void validatePassword_WithShortSequences_ShouldReturnValid() {
        // Arrange - Short sequences (3-4 chars) should now be allowed - make sure 8+ chars
        String password1 = "Ali123!!";  // 8 chars
        String password2 = "MySecret321!";
        String password3 = "Password456!";

        // Act
        PasswordValidator.PasswordValidationResult result1 = passwordValidator.validatePassword(password1);
        PasswordValidator.PasswordValidationResult result2 = passwordValidator.validatePassword(password2);
        PasswordValidator.PasswordValidationResult result3 = passwordValidator.validatePassword(password3);

        // Assert
        assertTrue(result1.isValid(), "Ali123!! should be valid (short sequence allowed)");
        assertTrue(result2.isValid(), "MySecret321! should be valid (short sequence allowed)");
        assertTrue(result3.isValid(), "Password456! should be valid (short sequence allowed)");
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
        
        // Should have errors for: length and character types
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("at least 8 characters")));
        assertTrue(result.getErrors().stream().anyMatch(error -> error.contains("2 different character types")));
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
