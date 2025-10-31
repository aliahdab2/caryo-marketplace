package com.autotrader.autotraderbackend.payload.response;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for conversation data.
 * Provides comprehensive conversation information for the frontend.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {

    private Long id;
    private Long listingId;
    private String listingTitle;
    private String listingImageUrl;
    private String listingPrice;
    private String listingCurrency;
    private String listingBrand;
    private String listingModel;
    private Integer listingYear;

    private UserSummary buyer;
    private UserSummary seller;
    private String status;
    private LocalDateTime lastMessageAt;
    private int unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isActive;
    private boolean isArchived;
    private boolean isBlocked;

    private List<MessageSummary> recentMessages;
    private List<ParticipantSummary> participants;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String username;
        private String email;
        private String profileImageUrl;
        private boolean isOnline;
        private LocalDateTime lastSeenAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageSummary {
        private Long id;
        private String content;
        private String messageType;
        private boolean isRead;
        private LocalDateTime readAt;
        private LocalDateTime createdAt;
        private boolean isEdited;
        private LocalDateTime editedAt;
        private boolean isDeleted;
        private UserSummary sender;
        private List<AttachmentSummary> attachments;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentSummary {
        private Long id;
        private String fileName;
        private String contentType;
        private Long size;
        private String fileUrl;
        private String uploadStatus;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParticipantSummary {
        private Long id;
        private UserSummary user;
        private String role;
        private LocalDateTime joinedAt;
        private LocalDateTime leftAt;
        private boolean isActive;
        private boolean isMuted;
        private LocalDateTime mutedUntil;
        private Long lastReadMessageId;
        private LocalDateTime lastReadAt;
        private int unreadCount;
        private String statusDescription;
    }

    // Helper methods for frontend
    public boolean hasUnreadMessages() {
        return unreadCount > 0;
    }

    public String getStatusDisplay() {
        if (isBlocked) return "Blocked";
        if (isArchived) return "Archived";
        if (isActive) return "Active";
        return status;
    }

    public boolean canSendMessages() {
        return isActive && !isBlocked;
    }

    public String getLastActivityTime() {
        if (lastMessageAt != null) {
            return lastMessageAt.toString();
        }
        return createdAt.toString();
    }

    public boolean isGroupChat() {
        return participants != null && participants.size() > 2;
    }

    public int getParticipantCount() {
        return participants != null ? participants.size() : 0;
    }
}
