package com.autotrader.autotraderbackend.payment;

import com.autotrader.autotraderbackend.model.Dealer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Payment Service Orchestrator
 * 
 * This is the main service that coordinates all payment providers.
 * It implements the Facade pattern to provide a simple interface
 * for payment operations while managing multiple providers behind the scenes.
 */
@Service
@Transactional
@Slf4j
public class PaymentService {

    private final Map<String, PaymentProvider> paymentProviders;
    private final PaymentTransactionRepository transactionRepository;
    private final IdempotencyService idempotencyService;
    private final PaymentAuditService auditService;

    @Autowired
    public PaymentService(
            List<PaymentProvider> providers,
            PaymentTransactionRepository transactionRepository,
            IdempotencyService idempotencyService,
            PaymentConfiguration paymentConfig,
            PaymentAuditService auditService) {

        // Create a map of provider ID -> provider instance
        this.paymentProviders = providers.stream()
            .collect(Collectors.toMap(PaymentProvider::getProviderId, p -> p));

        this.transactionRepository = transactionRepository;
        this.idempotencyService = idempotencyService;
        this.auditService = auditService;
    }

    /**
     * Create a subscription payment
     * 
     * @param dealer The dealer subscribing
     * @param tier Subscription tier (basic, advanced, professional)
     * @param providerId Payment provider ID (manual_transfer, cham_bank, etc.)
     * @param paymentMethodDetails Payment method details
     * @param idempotencyKey Unique key to prevent duplicates
     * @return Payment response
     */
    public PaymentResponse createSubscription(
            Dealer dealer,
            String tier,
            String providerId,
            PaymentMethodDetails paymentMethodDetails,
            String idempotencyKey) {

        try {
            // Get the payment provider
            PaymentProvider provider = getProvider(providerId);

            // Validate provider supports the payment method
            if (!provider.supportsPaymentMethod(paymentMethodDetails)) {
                return PaymentResponse.failure(
                    "UNSUPPORTED_PAYMENT_METHOD",
                    "Payment method not supported by provider",
                    String.format("Provider %s does not support %s", 
                        providerId, paymentMethodDetails.getPaymentMethod())
                );
            }

            // Create the subscription
            return provider.createSubscription(dealer, tier, paymentMethodDetails, idempotencyKey);

        } catch (Exception e) {
            return PaymentResponse.failure(
                "SUBSCRIPTION_CREATION_ERROR",
                "Failed to create subscription: " + e.getMessage(),
                e.toString()
            );
        }
    }

    /**
     * Process a one-time payment
     * 
     * @param dealer The dealer making the payment
     * @param amount Payment amount
     * @param currency Payment currency
     * @param providerId Payment provider ID
     * @param paymentMethodDetails Payment method details
     * @param description Payment description
     * @param idempotencyKey Unique key to prevent duplicates
     * @return Payment response
     */
    public PaymentResponse processOneTimePayment(
            Dealer dealer,
            BigDecimal amount,
            Currency currency,
            String providerId,
            PaymentMethodDetails paymentMethodDetails,
            String description,
            String idempotencyKey) {

        try {
            // Get the payment provider
            PaymentProvider provider = getProvider(providerId);

            // Validate amount and currency
            if (!provider.validatePaymentAmount(amount, currency)) {
                return PaymentResponse.failure(
                    "INVALID_AMOUNT",
                    "Invalid payment amount or currency",
                    String.format("Amount: %s %s", amount, currency)
                );
            }

            // Process the payment
            return provider.processOneTimePayment(
                dealer, amount, currency, paymentMethodDetails, description, idempotencyKey
            );

        } catch (Exception e) {
            return PaymentResponse.failure(
                "PAYMENT_PROCESSING_ERROR",
                "Failed to process payment: " + e.getMessage(),
                e.toString()
            );
        }
    }

    /**
     * Cancel a subscription
     * 
     * @param dealer The dealer
     * @param subscriptionId Subscription ID
     * @param providerId Payment provider ID
     * @return Payment response
     */
    public PaymentResponse cancelSubscription(Dealer dealer, String subscriptionId, String providerId) {
        try {
            PaymentProvider provider = getProvider(providerId);
            return provider.cancelSubscription(dealer, subscriptionId);
        } catch (Exception e) {
            return PaymentResponse.failure(
                "CANCELLATION_ERROR",
                "Failed to cancel subscription: " + e.getMessage(),
                e.toString()
            );
        }
    }

    /**
     * Get payment status
     * 
     * @param transactionId Transaction ID
     * @return Payment response with current status
     */
    public PaymentResponse getPaymentStatus(String transactionId) {
        try {
            // Find transaction in database
            Optional<PaymentTransaction> transactionOpt = transactionRepository.findByTransactionId(transactionId);
            
            if (transactionOpt.isEmpty()) {
                return PaymentResponse.failure(
                    "TRANSACTION_NOT_FOUND",
                    "Transaction not found",
                    "Transaction ID: " + transactionId
                );
            }

            PaymentTransaction transaction = transactionOpt.get();
            
            // Get provider and check status
            PaymentProvider provider = getProvider(transaction.getProviderType().name().toLowerCase());
            return provider.getPaymentStatus(transactionId);

        } catch (Exception e) {
            return PaymentResponse.failure(
                "STATUS_CHECK_ERROR",
                "Failed to check payment status: " + e.getMessage(),
                e.toString()
            );
        }
    }

