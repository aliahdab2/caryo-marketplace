package com.caryo.marketplace.exception;

import java.util.List;

/**
 * Exception thrown when CarQuery API response validation fails
 */
public class CarQueryValidationException extends CarQueryException {

    private final List<String> validationIssues;
    private final List<String> validationWarnings;

    public CarQueryValidationException(String operation, List<String> issues) {
        super(operation, "Validation failed: " + String.join(", ", issues));
        this.validationIssues = issues;
        this.validationWarnings = List.of();
    }

    public CarQueryValidationException(String operation, List<String> issues, List<String> warnings) {
        super(operation, "Validation failed: " + String.join(", ", issues));
        this.validationIssues = issues;
        this.validationWarnings = warnings;
    }

    public CarQueryValidationException(String operation, String message, List<String> issues) {
        super(operation, message);
        this.validationIssues = issues;
        this.validationWarnings = List.of();
    }

    public List<String> getValidationIssues() {
        return validationIssues;
    }

    public List<String> getValidationWarnings() {
        return validationWarnings;
    }
}
