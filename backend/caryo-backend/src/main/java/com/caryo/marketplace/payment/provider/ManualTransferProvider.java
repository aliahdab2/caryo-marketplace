package com.caryo.marketplace.payment.provider;

import com.caryo.marketplace.model.Dealer;
import com.caryo.marketplace.payment.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;

/**
 * Manual Transfer Payment Provider
 * 
 * Handles bank transfer payments where dealers manually transfer money
 * to our bank account and admin verifies the payment.
 * 
 * This is the foundation provider that works with ALL Syrian banks
 * and generates immediate revenue with 0% processing fees.
 */
@Service("manualTransferProvider")
@Transactional
public class ManualTransferProvider implements PaymentProvider {

    private final PaymentConfiguration paymentConfig;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentTransactionIdGenerator idGenerator;
    private final IdempotencyService idempotencyService;

    @Autowired
    public ManualTransferProvider(
            PaymentConfiguration paymentConfig,
            PaymentTransactionRepository transactionRepository,
            PaymentTransactionIdGenerator idGenerator,
            IdempotencyService idempotencyService) {
        this.paymentConfig = paymentConfig;
        this.transactionRepository = transactionRepository;
        this.idGenerator = idGenerator;
        this.idempotencyService = idempotencyService;
    }

    @Override
    public String getProviderId() {
        return "manual_transfer";
    }

    @Override
    public String getProviderName() {
        return "Manual Bank Transfer";
    }

    @Override
    public boolean isEnabled() {
        return paymentConfig.getManualTransfer().getEnabled();
    }

    @Override
    public PaymentResponse createSubscription(
            Dealer dealer,
            String tier,
            PaymentMethodDetails paymentMethodDetails,
            String idempotencyKey) {

        return idempotencyService.handleIdempotentPayment(idempotencyKey, (key) -> {
            try {
                // Validate inputs
                validateSubscriptionRequest(dealer, tier, paymentMethodDetails);

                // Get subscription price
                BigDecimal amount = getSubscriptionPrice(tier);

                // Generate transaction ID and reference number
                String transactionId = idGenerator.generateTransactionId();
                String referenceNumber = idGenerator.generateReferenceNumber();

                // Create payment transaction record
                PaymentTransaction transaction = createPaymentTransaction(
                    transactionId, key, dealer, amount, tier, referenceNumber, "subscription"
                );

                // Save transaction
                transactionRepository.save(transaction);

                // Create response with bank details
                return createPendingResponse(transaction, referenceNumber);

            } catch (Exception e) {
                return PaymentResponse.failure(
                    "SUBSCRIPTION_CREATION_FAILED",
                    "Failed to create subscription: " + e.getMessage(),
                    e.toString()
                );
            }
        });
    }

    @Override
    public PaymentResponse processOneTimePayment(
            Dealer dealer,
            BigDecimal amount,
            Currency currency,
            PaymentMethodDetails paymentMethodDetails,
            String description,
            String idempotencyKey) {

        return idempotencyService.handleIdempotentPayment(idempotencyKey, (key) -> {
            try {
                // Validate inputs
                validateOneTimePaymentRequest(dealer, amount, currency, paymentMethodDetails);

                // Generate transaction ID and reference number
                String transactionId = idGenerator.generateTransactionId();
                String referenceNumber = idGenerator.generateReferenceNumber();

                // Create payment transaction record
                PaymentTransaction transaction = createPaymentTransaction(
                    transactionId, key, dealer, amount, description, referenceNumber, "one_time"
                );

                // Save transaction
                transactionRepository.save(transaction);

                // Create response with bank details
                return createPendingResponse(transaction, referenceNumber);

            } catch (Exception e) {
                return PaymentResponse.failure(
                    "PAYMENT_PROCESSING_FAILED",
                    "Failed to process payment: " + e.getMessage(),
                    e.toString()
                );
            }
        });
    }

