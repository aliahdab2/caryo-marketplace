package com.caryo.marketplace.exception;

/**
 * Exception thrown when CarQuery API operations fail
 */
public class CarQueryException extends RuntimeException {

    private final String operation;
    private final String details;

    public CarQueryException(String message) {
        super(message);
        this.operation = "Unknown";
        this.details = message;
    }

    public CarQueryException(String message, Throwable cause) {
        super(message, cause);
        this.operation = "Unknown";
        this.details = message;
    }

    public CarQueryException(String operation, String message) {
        super(message);
        this.operation = operation;
        this.details = message;
    }

    public CarQueryException(String operation, String message, Throwable cause) {
        super(message, cause);
        this.operation = operation;
        this.details = message;
    }

    public String getOperation() {
        return operation;
    }

    public String getDetails() {
        return details;
    }
}
