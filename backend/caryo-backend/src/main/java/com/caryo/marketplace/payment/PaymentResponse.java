package com.caryo.marketplace.payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Standardized payment response returned by all payment providers
 * This ensures consistent handling across different payment gateways
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    /**
     * Whether the payment operation was successful
     */
    private boolean success;

    /**
     * Payment status
     */
    private PaymentStatus status;

    /**
     * Unique transaction ID from our system
     */
    private String transactionId;

    /**
     * External payment ID from the payment provider (if applicable)
     */
    private String externalPaymentId;

    /**
     * Payment amount
     */
    private BigDecimal amount;

    /**
     * Currency code
     */
    private String currency;

    /**
     * Human-readable message (for success or error)
     */
    private String message;

    /**
     * Error code (if failed)
     */
    private String errorCode;

    /**
     * Detailed error message (if failed)
     */
    private String errorDetails;

    /**
     * Timestamp of the payment operation
     */
    @Builder.Default
    private ZonedDateTime timestamp = ZonedDateTime.now();

    /**
     * Payment receipt URL (if available)
     */
    private String receiptUrl;

    /**
     * Additional metadata from the payment provider
     */
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    /**
     * Add metadata entry
     */
    public void addMetadata(String key, Object value) {
        if (this.metadata == null) {
            this.metadata = new HashMap<>();
        }
        this.metadata.put(key, value);
    }

    // Convenience factory methods

    /**
     * Create a successful payment response
     */
    public static PaymentResponse success(String transactionId, BigDecimal amount, String currency, String message) {
        return PaymentResponse.builder()
                .success(true)
                .status(PaymentStatus.COMPLETED)
                .transactionId(transactionId)
                .amount(amount)
                .currency(currency)
                .message(message)
                .timestamp(ZonedDateTime.now())
                .build();
    }

    /**
     * Create a pending payment response (e.g., for manual transfer)
     */
    public static PaymentResponse pending(String transactionId, BigDecimal amount, String currency, String message) {
        return PaymentResponse.builder()
                .success(true)
                .status(PaymentStatus.PENDING_VERIFICATION)
                .transactionId(transactionId)
                .amount(amount)
                .currency(currency)
                .message(message)
                .timestamp(ZonedDateTime.now())
                .build();
    }

    /**
     * Create a failed payment response
     */
    public static PaymentResponse failure(String errorCode, String errorMessage, String errorDetails) {
        return PaymentResponse.builder()
                .success(false)
                .status(PaymentStatus.FAILED)
                .message(errorMessage)
                .errorCode(errorCode)
                .errorDetails(errorDetails)
                .timestamp(ZonedDateTime.now())
                .build();
    }

    /**
     * Create a processing payment response
     */
    public static PaymentResponse processing(String transactionId, BigDecimal amount, String currency) {
        return PaymentResponse.builder()
                .success(true)
                .status(PaymentStatus.PROCESSING)
                .transactionId(transactionId)
                .amount(amount)
                .currency(currency)
                .message("Payment is being processed")
                .timestamp(ZonedDateTime.now())
                .build();
    }
}

