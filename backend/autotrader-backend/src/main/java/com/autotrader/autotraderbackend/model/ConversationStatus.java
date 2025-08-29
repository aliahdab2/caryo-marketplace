package com.autotrader.autotraderbackend.model;

/**
 * Enum representing the status of a conversation.
 * Follows the existing enum patterns in the project.
 */
public enum ConversationStatus {
    
    /**
     * Active conversation - participants can send and receive messages
     */
    ACTIVE,
    
    /**
     * Archived conversation - participants can view but not send new messages
     */
    ARCHIVED,
    
    /**
     * Blocked conversation - one participant has blocked the other
     */
    BLOCKED;
}
