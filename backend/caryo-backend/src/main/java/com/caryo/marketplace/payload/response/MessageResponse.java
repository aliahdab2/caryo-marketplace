package com.caryo.marketplace.payload.response;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for message data.
 * Provides comprehensive message information for the frontend.
 * Also supports simple string messages for backward compatibility.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private Long id;
    private Long conversationId;
    private String content;
    private String messageType;
    private boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private boolean isEdited;
    private LocalDateTime editedAt;
    private boolean isDeleted;
    private LocalDateTime deletedAt;
    private Long version;

    private UserSummary sender;
    private List<MessageAttachmentResponse> attachments;

    // Helper fields for frontend
    private boolean canBeEdited;
    private boolean canBeDeleted;
    private String displayContent;
    private String statusDescription;

    // Simple constructor for backward compatibility with existing code
    public MessageResponse(String message) {
        this.content = message;
        this.messageType = "text";
        this.createdAt = LocalDateTime.now();
    }

    // Getter method for backward compatibility with existing tests
    public String getMessage() {
        return content;
    }

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
    public static class MessageAttachmentResponse {
        private Long id;
        private String fileName;
        private String contentType;
        private Long size;
        private String fileUrl;
        private String uploadStatus;
        private String errorMessage;
        private LocalDateTime createdAt;
        private boolean isDeleted;

        // Helper fields for frontend
        private String humanReadableSize;
        private boolean image;
        private boolean document;
        private boolean video;
        private boolean audio;
        private String fileExtension;
        private boolean validFileType;
    }

    // Helper methods for frontend
    public boolean isTextMessage() {
        return "text".equals(messageType);
    }

    public boolean isImageMessage() {
        return "image".equals(messageType);
    }

    public boolean isSystemMessage() {
        return "system".equals(messageType);
    }

    public boolean hasAttachments() {
        return attachments != null && !attachments.isEmpty();
    }

    public boolean isFromCurrentUser(Long currentUserId) {
        return sender != null && sender.getId() != null && sender.getId().equals(currentUserId);
    }

    public String getTimeAgo() {
        if (createdAt == null) {
            return "Unknown time";
        }

        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(createdAt, now).toMinutes();

        if (minutes < 1) {
            return "Just now";
        } else if (minutes < 60) {
            return minutes + "m ago";
        } else if (minutes < 1440) {
            long hours = minutes / 60;
            return hours + "h ago";
        } else {
            long days = minutes / 1440;
            return days + "d ago";
        }
    }

    public String getReadStatus() {
        if (isDeleted) {
            return "Deleted";
        }

        if (isRead) {
            return "Read";
        }

        return "Unread";
    }

    public boolean shouldShowEditIndicator() {
        return isEdited && !isDeleted;
    }

    public boolean shouldShowDeleteIndicator() {
        return isDeleted;
    }

    public String getMessageStatus() {
        if (isDeleted) {
            return "deleted";
        }

        if (isEdited) {
            return "edited";
        }

        if (isRead) {
            return "read";
        }

        return "sent";
    }
}
