package com.autotrader.autotraderbackend.payment;

/**
 * Payment transaction status
 * Represents the lifecycle of a payment from initiation to completion
 */
public enum PaymentStatus {
    /**
     * Payment has been initiated but not yet processed
     */
    PENDING,

    /**
     * Payment is being processed by the provider
     */
    PROCESSING,

    /**
     * Payment completed successfully
     */
    COMPLETED,

    /**
     * Payment failed (insufficient funds, declined card, etc.)
     */
    FAILED,

    /**
     * Payment was cancelled by user or admin
     */
    CANCELLED,

    /**
     * Payment refunded to customer
     */
    REFUNDED,

    /**
     * Payment is on hold pending verification (e.g., manual transfer verification)
     */
    PENDING_VERIFICATION,

    /**
     * Payment expired (e.g., manual transfer not completed within time limit)
     */
    EXPIRED;

    /**
     * Check if payment is in a final state (no further changes expected)
     */
    public boolean isFinal() {
        return this == COMPLETED || this == FAILED || this == CANCELLED || this == REFUNDED || this == EXPIRED;
    }

    /**
     * Check if payment was successful
     */
    public boolean isSuccessful() {
        return this == COMPLETED;
    }

    /**
     * Check if payment is still in progress
     */
    public boolean isPending() {
        return this == PENDING || this == PROCESSING || this == PENDING_VERIFICATION;
    }
}

