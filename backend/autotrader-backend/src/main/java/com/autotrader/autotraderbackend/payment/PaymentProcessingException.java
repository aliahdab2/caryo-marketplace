package com.autotrader.autotraderbackend.payment;

/**
 * Exception thrown when payment processing fails
 */
public class PaymentProcessingException extends PaymentException {

    private final String transactionId;
    private final String providerErrorCode;

    public PaymentProcessingException(String message) {
        super(message);
        this.transactionId = null;
        this.providerErrorCode = null;
    }

    public PaymentProcessingException(String message, Throwable cause) {
        super(message, cause);
        this.transactionId = null;
        this.providerErrorCode = null;
    }

    public PaymentProcessingException(String transactionId, String message, String providerErrorCode) {
        super("PAYMENT_PROCESSING_FAILED", message);
        this.transactionId = transactionId;
        this.providerErrorCode = providerErrorCode;
    }

    public PaymentProcessingException(String transactionId, String message, String providerErrorCode, Throwable cause) {
        super("PAYMENT_PROCESSING_FAILED", message, cause);
        this.transactionId = transactionId;
        this.providerErrorCode = providerErrorCode;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getProviderErrorCode() {
        return providerErrorCode;
    }
}

