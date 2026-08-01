package com.caryo.marketplace.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Aggregate messaging counters for the authenticated user's dashboard.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConversationStatsResponse {

    private long totalConversations;
    private long activeConversations;
    private long unreadMessages;
    private long archivedConversations;
}
