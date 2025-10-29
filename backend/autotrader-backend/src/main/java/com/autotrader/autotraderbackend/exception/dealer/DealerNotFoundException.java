package com.autotrader.autotraderbackend.exception.dealer;

/**
 * Exception thrown when a dealer profile is not found.
 */
public class DealerNotFoundException extends RuntimeException {
    
    private final Long dealerId;
    private final Long userId;

    /**
     * Constructor with user ID.
     */
    public DealerNotFoundException(Long userId) {
        super("Dealer profile not found for user ID: " + userId);
        this.userId = userId;
        this.dealerId = null;
    }

    /**
     * Constructor with custom message and dealer ID.
     */
    public DealerNotFoundException(String message, Long dealerId) {
        super(message);
        this.dealerId = dealerId;
        this.userId = null;
    }

    /**
     * Constructor with custom message.
     */
    public DealerNotFoundException(String message) {
        super(message);
        this.dealerId = null;
        this.userId = null;
    }

    // Getters
    public Long getDealerId() {
        return dealerId;
    }

    public Long getUserId() {
        return userId;
    }
}