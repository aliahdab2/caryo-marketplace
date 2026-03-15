package com.caryo.marketplace.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for blocking a user in a conversation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockUserResponse {

    private Long conversationId;
    private String status;
    private LocalDateTime blockedAt;
    private String message;

    /**
     * Create a success response for blocking a user
     */
    public static BlockUserResponse success(Long conversationId, String message) {
        return BlockUserResponse.builder()
                .conversationId(conversationId)
                .status("BLOCKED")
                .blockedAt(LocalDateTime.now())
                .message(message)
                .build();
    }
}

