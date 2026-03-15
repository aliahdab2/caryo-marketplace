package com.caryo.marketplace.exception.dealer;

/**
 * Exception thrown when a dealer exceeds their subscription tier's listing limit.
 * Used for paid subscriptions (Basic, Advanced, Professional).
 */
public class SubscriptionLimitExceededException extends RuntimeException {
    
    private final String subscriptionTier;
    private final int currentListings;
    private final int limit;

    /**
     * Constructor with tier and limits.
     */
    public SubscriptionLimitExceededException(String subscriptionTier, int currentListings, int limit) {
        super(String.format("Subscription listing limit reached for %s tier (%d/%d listings). " +
            "Please upgrade to a higher tier to create more listings.",
            subscriptionTier, currentListings, limit));
        this.subscriptionTier = subscriptionTier;
        this.currentListings = currentListings;
        this.limit = limit;
    }

    /**
     * Constructor with custom message.
     */
    public SubscriptionLimitExceededException(String message, String tier, int current, int limit) {
        super(message);
        this.subscriptionTier = tier;
        this.currentListings = current;
        this.limit = limit;
    }

    // Getters for client access
    public String getSubscriptionTier() {
        return subscriptionTier;
    }

    public int getCurrentListings() {
        return currentListings;
    }

    public int getLimit() {
        return limit;
    }
}