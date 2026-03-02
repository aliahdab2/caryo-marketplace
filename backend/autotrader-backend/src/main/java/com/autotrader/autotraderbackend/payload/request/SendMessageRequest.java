package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Request DTO for sending a message in an existing conversation.
 * Follows the existing request DTO patterns in the project.
 */
@Getter
@Setter
public class SendMessageRequest {

    /**
     * The content of the message to send.
     * Must be between 1 and 1000 characters.
     */
    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 1000, message = "Message cannot exceed 1000 characters")
    private String content;

    /**
     * The type of message being sent.
     * Optional, defaults to TEXT.
     */
    private String messageType = "text";
}
