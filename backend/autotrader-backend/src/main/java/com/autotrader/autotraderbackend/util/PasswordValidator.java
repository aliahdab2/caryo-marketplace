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
        
        // Character requirements
        if (!LOWERCASE.matcher(trimmedPassword).find()) {
            errors.add("Password must contain at least one lowercase letter");
        }
        
        if (!UPPERCASE.matcher(trimmedPassword).find()) {
            errors.add("Password must contain at least one uppercase letter");
        }
        
        if (!DIGIT.matcher(trimmedPassword).find()) {
            errors.add("Password must contain at least one digit");
        }
        
        if (!SPECIAL_CHAR.matcher(trimmedPassword).find()) {
            errors.add("Password must contain at least one special character");
        }
        
        // Check for common weak passwords
        String lowerPassword = trimmedPassword.toLowerCase();
        for (String commonPassword : COMMON_PASSWORDS) {
            if (lowerPassword.contains(commonPassword)) {
                errors.add("Password contains common weak patterns");
                break;
            }
        }
        
        // Check for sequential characters (only obvious sequences)
        if (hasObviousSequentialChars(trimmedPassword)) {
            errors.add("Password should not contain obvious sequential characters (e.g., 123, abc)");
        }
        
        // Check for repeated characters (only excessive repetition)
        if (hasExcessiveRepeatedChars(trimmedPassword)) {
            errors.add("Password should not contain too many repeated characters");
        }
        
        return new PasswordValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Checks if password contains obvious sequential characters (only common sequences)
     */
    private boolean hasObviousSequentialChars(String password) {
        String lowerPassword = password.toLowerCase();
        
        // Check for common obvious sequences
        String[] obviousSequences = {
            "123", "234", "345", "456", "567", "678", "789", "890",
            "321", "432", "543", "654", "765", "876", "987", "098",
            "abc", "bcd", "cde", "def", "efg", "fgh", "ghi", "hij",
            "cba", "dcb", "edc", "fed", "gfe", "hgf", "ihg", "jih",
            "qwe", "wer", "ert", "rty", "tyu", "yui", "uio", "iop"
        };
        
        for (String sequence : obviousSequences) {
            if (lowerPassword.contains(sequence)) {
                return true;
            }
        }
        
        return false;
    }
    
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
