package com.autotrader.autotraderbackend.exception.dealer;

/**
 * Exception thrown when a dealer profile is not found.
 * This typically occurs when:
 * - User ID doesn't have an associated dealer profile
 * - Dealer ID doesn't exist in the database
 * - User is not a dealer (wrong role)
 */
public class DealerNotFoundException extends RuntimeException {
    
    private final Long userId;
    private final Long dealerId;
    
    /**
     * Constructor for missing dealer by user ID.
     */
    public DealerNotFoundException(Long userId) {
        super(String.format("Dealer profile not found for user ID: %d", userId));
        this.userId = userId;
        this.dealerId = null;
    }
    
    /**
     * Constructor for missing dealer by dealer ID.
     */
    public DealerNotFoundException(String message, Long dealerId) {
        super(message);
        this.userId = null;
        this.dealerId = dealerId;
    }
    
    /**
     * Constructor with custom message.
     */
    public DealerNotFoundException(String message) {
        super(message);
        this.userId = null;
        this.dealerId = null;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public Long getDealerId() {
        return dealerId;
    }
}

