package com.autotrader.autotraderbackend.payment;

import com.autotrader.autotraderbackend.model.Dealer;
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
public class PaymentService {

    private final Map<String, PaymentProvider> paymentProviders;
    private final PaymentTransactionRepository transactionRepository;
    private final IdempotencyService idempotencyService;

    @Autowired
    public PaymentService(
            List<PaymentProvider> providers,
            PaymentTransactionRepository transactionRepository,
            IdempotencyService idempotencyService,
            PaymentConfiguration paymentConfig) {
        
        // Create a map of provider ID -> provider instance
        this.paymentProviders = providers.stream()
            .collect(Collectors.toMap(PaymentProvider::getProviderId, p -> p));
        
        this.transactionRepository = transactionRepository;
        this.idempotencyService = idempotencyService;
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
                return PaymentResponse.failure(
                    "INVALID_WEBHOOK_SIGNATURE",
                    "Webhook signature verification failed",
                    "Provider: " + providerId
                );
            }

            // Handle the webhook
            return provider.handleWebhook(payload);

        } catch (Exception e) {
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
