package com.autotrader.autotraderbackend.exception;

/**
 * Exception thrown when brand activation validation fails
 */
public class BrandActivationException extends RuntimeException {

    public BrandActivationException(String message) {
        super(message);
    }

    public BrandActivationException(String message, Throwable cause) {
        super(message, cause);
    }
}
