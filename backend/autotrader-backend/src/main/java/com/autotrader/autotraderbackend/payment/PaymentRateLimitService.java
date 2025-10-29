package com.autotrader.autotraderbackend.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Payment Rate Limiting Service
 * 
 * Implements rate limiting for payment operations to prevent abuse:
 * - Payment creation: 5 attempts per minute per dealer
 * - Admin verification: 20 attempts per minute per admin
 * - Webhook processing: 100 requests per minute per provider
 */
@Service
@Slf4j
public class PaymentRateLimitService {
    
    private final ConcurrentHashMap<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();
    
    // Rate limit configurations
    private static final int PAYMENT_CREATION_LIMIT = 5;
    private static final int ADMIN_VERIFICATION_LIMIT = 20;
    private static final int WEBHOOK_PROCESSING_LIMIT = 100;
    private static final int WINDOW_MINUTES = 1;
    
    /**
     * Check if payment creation is allowed for dealer
     */
    public boolean isPaymentCreationAllowed(Long dealerId) {
        String key = "payment_creation_" + dealerId;
        return checkRateLimit(key, PAYMENT_CREATION_LIMIT);
    }
    
    /**
     * Check if admin verification is allowed
     */
    public boolean isAdminVerificationAllowed(String adminUsername) {
        String key = "admin_verification_" + adminUsername;
        return checkRateLimit(key, ADMIN_VERIFICATION_LIMIT);
    }
    
    /**
     * Check if webhook processing is allowed for provider
     */
    public boolean isWebhookProcessingAllowed(String providerId, String clientIp) {
        String key = "webhook_" + providerId + "_" + clientIp;
        return checkRateLimit(key, WEBHOOK_PROCESSING_LIMIT);
    }
    
    /**
     * Check if general payment operation is allowed (fallback)
     */
    public boolean isPaymentOperationAllowed(String clientIp) {
        String key = "payment_general_" + clientIp;
        return checkRateLimit(key, 10); // 10 requests per minute per IP
    }
    
    /**
     * Reset rate limit for specific key (admin override)
     */
    public void resetRateLimit(String key) {
        buckets.remove(key);
        log.info("Rate limit reset for key: {}", key);
    }
    
    /**
     * Get current usage for monitoring
     */
    public int getCurrentUsage(String key) {
        RateLimitBucket bucket = buckets.get(key);
        if (bucket == null || isExpired(bucket)) {
            return 0;
        }
        return bucket.getCount().get();
    }
    
    /**
     * Core rate limiting logic using token bucket algorithm
     */
    private boolean checkRateLimit(String key, int limit) {
        LocalDateTime now = LocalDateTime.now();
        
        RateLimitBucket bucket = buckets.computeIfAbsent(key, k -> new RateLimitBucket(now));
        
        // Reset bucket if window has expired
        if (isExpired(bucket)) {
            bucket.reset(now);
        }
        
        // Check if under limit
        int currentCount = bucket.getCount().incrementAndGet();
        
        if (currentCount > limit) {
            log.warn("Rate limit exceeded for key: {}, count: {}, limit: {}", key, currentCount, limit);
            return false;
        }
        
        log.debug("Rate limit check passed for key: {}, count: {}, limit: {}", key, currentCount, limit);
        return true;
    }
    
    /**
     * Check if bucket has expired
     */
    private boolean isExpired(RateLimitBucket bucket) {
        return ChronoUnit.MINUTES.between(bucket.getWindowStart(), LocalDateTime.now()) >= WINDOW_MINUTES;
    }
    
    /**
     * Rate limit bucket for tracking requests
     */
    private static class RateLimitBucket {
        private volatile LocalDateTime windowStart;
        private final AtomicInteger count;
        
        public RateLimitBucket(LocalDateTime windowStart) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(0);
        }
        
        public void reset(LocalDateTime newWindowStart) {
            this.windowStart = newWindowStart;
            this.count.set(0);
        }
        
        public LocalDateTime getWindowStart() {
            return windowStart;
        }
        
        public AtomicInteger getCount() {
            return count;
        }
    }
    
    /**
     * Cleanup expired buckets (should be called periodically)
     */
    public void cleanupExpiredBuckets() {
        LocalDateTime now = LocalDateTime.now();
        buckets.entrySet().removeIf(entry -> 
            ChronoUnit.MINUTES.between(entry.getValue().getWindowStart(), now) > WINDOW_MINUTES * 2
        );
        log.debug("Cleaned up expired rate limit buckets");
    }
}
