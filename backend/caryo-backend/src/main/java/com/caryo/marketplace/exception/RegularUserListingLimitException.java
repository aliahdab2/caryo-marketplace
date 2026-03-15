package com.caryo.marketplace.exception;

import lombok.Getter;

/**
 * Exception thrown when a regular user (non-dealer) attempts to exceed their listing limit.
 * Regular users have a maximum number of active listings they can create.
 */
@Getter
public class RegularUserListingLimitException extends RuntimeException {

    private final String username;
    private final int currentCount;
    private final int limit;

    public RegularUserListingLimitException(String username, int currentCount, int limit) {
        super(String.format("User '%s' has reached the listing limit. Current: %d, Limit: %d. " +
                "Upgrade to a dealer account for more listings.", username, currentCount, limit));
        this.username = username;
        this.currentCount = currentCount;
        this.limit = limit;
    }
}

