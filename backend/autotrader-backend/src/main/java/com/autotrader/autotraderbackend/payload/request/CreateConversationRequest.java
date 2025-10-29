package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * Request DTO for creating a new conversation.
 * Used when a buyer wants to start a conversation with a seller about a listing.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateConversationRequest {

    @NotNull(message = "Listing ID is required")
    @Positive(message = "Listing ID must be a positive number")
    private Long listingId;

    @NotBlank(message = "Initial message is required")
    @Size(max = 1000, message = "Initial message cannot exceed 1000 characters")
    private String initialMessage;

    @Size(max = 500, message = "Subject cannot exceed 500 characters")
    private String subject;

    // Optional fields for enhanced conversation creation
    private String messageType;
    private Long[] attachmentIds;

    // Validation groups for different operations
    public interface CreateConversation {}
    public interface CreateConversationWithAttachments {}

    // Helper methods
    public boolean hasSubject() {
        return subject != null && !subject.trim().isEmpty();
    }

    public boolean hasAttachments() {
        return attachmentIds != null && attachmentIds.length > 0;
    }

    public String getMessageTypeOrDefault() {
        return messageType != null ? messageType : "text";
    }

    public String getTrimmedSubject() {
        return subject != null ? subject.trim() : null;
    }

    public String getTrimmedMessage() {
        return initialMessage != null ? initialMessage.trim() : initialMessage;
    }

    public boolean isValidForCreation() {
        return listingId != null &&
               initialMessage != null &&
               !initialMessage.trim().isEmpty() &&
               initialMessage.length() <= 1000;
    }
}