    @Override
    public PaymentResponse cancelSubscription(Dealer dealer, String subscriptionId) {
        // For manual transfers, we just mark as cancelled
        // No external API to call
        return PaymentResponse.success(
            subscriptionId,
            BigDecimal.ZERO,
            "SYP",
            "Subscription cancelled successfully"
        );
    }

    @Override
    public PaymentResponse updatePaymentMethod(
            Dealer dealer,
            String subscriptionId,
            PaymentMethodDetails newPaymentMethodDetails) {
        
        // For manual transfers, payment method doesn't change
        // (always bank transfer to our account)
        return PaymentResponse.success(
            subscriptionId,
            BigDecimal.ZERO,
            "SYP",
            "Payment method updated (no changes required for bank transfers)"
        );
    }

    @Override
    public boolean verifyWebhook(String payload, String signature) {
        // Manual transfers don't have webhooks
        // Verification is done manually by admin
        return false;
    }

    @Override
    public PaymentResponse handleWebhook(String payload) {
        // Manual transfers don't have webhooks
        throw new UnsupportedOperationException("Manual transfers don't support webhooks");
    }

    @Override
    public PaymentResponse refundPayment(String transactionId, BigDecimal amount, String reason) {
        // Find the original transaction
        PaymentTransaction originalTransaction = transactionRepository
            .findByTransactionId(transactionId)
            .orElseThrow(() -> new PaymentException("Transaction not found: " + transactionId));

        // Create refund transaction
        String refundTransactionId = idGenerator.generateTransactionId();
        PaymentTransaction refundTransaction = PaymentTransaction.builder()
            .transactionId(refundTransactionId)
            .dealer(originalTransaction.getDealer())
            .amount(amount)
            .currency(originalTransaction.getCurrency())
            .status(PaymentStatus.PENDING_VERIFICATION)
            .paymentMethod(PaymentMethod.BANK_TRANSFER)
            .providerType(PaymentProviderType.MANUAL_TRANSFER)
            .paymentType("refund")
            .description("Refund for transaction " + transactionId + ": " + reason)
            .build();

        refundTransaction.addMetadata("originalTransactionId", transactionId);
        refundTransaction.addMetadata("refundReason", reason);

        transactionRepository.save(refundTransaction);

        return PaymentResponse.pending(
            refundTransactionId,
            amount,
            originalTransaction.getCurrency().name(),
            "Refund initiated. Manual bank transfer will be processed within 3-5 business days."
        );
    }

    @Override
    public PaymentResponse getPaymentStatus(String transactionId) {
        PaymentTransaction transaction = transactionRepository
            .findByTransactionId(transactionId)
            .orElseThrow(() -> new PaymentException("Transaction not found: " + transactionId));

        return idempotencyService.createResponseFromExistingTransaction(transaction);
    }

    @Override
    public boolean supportsPaymentMethod(PaymentMethodDetails paymentMethodDetails) {
        return paymentMethodDetails.getPaymentMethod() == PaymentMethod.BANK_TRANSFER;
    }

    @Override
    public Currency[] getSupportedCurrencies() {
        return new Currency[]{Currency.SYP, Currency.USD};
    }

    @Override
    public PaymentMethod[] getSupportedPaymentMethods() {
        return new PaymentMethod[]{PaymentMethod.BANK_TRANSFER};
    }

    @Override
    public boolean validatePaymentAmount(BigDecimal amount, Currency currency) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        BigDecimal maxAmount = paymentConfig.getGlobal().getMaxPaymentAmount();
        BigDecimal minAmount = paymentConfig.getGlobal().getMinPaymentAmount();

