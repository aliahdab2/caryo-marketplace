package com.autotrader.autotraderbackend.util;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Utility class for validating password strength and security requirements
 */
@Component
public class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    // Common weak passwords to reject
    private static final String[] COMMON_PASSWORDS = {
        "password", "123456", "password123", "admin", "qwerty", "letmein",
        "welcome", "monkey", "1234567890", "password1", "123456789"
    };

    // Regex patterns for password requirements
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]");

    /**
     * Validates password strength and returns validation result
     */
    public PasswordValidationResult validatePassword(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.trim().isEmpty()) {
            errors.add("Password cannot be empty");
            return new PasswordValidationResult(false, errors);
        }

        String trimmedPassword = password.trim();

        // Length validation
        if (trimmedPassword.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters long");
        }

        if (trimmedPassword.length() > MAX_LENGTH) {
            errors.add("Password must not exceed " + MAX_LENGTH + " characters");
        }

        // Character requirements - require at least 2 of 4 character types (reasonable security)
        int characterTypes = 0;

        if (LOWERCASE.matcher(trimmedPassword).find()) {
            characterTypes++;
        }

        if (UPPERCASE.matcher(trimmedPassword).find()) {
            characterTypes++;
        }

        if (DIGIT.matcher(trimmedPassword).find()) {
            characterTypes++;
        }

        if (SPECIAL_CHAR.matcher(trimmedPassword).find()) {
            characterTypes++;
        }

        if (characterTypes < 2) {
            errors.add("Password must contain at least 2 different character types (lowercase, uppercase, numbers, or special characters)");
        }

        // Check for exact common weak passwords (not just containing them)
        String lowerPassword = trimmedPassword.toLowerCase();
        for (String commonPassword : COMMON_PASSWORDS) {
            if (lowerPassword.equals(commonPassword)) {
                errors.add("Password is too common and weak");
                break;
            }
        }

        // Remove sequential character check entirely - too restrictive

        // Check for repeated characters (only excessive repetition)
        if (hasExcessiveRepeatedChars(trimmedPassword)) {
            errors.add("Password should not contain too many repeated characters");
        }

        return new PasswordValidationResult(errors.isEmpty(), errors);
    }

    // Removed overly restrictive sequential character checking

    /**
     * Checks if password has excessive repeated characters (more than 3 in a row)
     */
    private boolean hasExcessiveRepeatedChars(String password) {
        int maxRepeated = 0;
        int currentRepeated = 1;

        for (int i = 1; i < password.length(); i++) {
            if (password.charAt(i) == password.charAt(i - 1)) {
                currentRepeated++;
            } else {
                maxRepeated = Math.max(maxRepeated, currentRepeated);
                currentRepeated = 1;
            }
        }
        maxRepeated = Math.max(maxRepeated, currentRepeated);

        // Allow max 3 repeated characters
        return maxRepeated > 3;
    }

    /**
     * Result class for password validation
     */
    public static class PasswordValidationResult {
        private final boolean valid;
        private final List<String> errors;

        public PasswordValidationResult(boolean valid, List<String> errors) {
            this.valid = valid;
            this.errors = errors;
        }

        public boolean isValid() {
            return valid;
        }

        public List<String> getErrors() {
            return errors;
        }

        public String getErrorMessage() {
            return String.join("; ", errors);
        }
    }
}
