package com.autotrader.autotraderbackend.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for handling payment idempotency
 * 
 * Prevents duplicate payments by tracking idempotency keys.
 * If the same key is used twice, returns the original result.
 */
@Service
@Transactional
public class IdempotencyService {

    private final PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    public IdempotencyService(PaymentTransactionRepository paymentTransactionRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    /**
     * Generate a unique idempotency key
     * Format: "IDEM_YYYYMMDD_UUID"
     */
    public String generateIdempotencyKey() {
        String timestamp = java.time.LocalDate.now().toString().replace("-", "");
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        return "IDEM_" + timestamp + "_" + uuid.toUpperCase();
    }

    /**
     * Check if an idempotency key has been used before
     * 
     * @param idempotencyKey The key to check
     * @return Optional containing the existing transaction if found
     */
    public Optional<PaymentTransaction> findExistingTransaction(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            return Optional.empty();
        }
        
        return paymentTransactionRepository.findByIdempotencyKey(idempotencyKey.trim());
    }

    /**
     * Validate idempotency key format
     * 
     * @param idempotencyKey The key to validate
     * @return true if valid format
     */
    public boolean isValidIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            return false;
        }

        String key = idempotencyKey.trim();
        
        // Must be between 10 and 100 characters
        if (key.length() < 10 || key.length() > 100) {
            return false;
        }

        // Must contain only alphanumeric characters, hyphens, and underscores
        return key.matches("^[a-zA-Z0-9_-]+$");
    }

    /**
     * Create a PaymentResponse from an existing transaction (for idempotency)
     * 
     * @param existingTransaction The existing transaction
     * @return PaymentResponse matching the original result
     */
    public PaymentResponse createResponseFromExistingTransaction(PaymentTransaction existingTransaction) {
        PaymentResponse.PaymentResponseBuilder builder = PaymentResponse.builder()
                .transactionId(existingTransaction.getTransactionId())
                .externalPaymentId(existingTransaction.getExternalPaymentId())
                .amount(existingTransaction.getAmount())
                .currency(existingTransaction.getCurrency().name())
                .status(existingTransaction.getStatus())
                .timestamp(existingTransaction.getCreatedAt())
                .receiptUrl(existingTransaction.getReceiptUrl());

        // Set success flag based on status
        builder.success(existingTransaction.isSuccessful());

        // Add error details if failed
        if (!existingTransaction.isSuccessful()) {
            builder.errorCode(existingTransaction.getErrorCode())
                   .errorDetails(existingTransaction.getErrorMessage());
        }

        // Add message based on status
        String message = switch (existingTransaction.getStatus()) {
            case COMPLETED -> "Payment completed successfully";
            case PENDING -> "Payment is pending";
            case PROCESSING -> "Payment is being processed";
            case PENDING_VERIFICATION -> "Payment is pending verification";
            case FAILED -> "Payment failed: " + existingTransaction.getErrorMessage();
            case CANCELLED -> "Payment was cancelled";
            case REFUNDED -> "Payment was refunded";
            case EXPIRED -> "Payment expired";
        };
        
        builder.message(message);

        PaymentResponse response = builder.build();

        // Add metadata
        if (existingTransaction.getMetadata() != null) {
            existingTransaction.getMetadata().forEach(response::addMetadata);
        }

        return response;
    }

    /**
     * Handle idempotent payment request
     * 
     * @param idempotencyKey The idempotency key
     * @param paymentOperation The payment operation to execute if key is new
     * @return PaymentResponse (either from existing transaction or new operation)
     */
    public PaymentResponse handleIdempotentPayment(String idempotencyKey, PaymentOperation paymentOperation) {
        // Validate idempotency key
        if (!isValidIdempotencyKey(idempotencyKey)) {
            return PaymentResponse.failure(
                "INVALID_IDEMPOTENCY_KEY",
                "Invalid idempotency key format",
                "Idempotency key must be 10-100 characters, alphanumeric with hyphens/underscores only"
            );
        }

        // Check if we've seen this key before
        Optional<PaymentTransaction> existingTransaction = findExistingTransaction(idempotencyKey);
        
        if (existingTransaction.isPresent()) {
            // Return the original result
            return createResponseFromExistingTransaction(existingTransaction.get());
        }

        // Execute the payment operation with the idempotency key
        return paymentOperation.execute(idempotencyKey);
    }

    /**
     * Functional interface for payment operations
     */
    @FunctionalInterface
    public interface PaymentOperation {
        PaymentResponse execute(String idempotencyKey);
    }
}
