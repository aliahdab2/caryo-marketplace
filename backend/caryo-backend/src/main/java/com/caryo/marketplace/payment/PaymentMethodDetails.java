package com.caryo.marketplace.payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * Value object containing payment method specific details
 * This is a flexible container for different payment methods
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodDetails {

    /**
     * Payment method type
     */
    private PaymentMethod paymentMethod;

    /**
     * Flexible map for method-specific data
     * Examples:
     * - Bank transfer: {"accountNumber": "123", "bankName": "Cham", "referenceNumber": "REF123"}
     * - Card: {"cardToken": "tok_xxx", "last4": "4242", "cardBrand": "Visa"}
     * - Crypto: {"walletAddress": "0x...", "network": "BTC", "txHash": "..."}
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

    /**
     * Get metadata value
     */
    public Object getMetadata(String key) {
        return metadata != null ? metadata.get(key) : null;
    }

    /**
     * Get metadata value as String
     */
    public String getMetadataAsString(String key) {
        Object value = getMetadata(key);
        return value != null ? value.toString() : null;
    }

    /**
     * Check if metadata contains key
     */
    public boolean hasMetadata(String key) {
        return metadata != null && metadata.containsKey(key);
    }

    // Convenience methods for common payment methods

    /**
     * Create payment details for bank transfer
     */
    public static PaymentMethodDetails forBankTransfer(String accountNumber, String bankName, String referenceNumber) {
        PaymentMethodDetails details = new PaymentMethodDetails();
        details.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        details.addMetadata("accountNumber", accountNumber);
        details.addMetadata("bankName", bankName);
        details.addMetadata("referenceNumber", referenceNumber);
        return details;
    }

    /**
     * Create payment details for card payment
     */
    public static PaymentMethodDetails forCard(String cardToken, String last4, String cardBrand) {
        PaymentMethodDetails details = new PaymentMethodDetails();
        details.setPaymentMethod(PaymentMethod.CARD);
        details.addMetadata("cardToken", cardToken);
        details.addMetadata("last4", last4);
        details.addMetadata("cardBrand", cardBrand);
        return details;
    }

    /**
     * Create payment details for crypto payment
     */
    public static PaymentMethodDetails forCrypto(String walletAddress, String network, String txHash) {
        PaymentMethodDetails details = new PaymentMethodDetails();
        details.setPaymentMethod(PaymentMethod.CRYPTO);
        details.addMetadata("walletAddress", walletAddress);
        details.addMetadata("network", network);
        if (txHash != null) {
            details.addMetadata("txHash", txHash);
        }
        return details;
    }
}

