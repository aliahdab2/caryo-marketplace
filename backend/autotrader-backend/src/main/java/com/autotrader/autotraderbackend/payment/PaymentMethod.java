package com.autotrader.autotraderbackend.payment;

/**
 * Payment method types supported by the system
 */
public enum PaymentMethod {
    /**
     * Manual bank transfer - dealer sends money to our account
     */
    BANK_TRANSFER,

    /**
     * Credit or debit card payment
     */
    CARD,

    /**
     * Direct debit from bank account
     */
    DIRECT_DEBIT,

    /**
     * Mobile wallet (e.g., SyriaPay, MTN, Syriatel)
     */
    MOBILE_WALLET,

    /**
     * Cryptocurrency payment (BTC, USDT, etc.)
     */
    CRYPTO,

    /**
     * Cash payment at physical location
     */
    CASH,

    /**
     * Payment gateway (Cham Bank, Bemo Bank, etc.)
     */
    PAYMENT_GATEWAY;

    /**
     * Check if this payment method requires manual verification
     */
    public boolean requiresManualVerification() {
        return this == BANK_TRANSFER || this == CASH;
    }

    /**
     * Check if this payment method is instant (no verification delay)
     */
    public boolean isInstant() {
        return this == CARD || this == PAYMENT_GATEWAY || this == MOBILE_WALLET;
    }
}

