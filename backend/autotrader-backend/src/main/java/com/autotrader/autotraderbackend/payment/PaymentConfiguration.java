package com.autotrader.autotraderbackend.payment;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Payment system configuration properties
 * 
 * Maps to application.properties with prefix "payment"
 */
@Configuration
@ConfigurationProperties(prefix = "payment")
@Data
public class PaymentConfiguration {

    /**
     * Global payment settings
     */
    private Global global = new Global();

    /**
     * Manual transfer provider settings
     */
    private ManualTransfer manualTransfer = new ManualTransfer();

    /**
     * Cham Bank provider settings
     */
    private ChamBank chamBank = new ChamBank();

    /**
     * Bemo Bank provider settings
     */
    private BemoBank bemoBank = new BemoBank();

    /**
     * Retry configuration
     */
    private Retry retry = new Retry();

    @Data
    public static class Global {
        /**
         * Default currency for payments
         */
        private String defaultCurrency = "SYP";

        /**
         * Maximum payment amount allowed
         */
        private BigDecimal maxPaymentAmount = new BigDecimal("1000000");

        /**
         * Minimum payment amount allowed
         */
        private BigDecimal minPaymentAmount = new BigDecimal("1");

        /**
         * Payment timeout in seconds
         */
        private Integer timeoutSeconds = 300;

        /**
         * Enable audit logging
         */
        private Boolean auditEnabled = true;

        /**
         * Enable idempotency checking
         */
        private Boolean idempotencyEnabled = true;
    }

    @Data
    public static class ManualTransfer {
        /**
         * Enable manual transfer provider
         */
        private Boolean enabled = true;

        /**
         * Bank account details for manual transfers
         */
        private BankAccount bankAccount = new BankAccount();

        /**
         * Payment verification timeout (hours)
         */
        private Integer verificationTimeoutHours = 72;

        /**
         * Auto-expire unverified payments after (hours)
         */
        private Integer autoExpireHours = 168; // 7 days

        @Data
        public static class BankAccount {
            private String bankName = "Cham Bank";
            private String accountNumber = "1234567890";
            private String accountName = "Caryo Marketplace";
            private String iban = "SY21CHAM000000001234567890";
            private String swiftCode = "CHAMSY22";
            private String branch = "Damascus Main Branch";
        }
    }

    @Data
    public static class ChamBank {
        /**
         * Enable Cham Bank provider
         */
        private Boolean enabled = false;

        /**
         * API endpoint
         */
        private String apiUrl = "https://api.chambank.sy/payments";

        /**
         * Merchant ID
         */
        private String merchantId = "${CHAM_BANK_MERCHANT_ID:}";

        /**
         * API key
         */
        private String apiKey = "${CHAM_BANK_API_KEY:}";

        /**
         * Webhook secret for signature verification
         */
        private String webhookSecret = "${CHAM_BANK_WEBHOOK_SECRET:}";

        /**
         * Connection timeout (seconds)
         */
        private Integer timeoutSeconds = 30;
    }

    @Data
    public static class BemoBank {
        /**
         * Enable Bemo Bank provider
         */
        private Boolean enabled = false;

        /**
         * API endpoint
         */
        private String apiUrl = "https://api.bemobank.sy/payments";

        /**
         * Merchant ID
         */
        private String merchantId = "${BEMO_BANK_MERCHANT_ID:}";

        /**
         * API key
         */
        private String apiKey = "${BEMO_BANK_API_KEY:}";

        /**
         * Webhook secret
         */
        private String webhookSecret = "${BEMO_BANK_WEBHOOK_SECRET:}";

        /**
         * Connection timeout (seconds)
         */
        private Integer timeoutSeconds = 30;
    }

    @Data
    public static class Retry {
        /**
         * Enable automatic retry for failed payments
         */
        private Boolean enabled = true;

        /**
         * Maximum retry attempts
         */
        private Integer maxAttempts = 3;

        /**
         * Retry delays in hours [1st retry, 2nd retry, 3rd retry]
         */
        private Integer[] delayHours = {24, 72, 168}; // 1 day, 3 days, 7 days

        /**
         * Exponential backoff multiplier
         */
        private Double backoffMultiplier = 2.0;
    }

    // Helper methods

    /**
     * Get enabled payment providers
     */
    public Map<String, Boolean> getEnabledProviders() {
        Map<String, Boolean> providers = new HashMap<>();
        providers.put("manual_transfer", manualTransfer.getEnabled());
        providers.put("cham_bank", chamBank.getEnabled());
        providers.put("bemo_bank", bemoBank.getEnabled());
        return providers;
    }

    /**
     * Check if any provider is enabled
     */
    public boolean hasEnabledProviders() {
        return getEnabledProviders().values().stream().anyMatch(Boolean::booleanValue);
    }

    /**
     * Get retry delay for attempt number (1-based)
     */
    public Integer getRetryDelayHours(int attemptNumber) {
        if (attemptNumber < 1 || attemptNumber > retry.getDelayHours().length) {
            return retry.getDelayHours()[retry.getDelayHours().length - 1]; // Return last delay
        }
        return retry.getDelayHours()[attemptNumber - 1];
    }
}
