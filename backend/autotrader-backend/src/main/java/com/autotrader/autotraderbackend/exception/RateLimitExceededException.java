package com.autotrader.autotraderbackend.exception;

import lombok.Getter;

/**
 * Exception thrown when rate limit is exceeded
 */
@Getter
public class RateLimitExceededException extends RuntimeException {

    private final int remainingRequests;
    private final long secondsUntilReset;

    public RateLimitExceededException(String message, int remainingRequests, long secondsUntilReset) {
        super(message);
        this.remainingRequests = remainingRequests;
        this.secondsUntilReset = secondsUntilReset;
    }
}
