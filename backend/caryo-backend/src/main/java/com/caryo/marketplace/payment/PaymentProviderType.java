package com.caryo.marketplace.payment;

/**
 * Payment Provider Types
 * 
 * Enum defining all supported payment providers in the system.
 * Used for tracking and routing payments to the correct provider.
 */
public enum PaymentProviderType {
    
    /**
     * Manual bank transfer - Default provider
     * Handles bank transfers that require manual verification
     */
    MANUAL_TRANSFER("Manual Bank Transfer", "manual_transfer"),
    
    /**
     * PayPal payments and subscriptions
     */
    PAYPAL("PayPal", "paypal"),
    
    
    /**
     * Cham Bank integration (future)
     */
    CHAM_BANK("Cham Bank", "cham_bank"),
    
    /**
     * Bemo Bank integration (future)
     */
    BEMO_BANK("Bemo Bank", "bemo_bank");

    private final String displayName;
    private final String providerId;

    PaymentProviderType(String displayName, String providerId) {
        this.displayName = displayName;
        this.providerId = providerId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getProviderId() {
        return providerId;
    }

    /**
     * Get provider type by provider ID
     */
    public static PaymentProviderType fromProviderId(String providerId) {
        for (PaymentProviderType type : values()) {
            if (type.providerId.equals(providerId)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown provider ID: " + providerId);
    }

    /**
     * Check if provider supports recurring subscriptions
     */
    public boolean supportsSubscriptions() {
        return switch (this) {
            case PAYPAL -> true;
            case MANUAL_TRANSFER, CHAM_BANK, BEMO_BANK -> false;
        };
    }

    /**
     * Check if provider supports automated processing
     */
    public boolean isAutomated() {
        return switch (this) {
            case PAYPAL -> true;
            case MANUAL_TRANSFER, CHAM_BANK, BEMO_BANK -> false;
        };
    }

    /**
     * Get processing fee percentage (0-100)
     */
    public double getProcessingFeePercentage() {
        return switch (this) {
            case MANUAL_TRANSFER -> 0.0; // No fees
            case CHAM_BANK, BEMO_BANK -> 0.5; // Local bank fees
            case PAYPAL -> 2.9; // PayPal standard rate
        };
    }
}