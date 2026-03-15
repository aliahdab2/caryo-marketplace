package com.caryo.marketplace.payment;

/**
 * Exception thrown when a duplicate payment is detected
 */
public class DuplicatePaymentException extends PaymentException {

    private final String idempotencyKey;
    private final String originalTransactionId;

    public DuplicatePaymentException(String idempotencyKey, String originalTransactionId) {
        super(
            "DUPLICATE_PAYMENT",
            String.format("Payment with idempotency key '%s' already exists (transaction: %s)", 
                idempotencyKey, originalTransactionId)
        );
        this.idempotencyKey = idempotencyKey;
        this.originalTransactionId = originalTransactionId;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public String getOriginalTransactionId() {
        return originalTransactionId;
    }
}
