package com.autotrader.autotraderbackend.exception;

/**
 * Custom security exception for messaging system security violations.
 * Used for rate limiting, unauthorized access, and content validation errors.
 */
public class SecurityException extends RuntimeException {
    
    public SecurityException(String message) {
        super(message);
    }
    
    public SecurityException(String message, Throwable cause) {
        super(message, cause);
    }
}
