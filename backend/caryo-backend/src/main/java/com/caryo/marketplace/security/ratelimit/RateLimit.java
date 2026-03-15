package com.caryo.marketplace.security.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to apply rate limiting to controller methods
 *
 * Usage:
 * @RateLimit(maxRequests = 5, windowSeconds = 60, keyType = RateLimitKeyType.IP)
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /**
     * Maximum number of requests allowed within the time window
     */
    int maxRequests() default 100;

    /**
     * Time window in seconds
     */
    int windowSeconds() default 60;

    /**
     * Type of key to use for rate limiting
     */
    RateLimitKeyType keyType() default RateLimitKeyType.IP;

    /**
     * Custom message to return when rate limit is exceeded
     */
    String message() default "Too many requests. Please try again later.";
}