        return amount.compareTo(minAmount) >= 0 && amount.compareTo(maxAmount) <= 0;
    }

    // Helper methods

    private void validateSubscriptionRequest(Dealer dealer, String tier, PaymentMethodDetails paymentMethodDetails) {
        if (dealer == null) {
            throw new PaymentException("Dealer is required");
        }
        if (tier == null || tier.trim().isEmpty()) {
            throw new PaymentException("Subscription tier is required");
        }
        if (!supportsPaymentMethod(paymentMethodDetails)) {
            throw new InvalidPaymentMethodException(
                paymentMethodDetails.getPaymentMethod(),
                "Manual transfer provider only supports bank transfers",
                getProviderId()
            );
        }
    }

    private void validateOneTimePaymentRequest(
            Dealer dealer, BigDecimal amount, Currency currency, PaymentMethodDetails paymentMethodDetails) {
        
        if (dealer == null) {
            throw new PaymentException("Dealer is required");
        }
        if (!validatePaymentAmount(amount, currency)) {
            throw new PaymentException("Invalid payment amount: " + amount);
        }
        if (!Arrays.asList(getSupportedCurrencies()).contains(currency)) {
            throw new PaymentException("Unsupported currency: " + currency);
        }
        if (!supportsPaymentMethod(paymentMethodDetails)) {
            throw new InvalidPaymentMethodException(
                paymentMethodDetails.getPaymentMethod(),
                "Manual transfer provider only supports bank transfers",
                getProviderId()
            );
        }
    }

    private BigDecimal getSubscriptionPrice(String tier) {
        return switch (tier.toLowerCase()) {
            case "basic" -> new BigDecimal("50");
            case "advanced" -> new BigDecimal("100");
            case "professional" -> new BigDecimal("200");
            default -> throw new PaymentException("Invalid subscription tier: " + tier);
        };
    }

    private PaymentTransaction createPaymentTransaction(
            String transactionId, String idempotencyKey, Dealer dealer,
            BigDecimal amount, String description, String referenceNumber, String paymentType) {
        
        PaymentTransaction transaction = PaymentTransaction.builder()
            .transactionId(transactionId)
            .idempotencyKey(idempotencyKey)
            .dealer(dealer)
            .amount(amount)
            .currency(Currency.SYP) // Default to SYP for manual transfers
            .status(PaymentStatus.PENDING_VERIFICATION)
            .paymentMethod(PaymentMethod.BANK_TRANSFER)
            .providerType(PaymentProviderType.MANUAL_TRANSFER)
            .paymentType(paymentType)
            .description(description)
            .build();

        // Add bank transfer metadata
        transaction.addMetadata("referenceNumber", referenceNumber);
        transaction.addMetadata("bankName", paymentConfig.getManualTransfer().getBankAccount().getBankName());
        transaction.addMetadata("accountNumber", paymentConfig.getManualTransfer().getBankAccount().getAccountNumber());
        transaction.addMetadata("accountName", paymentConfig.getManualTransfer().getBankAccount().getAccountName());
        transaction.addMetadata("iban", paymentConfig.getManualTransfer().getBankAccount().getIban());

        return transaction;
    }

    private PaymentResponse createPendingResponse(PaymentTransaction transaction, String referenceNumber) {
        PaymentConfiguration.ManualTransfer.BankAccount bankAccount = 
            paymentConfig.getManualTransfer().getBankAccount();

        PaymentResponse response = PaymentResponse.pending(
            transaction.getTransactionId(),
            transaction.getAmount(),
            transaction.getCurrency().name(),
            "Please transfer the exact amount to our bank account with the reference number"
        );

        // Add bank details to response metadata
        response.addMetadata("referenceNumber", referenceNumber);
        response.addMetadata("bankName", bankAccount.getBankName());
        response.addMetadata("accountNumber", bankAccount.getAccountNumber());
        response.addMetadata("accountName", bankAccount.getAccountName());
        response.addMetadata("iban", bankAccount.getIban());
        response.addMetadata("swiftCode", bankAccount.getSwiftCode());
        response.addMetadata("branch", bankAccount.getBranch());
        response.addMetadata("amount", transaction.getAmount().toString());
        response.addMetadata("currency", transaction.getCurrency().name());
        
        // Add instructions
        response.addMetadata("instructions", 
            String.format("Transfer exactly %s %s to account %s with reference: %s",
                transaction.getAmount(),
                transaction.getCurrency().name(),
                bankAccount.getAccountNumber(),
                referenceNumber
            )
        );

        return response;
    }
}
