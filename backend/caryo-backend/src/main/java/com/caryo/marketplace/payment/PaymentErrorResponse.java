package com.caryo.marketplace.payment;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standardized Payment Error Response
 * 
 * Provides consistent error responses across all payment endpoints.
 * Includes error codes, localized messages, and debugging information.
 */
@Data
@Builder
public class PaymentErrorResponse {
    
    private String errorCode;
    private String message;
    private String localizedMessage;
    private LocalDateTime timestamp;
    private String path;
    private String transactionId;
    private Map<String, Object> details;
    private String supportReference;
    
    /**
     * Common error codes for payment operations
     */
    public static class ErrorCodes {
        public static final String INVALID_PAYMENT_DATA = "PAYMENT_001";
        public static final String INSUFFICIENT_FUNDS = "PAYMENT_002";
        public static final String PAYMENT_DECLINED = "PAYMENT_003";
        public static final String PROVIDER_UNAVAILABLE = "PAYMENT_004";
        public static final String DUPLICATE_PAYMENT = "PAYMENT_005";
        public static final String INVALID_CURRENCY = "PAYMENT_006";
        public static final String AMOUNT_TOO_LOW = "PAYMENT_007";
        public static final String AMOUNT_TOO_HIGH = "PAYMENT_008";
        public static final String UNSUPPORTED_PAYMENT_METHOD = "PAYMENT_009";
        public static final String SUBSCRIPTION_NOT_FOUND = "PAYMENT_010";
        public static final String DEALER_NOT_FOUND = "PAYMENT_011";
        public static final String TRIAL_EXPIRED = "PAYMENT_012";
        public static final String SUBSCRIPTION_LIMIT_EXCEEDED = "PAYMENT_013";
        public static final String INVALID_TIER = "PAYMENT_014";
        public static final String PAYMENT_PROCESSING_ERROR = "PAYMENT_015";
        public static final String WEBHOOK_VERIFICATION_FAILED = "PAYMENT_016";
        public static final String RATE_LIMIT_EXCEEDED = "PAYMENT_017";
        public static final String UNAUTHORIZED_ACCESS = "PAYMENT_018";
        public static final String INVALID_TRANSACTION_STATE = "PAYMENT_019";
        public static final String CONFIGURATION_ERROR = "PAYMENT_020";
    }
    
    /**
     * Create error response for validation failures
     */
    public static PaymentErrorResponse validationError(String message, String path, Map<String, Object> details) {
        return PaymentErrorResponse.builder()
                .errorCode(ErrorCodes.INVALID_PAYMENT_DATA)
                .message(message)
                .timestamp(LocalDateTime.now())
                .path(path)
                .details(details)
                .supportReference(generateSupportReference())
                .build();
    }
    
    /**
     * Create error response for provider errors
     */
    public static PaymentErrorResponse providerError(String message, String transactionId, String path) {
        return PaymentErrorResponse.builder()
                .errorCode(ErrorCodes.PROVIDER_UNAVAILABLE)
                .message(message)
                .timestamp(LocalDateTime.now())
                .path(path)
                .transactionId(transactionId)
                .supportReference(generateSupportReference())
                .build();
    }
    
    /**
     * Create error response for duplicate payments
     */
    public static PaymentErrorResponse duplicatePayment(String transactionId, String path) {
        return PaymentErrorResponse.builder()
                .errorCode(ErrorCodes.DUPLICATE_PAYMENT)
                .message("Payment with this idempotency key already exists")
                .timestamp(LocalDateTime.now())
                .path(path)
                .transactionId(transactionId)
                .supportReference(generateSupportReference())
                .build();
    }
    
    /**
     * Create error response for rate limiting
     */
    public static PaymentErrorResponse rateLimitExceeded(String path) {
        return PaymentErrorResponse.builder()
                .errorCode(ErrorCodes.RATE_LIMIT_EXCEEDED)
                .message("Too many payment requests. Please try again later.")
                .timestamp(LocalDateTime.now())
                .path(path)
                .supportReference(generateSupportReference())
                .build();
    }
    
    /**
     * Create error response for unauthorized access
     */
    public static PaymentErrorResponse unauthorizedAccess(String path) {
        return PaymentErrorResponse.builder()
                .errorCode(ErrorCodes.UNAUTHORIZED_ACCESS)
                .message("You are not authorized to perform this payment operation")
                .timestamp(LocalDateTime.now())
                .path(path)
                .supportReference(generateSupportReference())
                .build();
    }
    
    /**
     * Generate unique support reference for tracking
     */
    private static String generateSupportReference() {
        return "SUP_" + System.currentTimeMillis() + "_" + 
               Integer.toHexString((int)(Math.random() * 0xFFFF)).toUpperCase();
    }
}