    /**
     * Handle webhook from payment provider
     * 
     * @param providerId Payment provider ID
     * @param payload Webhook payload
     * @param signature Webhook signature
     * @return Payment response
     */
    public PaymentResponse handleWebhook(String providerId, String payload, String signature) {
        try {
            PaymentProvider provider = getProvider(providerId);

            // Verify webhook signature
            if (!provider.verifyWebhook(payload, signature)) {
                auditService.logWebhookReceived(providerId, "unknown", signature, false, "N/A");
                return PaymentResponse.failure(
                    "INVALID_WEBHOOK_SIGNATURE",
                    "Webhook signature verification failed",
                    "Provider: " + providerId
                );
            }

            auditService.logWebhookReceived(providerId, "webhook_event", signature, true, "N/A");

            // Handle the webhook
            return provider.handleWebhook(payload);

        } catch (Exception e) {
            auditService.logProviderError(providerId, "webhook", e.getMessage(), "N/A");
            return PaymentResponse.failure(
                "WEBHOOK_PROCESSING_ERROR",
                "Failed to process webhook: " + e.getMessage(),
                e.toString()
            );
        }
    }

    /**
     * Verify a payment manually (for manual transfer provider)
     * 
     * @param transactionId Transaction ID
     * @param adminUserId Admin user who verified the payment
     * @return Payment response
     */
    @Transactional
    public PaymentResponse verifyPaymentManually(String transactionId, Long adminUserId) {
        try {
            // Find the transaction
            PaymentTransaction transaction = transactionRepository
                .findByTransactionId(transactionId)
                .orElseThrow(() -> new PaymentException("Transaction not found: " + transactionId));

            // Verify it's a manual transfer and pending verification
            if (transaction.getProviderType() != PaymentProviderType.MANUAL_TRANSFER) {
                return PaymentResponse.failure(
                    "INVALID_VERIFICATION",
                    "Only manual transfers can be verified manually",
                    "Transaction type: " + transaction.getProviderType()
                );
            }

            if (transaction.getStatus() != PaymentStatus.PENDING_VERIFICATION) {
                return PaymentResponse.failure(
                    "INVALID_STATUS",
                    "Transaction is not pending verification",
                    "Current status: " + transaction.getStatus()
                );
            }

            // Mark as completed
            transaction.markCompleted();
            transaction.addMetadata("verifiedBy", adminUserId.toString());
            transaction.addMetadata("verifiedAt", java.time.ZonedDateTime.now().toString());

            transactionRepository.save(transaction);

            auditService.logPaymentVerified(transactionId, adminUserId.toString(), "manual", null, "N/A");

            return PaymentResponse.success(
                transactionId,
                transaction.getAmount(),
                transaction.getCurrency().name(),
                "Payment verified and completed successfully"
            );

        } catch (Exception e) {
            return PaymentResponse.failure(
                "VERIFICATION_ERROR",
                "Failed to verify payment: " + e.getMessage(),
                e.toString()
            );
        }
    }

    /**
     * Reject a manual transfer payment
     *
     * @param transactionId The transaction ID to reject
     * @param adminUserId ID of the admin performing the rejection
     * @param reason Reason for rejection
     * @return PaymentResponse with result
     */
    public PaymentResponse rejectPaymentManually(String transactionId, Long adminUserId, String reason) {
        try {
            PaymentTransaction transaction = transactionRepository
                .findByTransactionId(transactionId)
                .orElseThrow(() -> new PaymentException("Transaction not found: " + transactionId));

            if (transaction.getProviderType() != PaymentProviderType.MANUAL_TRANSFER) {
                return PaymentResponse.failure(
                    "INVALID_REJECTION",
                    "Only manual transfers can be rejected manually",
                    "Transaction type: " + transaction.getProviderType()
                );
            }

            if (transaction.getStatus() != PaymentStatus.PENDING_VERIFICATION) {
                return PaymentResponse.failure(
                    "INVALID_STATUS",
                    "Transaction is not pending verification",
                    "Current status: " + transaction.getStatus()
                );
            }

            transaction.updateStatus(PaymentStatus.CANCELLED);
            transaction.addMetadata("rejectionReason", reason);
            transaction.addMetadata("rejectedBy", adminUserId.toString());
            transaction.addMetadata("rejectedAt", java.time.ZonedDateTime.now().toString());

            transactionRepository.save(transaction);

            auditService.logPaymentRejected(transactionId, adminUserId.toString(), reason, "N/A");

            PaymentResponse response = PaymentResponse.builder()
                .success(true)
                .status(PaymentStatus.CANCELLED)
                .transactionId(transactionId)
                .amount(transaction.getAmount())
                .currency(transaction.getCurrency().name())
                .message("Payment rejected: " + reason)
                .timestamp(java.time.ZonedDateTime.now())
                .build();
            response.addMetadata("rejectionReason", reason);
            return response;

        } catch (PaymentException e) {
            throw e;
        } catch (Exception e) {
            return PaymentResponse.failure(
                "REJECTION_ERROR",
                "Failed to reject payment: " + e.getMessage(),
                e.toString()
            );
        }
    }

