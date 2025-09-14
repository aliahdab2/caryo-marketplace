package com.autotrader.autotraderbackend.model;

/**
 * Status enum for car brands and models
 * Represents the lifecycle state of entities in the system
 */
public enum ModelStatus {
    ACTIVE("Active and visible to users"),
    INACTIVE("Awaiting admin review"),
    REJECTED("Reviewed and rejected by admin");
    
    private final String description;
    
    ModelStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * Check if status allows public visibility
     */
    public boolean isPubliclyVisible() {
        return this == ACTIVE;
    }
    
    /**
     * Check if status requires admin attention
     */
    public boolean requiresReview() {
        return this == INACTIVE;
    }
}
