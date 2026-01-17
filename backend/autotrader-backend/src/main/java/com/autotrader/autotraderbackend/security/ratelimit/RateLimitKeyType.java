package com.autotrader.autotraderbackend.security.ratelimit;

/**
 * Types of keys for rate limiting
 */
public enum RateLimitKeyType {
    /**
     * Rate limit by IP address
     */
    IP,

    /**
     * Rate limit by authenticated user
     */
    USER,

    /**
     * Rate limit by IP address and endpoint combination
     */
    IP_AND_ENDPOINT,

    /**
     * Rate limit by user and endpoint combination
     */
    USER_AND_ENDPOINT
}
