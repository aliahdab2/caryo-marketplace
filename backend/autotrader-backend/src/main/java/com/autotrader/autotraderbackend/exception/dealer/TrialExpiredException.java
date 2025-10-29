package com.autotrader.autotraderbackend.exception.dealer;

/**
 * Exception thrown when a dealer's trial has expired or listing limit is reached.
 * Provides detailed context for the frontend to display appropriate upgrade prompts.
 */
public class TrialExpiredException extends RuntimeException {

    private final int listingsUsed;
    private final int listingsLimit;
    private final String subscriptionTier;
    private final boolean timeExpired;
    private final boolean listingLimitReached;

    /**
     * Constructor for trial expired by listing limit.
     */
    public TrialExpiredException(int listingsUsed, int listingsLimit) {
        super(String.format("Trial listing limit reached (%d/%d listings). Please upgrade your subscription to continue.",
            listingsUsed, listingsLimit));
        this.listingsUsed = listingsUsed;
        this.listingsLimit = listingsLimit;
        this.subscriptionTier = "trial";
        this.timeExpired = false;
        this.listingLimitReached = true;
    }

    /**
     * Constructor for trial expired by time.
     */
    public TrialExpiredException(String subscriptionTier, boolean timeExpired) {
        super("Trial period has expired. Please upgrade your subscription to continue creating listings.");
        this.listingsUsed = 0;
        this.listingsLimit = 0;
        this.subscriptionTier = subscriptionTier;
        this.timeExpired = timeExpired;
        this.listingLimitReached = false;
    }

    /**
     * Full constructor with all details.
     */
    public TrialExpiredException(int listingsUsed, int listingsLimit, String subscriptionTier,
                                  boolean timeExpired, boolean listingLimitReached) {
        super(buildMessage(listingsUsed, listingsLimit, timeExpired, listingLimitReached));
        this.listingsUsed = listingsUsed;
        this.listingsLimit = listingsLimit;
        this.subscriptionTier = subscriptionTier;
        this.timeExpired = timeExpired;
        this.listingLimitReached = listingLimitReached;
    }

    private static String buildMessage(int listingsUsed, int listingsLimit,
                                       boolean timeExpired, boolean listingLimitReached) {
        if (listingLimitReached) {
            return String.format("Trial listing limit reached (%d/%d listings). Please upgrade to continue.",
                listingsUsed, listingsLimit);
        } else if (timeExpired) {
            return "Trial period has expired. Please upgrade your subscription to continue.";
        } else {
            return "Trial has expired. Please upgrade your subscription to continue creating listings.";
        }
    }

    // Getters for client to access details
    public int getListingsUsed() {
        return listingsUsed;
    }

    public int getListingsLimit() {
        return listingsLimit;
    }

    public String getSubscriptionTier() {
        return subscriptionTier;
    }

    public boolean isTimeExpired() {
        return timeExpired;
    }

    public boolean isListingLimitReached() {
        return listingLimitReached;
    }
}

