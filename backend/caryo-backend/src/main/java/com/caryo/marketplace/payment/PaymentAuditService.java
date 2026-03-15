package com.caryo.marketplace.payment;

import com.caryo.marketplace.model.Dealer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payment Audit Service
 * 
 * Provides comprehensive audit logging for all payment operations.
 * This service ensures compliance and security by tracking:
 * - All payment attempts and results
 * - Admin verification actions
 * - Security-relevant events
 * - Performance metrics
 */
@Service
@Slf4j
public class PaymentAuditService {

    /**
     * Log payment creation attempt
     */
    public void logPaymentCreated(String transactionId, Dealer dealer, BigDecimal amount, 
                                 String currency, String providerId, String userAgent, String clientIp) {
        log.info("PAYMENT_CREATED: transactionId={}, dealerId={}, dealerEmail={}, " +
                "amount={}, currency={}, provider={}, userAgent={}, clientIp={}, timestamp={}",
                transactionId, dealer.getId(), dealer.getUser().getEmail(),
                amount, currency, providerId, userAgent, clientIp, LocalDateTime.now());
    }

    /**
     * Log payment verification by admin
     */
    public void logPaymentVerified(String transactionId, String adminUsername, 
                                  String verificationMethod, String notes, String clientIp) {
        log.warn("PAYMENT_VERIFIED: transactionId={}, adminUser={}, method={}, " +
                "notes={}, clientIp={}, timestamp={}",
                transactionId, adminUsername, verificationMethod, notes, clientIp, LocalDateTime.now());
    }

    /**
     * Log payment rejection by admin
     */
    public void logPaymentRejected(String transactionId, String adminUsername, 
                                  String reason, String clientIp) {
        log.warn("PAYMENT_REJECTED: transactionId={}, adminUser={}, reason={}, " +
                "clientIp={}, timestamp={}",
                transactionId, adminUsername, reason, clientIp, LocalDateTime.now());
    }

    /**
     * Log suspicious payment activity
     */
    public void logSuspiciousActivity(String event, Dealer dealer, String details, String clientIp) {
        log.error("SUSPICIOUS_PAYMENT_ACTIVITY: event={}, dealerId={}, dealerEmail={}, " +
                 "details={}, clientIp={}, timestamp={}",
                 event, dealer.getId(), dealer.getUser().getEmail(), details, clientIp, LocalDateTime.now());
    }

    /**
     * Log payment provider errors
     */
    public void logProviderError(String providerId, String operation, String error, String transactionId) {
        log.error("PAYMENT_PROVIDER_ERROR: provider={}, operation={}, error={}, " +
                 "transactionId={}, timestamp={}",
                 providerId, operation, error, transactionId, LocalDateTime.now());
    }

    /**
     * Log rate limiting events
     */
    public void logRateLimitExceeded(String clientIp, String endpoint, String dealerEmail) {
        log.warn("RATE_LIMIT_EXCEEDED: clientIp={}, endpoint={}, dealerEmail={}, timestamp={}",
                clientIp, endpoint, dealerEmail, LocalDateTime.now());
    }

    /**
     * Log performance metrics
     */
    public void logPerformanceMetrics(String operation, long durationMs, String providerId, boolean success) {
        log.info("PAYMENT_PERFORMANCE: operation={}, duration={}ms, provider={}, success={}, timestamp={}",
                operation, durationMs, providerId, success, LocalDateTime.now());
    }

    /**
     * Log configuration changes
     */
    public void logConfigurationChange(String adminUsername, String configKey, 
                                     String oldValue, String newValue, String clientIp) {
        log.warn("PAYMENT_CONFIG_CHANGED: admin={}, key={}, oldValue={}, newValue={}, " +
                "clientIp={}, timestamp={}",
                adminUsername, configKey, oldValue, newValue, clientIp, LocalDateTime.now());
    }

    /**
     * Log webhook events
     */
    public void logWebhookReceived(String providerId, String eventType, String signature, 
                                  boolean verified, String clientIp) {
        log.info("WEBHOOK_RECEIVED: provider={}, eventType={}, signatureVerified={}, " +
                "clientIp={}, timestamp={}",
                providerId, eventType, verified, clientIp, LocalDateTime.now());
    }

    /**
     * Log idempotency key usage
     */
    public void logIdempotencyKeyUsed(String idempotencyKey, String transactionId, 
                                     String dealerEmail, boolean duplicate) {
        if (duplicate) {
            log.warn("IDEMPOTENCY_DUPLICATE: key={}, originalTransaction={}, dealerEmail={}, timestamp={}",
                    idempotencyKey, transactionId, dealerEmail, LocalDateTime.now());
        } else {
            log.debug("IDEMPOTENCY_NEW: key={}, transactionId={}, dealerEmail={}, timestamp={}",
                     idempotencyKey, transactionId, dealerEmail, LocalDateTime.now());
        }
    }
}
