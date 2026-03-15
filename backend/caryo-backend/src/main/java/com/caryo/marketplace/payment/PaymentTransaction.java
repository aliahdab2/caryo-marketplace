package com.caryo.marketplace.payment;

import com.caryo.marketplace.model.Dealer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Payment Transaction Entity - Complete audit trail for all payments
 * 
 * This entity tracks EVERY payment attempt, success, failure, and status change.
 * Critical for compliance, debugging, and financial reconciliation.
 */
@Entity
@Table(name = "payment_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique transaction ID (our internal reference)
     * Format: "TXN_YYYYMMDD_HHMMSS_XXXXX"
     */
    @Column(unique = true, nullable = false, length = 50)
    private String transactionId;

    /**
     * Idempotency key to prevent duplicate payments
     * Client should send this to ensure payment is processed only once
     */
    @Column(unique = true, length = 100)
    private String idempotencyKey;

    /**
     * External payment ID from the payment provider
     */
    @Column(length = 100)
    private String externalPaymentId;

    /**
     * The dealer making the payment
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id", nullable = false)
    private Dealer dealer;

    /**
     * Payment amount
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /**
     * Currency code (SYP, USD, etc.)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Currency currency;

    /**
     * Current payment status
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    /**
     * Payment method used
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    /**
     * Payment provider type
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentProviderType providerType;

    /**
     * Payment type (subscription, one_time, refund, etc.)
     */
    @Column(nullable = false, length = 30)
    private String paymentType;

    /**
     * Human-readable description
     */
    @Column(length = 500)
    private String description;

    /**
     * Subscription tier (if this is a subscription payment)
     */
    @Column(length = 30)
    private String subscriptionTier;

    /**
     * Error code (if payment failed)
     */
    @Column(length = 50)
    private String errorCode;

    /**
     * Error message (if payment failed)
     */
    @Column(length = 1000)
    private String errorMessage;

    /**
     * Payment receipt URL
     */
    @Column(length = 500)
    private String receiptUrl;

    /**
     * Additional metadata (JSON format)
     * Examples: {"cardLast4": "4242", "bankName": "Cham", "referenceNumber": "REF123"}
     */
    @ElementCollection
    @CollectionTable(name = "payment_transaction_metadata", joinColumns = @JoinColumn(name = "transaction_id"))
    @MapKeyColumn(name = "metadata_key")
    @Column(name = "metadata_value", length = 1000)
    @Builder.Default
    private Map<String, String> metadata = new HashMap<>();

    /**
     * When the payment was initiated
     */
    @CreationTimestamp
    @Column(nullable = false)
    private ZonedDateTime createdAt;

    /**
     * When the payment was last updated
     */
    @UpdateTimestamp
    @Column(nullable = false)
    private ZonedDateTime updatedAt;

    /**
     * When the payment was completed (if successful)
     */
    private ZonedDateTime completedAt;

    /**
     * When the payment failed (if failed)
     */
    private ZonedDateTime failedAt;

    /**
     * Number of retry attempts (for failed payments)
     */
    @Builder.Default
    @Column(nullable = false)
    private Integer retryAttempts = 0;

    /**
     * Next retry scheduled time (if applicable)
     */
    private ZonedDateTime nextRetryAt;

    // Helper methods

    /**
     * Mark payment as completed
     */
    public void markCompleted() {
        this.status = PaymentStatus.COMPLETED;
        this.completedAt = ZonedDateTime.now();
        this.updatedAt = ZonedDateTime.now();
    }

    /**
     * Mark payment as failed
     */
    public void markFailed(String errorCode, String errorMessage) {
        this.status = PaymentStatus.FAILED;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.failedAt = ZonedDateTime.now();
        this.updatedAt = ZonedDateTime.now();
    }

    /**
     * Update payment status
     */
    public void updateStatus(PaymentStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = ZonedDateTime.now();
    }

    /**
     * Add metadata entry
     */
    public void addMetadata(String key, String value) {
        if (this.metadata == null) {
            this.metadata = new HashMap<>();
        }
        this.metadata.put(key, value);
    }

    /**
     * Increment retry attempts
     */
    public void incrementRetryAttempts() {
        this.retryAttempts++;
        this.updatedAt = ZonedDateTime.now();
    }

    /**
     * Check if payment is in final state
     */
    public boolean isFinal() {
        return status != null && status.isFinal();
    }

    /**
     * Check if payment was successful
     */
    public boolean isSuccessful() {
        return status != null && status.isSuccessful();
    }
}
