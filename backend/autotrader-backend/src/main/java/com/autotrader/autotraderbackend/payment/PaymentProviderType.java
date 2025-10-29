package com.autotrader.autotraderbackend.payment;

/**
 * Payment provider types
 * Each type represents a different payment gateway or method
 */
public enum PaymentProviderType {
    /**
     * Manual bank transfer - no external provider
     */
    MANUAL_TRANSFER("Manual Transfer", false, true),

    /**
     * Cham Bank payment gateway
     */
    CHAM_BANK("Cham Bank Gateway", true, false),

    /**
     * Bemo Bank payment gateway
     */
    BEMO_BANK("Bemo Bank Gateway", true, false),

    /**
     * Syria International Islamic Bank
     */
    SIIB("SIIB Gateway", true, false),

    /**
     * Cryptocurrency payment processor
     */
    CRYPTO_PROCESSOR("Crypto Payment", true, false),

    /**
     * Mobile wallet provider
     */
    MOBILE_WALLET("Mobile Wallet", true, false);

    private final String displayName;
    private final boolean automated;
    private final boolean requiresManualVerification;

    PaymentProviderType(String displayName, boolean automated, boolean requiresManualVerification) {
        this.displayName = displayName;
        this.automated = automated;
        this.requiresManualVerification = requiresManualVerification;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Check if this provider is fully automated (no manual verification needed)
     */
    public boolean isAutomated() {
        return automated;
    }

    /**
     * Check if this provider requires manual verification by admin
     */
    public boolean requiresManualVerification() {
        return requiresManualVerification;
    }
}

