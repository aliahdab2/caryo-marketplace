package com.autotrader.autotraderbackend.security.ratelimit;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory rate limiting service.
 * For production, consider using Redis for distributed rate limiting.
 */
@Slf4j
@Service
public class RateLimitService {

    // Store: key -> RateLimitBucket
    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();

    /**
     * Check if the request is allowed based on rate limit
     *
     * @param key The identifier for rate limiting (e.g., IP address, user ID, or IP+endpoint)
     * @param maxRequests Maximum number of requests allowed
     * @param windowSeconds Time window in seconds
     * @return true if request is allowed, false if rate limit exceeded
     */
    public boolean isAllowed(String key, int maxRequests, int windowSeconds) {
        cleanupOldBuckets();

        RateLimitBucket bucket = buckets.computeIfAbsent(key,
            k -> new RateLimitBucket(maxRequests, windowSeconds));

        boolean allowed = bucket.tryConsume();

        if (!allowed) {
            log.warn("Rate limit exceeded for key: {}", key);
        }

        return allowed;
    }

    /**
     * Get remaining requests for a key
     */
    public int getRemainingRequests(String key) {
        RateLimitBucket bucket = buckets.get(key);
        return bucket != null ? bucket.getAvailableTokens() : 0;
    }

    /**
     * Get time until reset in seconds
     */
    public long getSecondsUntilReset(String key) {
        RateLimitBucket bucket = buckets.get(key);
        return bucket != null ? bucket.getSecondsUntilReset() : 0;
    }

    /**
     * Cleanup old buckets to prevent memory leaks
     */
    private void cleanupOldBuckets() {
        // Remove buckets older than 1 hour
        long cutoff = Instant.now().getEpochSecond() - 3600;
        buckets.entrySet().removeIf(entry -> entry.getValue().getLastRefill() < cutoff);
    }

    /**
     * Inner class representing a rate limit bucket using token bucket algorithm
     */
    private static class RateLimitBucket {
        private final int maxTokens;
        private final int windowSeconds;
        private int availableTokens;
        private long lastRefill;

        public RateLimitBucket(int maxTokens, int windowSeconds) {
            this.maxTokens = maxTokens;
            this.windowSeconds = windowSeconds;
            this.availableTokens = maxTokens;
            this.lastRefill = Instant.now().getEpochSecond();
        }

        public synchronized boolean tryConsume() {
            refill();

            if (availableTokens > 0) {
                availableTokens--;
                return true;
            }

            return false;
        }

        private void refill() {
            long now = Instant.now().getEpochSecond();
            long timePassed = now - lastRefill;

            if (timePassed >= windowSeconds) {
                availableTokens = maxTokens;
                lastRefill = now;
            }
        }

        public synchronized int getAvailableTokens() {
            refill();
            return availableTokens;
        }

        public synchronized long getSecondsUntilReset() {
            long now = Instant.now().getEpochSecond();
            long timePassed = now - lastRefill;
            return Math.max(0, windowSeconds - timePassed);
        }

        public long getLastRefill() {
            return lastRefill;
        }
    }
}
