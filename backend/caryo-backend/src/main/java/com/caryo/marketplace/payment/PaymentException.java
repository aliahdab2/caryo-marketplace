package com.caryo.marketplace.payment;

/**
 * Base exception for all payment-related errors
 */
public class PaymentException extends RuntimeException {

    private String errorCode;
    private Object[] errorArgs;

    public PaymentException(String message) {
        super(message);
    }

    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }

    public PaymentException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public PaymentException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public PaymentException(String errorCode, String message, Object... errorArgs) {
        super(message);
        this.errorCode = errorCode;
        this.errorArgs = errorArgs;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public Object[] getErrorArgs() {
        return errorArgs;
    }
}

