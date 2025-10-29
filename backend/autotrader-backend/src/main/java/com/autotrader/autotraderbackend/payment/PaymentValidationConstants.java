package com.autotrader.autotraderbackend.payment;

/**
 * Payment validation constants
 * Centralized validation rules for payment system
 */
public final class PaymentValidationConstants {
    
    private PaymentValidationConstants() {
        // Utility class
    }
    
    // Amount validation
    public static final String MIN_AMOUNT = "0.01";
    public static final String MAX_AMOUNT = "1000000.00";
    
    // String length validation
    public static final int MAX_DESCRIPTION_LENGTH = 500;
    public static final int MAX_TIER_LENGTH = 50;
    public static final int MAX_PROVIDER_ID_LENGTH = 50;
    public static final int MAX_CURRENCY_LENGTH = 10;
    public static final int MAX_PAYMENT_METHOD_LENGTH = 30;
    public static final int MAX_IDEMPOTENCY_KEY_LENGTH = 100;
    public static final int MIN_IDEMPOTENCY_KEY_LENGTH = 10;
    
    // Regex patterns
    public static final String TIER_PATTERN = "^(basic|advanced|professional)$";
    public static final String CURRENCY_PATTERN = "^(SYP|USD|EUR|BTC|USDT)$";
    public static final String PROVIDER_ID_PATTERN = "^[a-z][a-z0-9_]*$";
    public static final String PAYMENT_METHOD_PATTERN = "^[A-Z][A-Z0-9_]*$";
    public static final String IDEMPOTENCY_KEY_PATTERN = "^[a-zA-Z0-9_-]+$";
    
    // Error messages
    public static final String INVALID_AMOUNT_MESSAGE = "Amount must be between " + MIN_AMOUNT + " and " + MAX_AMOUNT;
    public static final String INVALID_TIER_MESSAGE = "Tier must be one of: basic, advanced, professional";
    public static final String INVALID_CURRENCY_MESSAGE = "Currency must be one of: SYP, USD, EUR, BTC, USDT";
    public static final String INVALID_PROVIDER_MESSAGE = "Provider ID must contain only lowercase letters, numbers, and underscores";
    public static final String INVALID_PAYMENT_METHOD_MESSAGE = "Payment method must contain only uppercase letters, numbers, and underscores";
    public static final String INVALID_IDEMPOTENCY_KEY_MESSAGE = "Idempotency key must be 10-100 characters, alphanumeric with hyphens/underscores only";
}
