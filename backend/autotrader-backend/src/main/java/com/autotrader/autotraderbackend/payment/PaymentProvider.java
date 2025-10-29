package com.autotrader.autotraderbackend.payment;

import com.autotrader.autotraderbackend.model.Dealer;

import java.math.BigDecimal;

/**
 * Generic Payment Provider Interface
 *
 * This is the core contract that all payment providers must implement.
 * It abstracts away the specifics of each payment gateway, allowing
 * the system to work with any payment provider through a unified API.
 *
 * Design Pattern: Strategy Pattern + Adapter Pattern
 *
 * Examples:
 * - ManualTransferProvider: For bank transfers
 * - ChamBankProvider: For Cham Bank gateway
 * - BemoBankProvider: For Bemo Bank gateway
 * - CryptoPaymentProvider: For cryptocurrency payments
 */
public interface PaymentProvider {

    /**
     * Get the unique identifier for this payment provider
     * Example: "manual_transfer", "cham_bank", "crypto"
     */
    String getProviderId();

    /**
     * Get the display name for this provider
     * Example: "Manual Bank Transfer", "Cham Bank Gateway"
     */
    String getProviderName();

    /**
     * Check if this provider is currently enabled and available
     */
    boolean isEnabled();

    /**
     * Create a new subscription for a dealer
     *
     * @param dealer The dealer subscribing
     * @param tier Subscription tier (basic, advanced, professional)
     * @param paymentMethodDetails Payment method specific details
     * @param idempotencyKey Unique key to prevent duplicate payments
     * @return Payment response with transaction details
     */
    PaymentResponse createSubscription(
        Dealer dealer,
        String tier,
        PaymentMethodDetails paymentMethodDetails,
        String idempotencyKey
    );

    /**
     * Process a one-time payment
     *
     * @param dealer The dealer making the payment
     * @param amount Payment amount
     * @param currency Payment currency
     * @param paymentMethodDetails Payment method specific details
     * @param description Payment description (e.g., "Featured listing payment")
     * @param idempotencyKey Unique key to prevent duplicate payments
     * @return Payment response with transaction details
     */
    PaymentResponse processOneTimePayment(
        Dealer dealer,
        BigDecimal amount,
        Currency currency,
        PaymentMethodDetails paymentMethodDetails,
        String description,
        String idempotencyKey
    );

    /**
     * Cancel an active subscription
     *
     * @param dealer The dealer whose subscription to cancel
     * @param subscriptionId External subscription ID from the provider
     * @return Payment response confirming cancellation
     */
    PaymentResponse cancelSubscription(Dealer dealer, String subscriptionId);

    /**
     * Update payment method for an existing subscription
     *
     * @param dealer The dealer
     * @param subscriptionId External subscription ID
     * @param newPaymentMethodDetails New payment method details
     * @return Payment response confirming the update
     */
    PaymentResponse updatePaymentMethod(
        Dealer dealer,
        String subscriptionId,
        PaymentMethodDetails newPaymentMethodDetails
    );

    /**
     * Verify a webhook signature to ensure it came from the payment provider
     *
     * @param payload Webhook payload
     * @param signature Webhook signature from headers
     * @return true if signature is valid
     */
    boolean verifyWebhook(String payload, String signature);

    /**
     * Handle a webhook notification from the payment provider
     * This is called when the provider sends payment status updates
     *
     * @param payload Webhook payload
     * @return Payment response with updated status
     */
    PaymentResponse handleWebhook(String payload);

    /**
     * Refund a completed payment
     *
     * @param transactionId Our internal transaction ID
     * @param amount Amount to refund (can be partial)
     * @param reason Refund reason
     * @return Payment response confirming refund
     */
    PaymentResponse refundPayment(String transactionId, BigDecimal amount, String reason);

    /**
     * Get the current status of a payment transaction
     *
     * @param transactionId Our internal transaction ID or external payment ID
     * @return Payment response with current status
     */
    PaymentResponse getPaymentStatus(String transactionId);

    /**
     * Check if this provider supports a specific payment method
     *
     * @param paymentMethodDetails Payment method to check
     * @return true if supported
     */
    boolean supportsPaymentMethod(PaymentMethodDetails paymentMethodDetails);

    /**
     * Get supported currencies by this provider
     *
     * @return Array of supported currencies
     */
    Currency[] getSupportedCurrencies();

    /**
     * Get supported payment methods by this provider
     *
     * @return Array of supported payment methods
     */
    PaymentMethod[] getSupportedPaymentMethods();

    /**
     * Validate payment amount and currency
     *
     * @param amount Payment amount
     * @param currency Payment currency
     * @return true if valid
     */
    boolean validatePaymentAmount(BigDecimal amount, Currency currency);
}