    /**
     * Search payment transactions by criteria
     *
     * @param transactionId Optional transaction ID for exact match
     * @param status Optional payment status filter
     * @param dealerEmail Optional dealer email filter
     * @param startDate Optional start date for date range
     * @param endDate Optional end date for date range
     * @return List of matching transactions
     */
    @Transactional(readOnly = true)
    public List<PaymentTransaction> searchPayments(String transactionId, String status,
            String dealerEmail, java.time.ZonedDateTime startDate, java.time.ZonedDateTime endDate) {

        // If transactionId is provided, return exact match
        if (transactionId != null && !transactionId.isBlank()) {
            return transactionRepository.findByTransactionId(transactionId)
                .map(List::of)
                .orElse(List.of());
        }

        // Normalize date range: if only startDate given, default endDate to now
        java.time.ZonedDateTime effectiveStart = startDate;
        java.time.ZonedDateTime effectiveEnd = endDate;
        if (effectiveStart != null && effectiveEnd == null) {
            effectiveEnd = java.time.ZonedDateTime.now();
        }

        // Determine primary filter
        List<PaymentTransaction> results;
        boolean usedDateRange = false;

        if (status != null && !status.isBlank()) {
            PaymentStatus paymentStatus = PaymentStatus.valueOf(status.toUpperCase());
            results = transactionRepository.findByStatus(paymentStatus);
        } else if (effectiveStart != null && effectiveEnd != null) {
            results = transactionRepository.findByDateRange(effectiveStart, effectiveEnd);
            usedDateRange = true;
        } else {
            results = transactionRepository.findAll();
        }

        // Apply remaining filters in-memory
        if (dealerEmail != null && !dealerEmail.isBlank()) {
            results = results.stream()
                .filter(t -> t.getDealer() != null
                    && t.getDealer().getUser() != null
                    && dealerEmail.equalsIgnoreCase(t.getDealer().getUser().getEmail()))
                .toList();
        }

        // If date range wasn't the primary filter but was provided, apply it in-memory
        if (!usedDateRange && effectiveStart != null && effectiveEnd != null) {
            final java.time.ZonedDateTime filterStart = effectiveStart;
            final java.time.ZonedDateTime filterEnd = effectiveEnd;
            results = results.stream()
                .filter(t -> t.getCreatedAt() != null
                    && !t.getCreatedAt().isBefore(filterStart)
                    && !t.getCreatedAt().isAfter(filterEnd))
                .toList();
        }

        return results;
    }

    /**
     * Get all available payment providers
     *
     * @return Map of provider ID -> provider name
     */
    public Map<String, String> getAvailableProviders() {
        return paymentProviders.values().stream()
            .filter(PaymentProvider::isEnabled)
            .collect(Collectors.toMap(
                PaymentProvider::getProviderId,
                PaymentProvider::getProviderName
            ));
    }

    /**
     * Get supported payment methods for a provider
     * 
     * @param providerId Provider ID
     * @return Array of supported payment methods
     */
    public PaymentMethod[] getSupportedPaymentMethods(String providerId) {
        PaymentProvider provider = getProvider(providerId);
        return provider.getSupportedPaymentMethods();
    }

    /**
     * Get supported currencies for a provider
     * 
     * @param providerId Provider ID
     * @return Array of supported currencies
     */
    public Currency[] getSupportedCurrencies(String providerId) {
        PaymentProvider provider = getProvider(providerId);
        return provider.getSupportedCurrencies();
    }

    /**
     * Get payment history for a dealer
     * 
     * @param dealer The dealer
     * @return List of payment transactions
     */
    public List<PaymentTransaction> getPaymentHistory(Dealer dealer) {
        return transactionRepository.findByDealerAndStatus(dealer, PaymentStatus.COMPLETED);
    }

    /**
     * Get pending payments that need admin verification
     * 
     * @return List of transactions pending verification
     */
    public List<PaymentTransaction> getPendingVerifications() {
        return transactionRepository.findByStatusAndProviderType(
            PaymentStatus.PENDING_VERIFICATION,
            PaymentProviderType.MANUAL_TRANSFER
        );
    }

    /**
     * Generate a new idempotency key
     * 
     * @return New idempotency key
     */
    public String generateIdempotencyKey() {
        return idempotencyService.generateIdempotencyKey();
    }

    // Helper methods

    private PaymentProvider getProvider(String providerId) {
        PaymentProvider provider = paymentProviders.get(providerId);
        if (provider == null) {
            throw new PaymentException("Payment provider not found: " + providerId);
        }
        if (!provider.isEnabled()) {
            throw new PaymentException("Payment provider is disabled: " + providerId);
        }
        return provider;
    }
}
