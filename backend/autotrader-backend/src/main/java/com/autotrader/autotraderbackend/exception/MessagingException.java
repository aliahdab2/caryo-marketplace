package com.autotrader.autotraderbackend.exception;

/**
 * Custom exception for messaging-related errors.
 * Provides specific error handling for messaging operations.
 */
public class MessagingException extends RuntimeException {

    private final String errorCode;
    private final Object[] args;

    public MessagingException(String message) {
        super(message);
        this.errorCode = "MESSAGING_ERROR";
        this.args = new Object[0];
    }

    public MessagingException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "MESSAGING_ERROR";
        this.args = new Object[0];
    }

    public MessagingException(String errorCode, String message, Object... args) {
        super(message);
        this.errorCode = errorCode;
        this.args = args;
    }

    public MessagingException(String errorCode, String message, Throwable cause, Object... args) {
        super(message, cause);
        this.errorCode = errorCode;
        this.args = args;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public Object[] getArgs() {
        return args;
    }

    // Specific messaging error types
    public static class ConversationNotFoundException extends MessagingException {
        public ConversationNotFoundException(Long conversationId) {
            super("CONVERSATION_NOT_FOUND", "Conversation not found with ID: " + conversationId, conversationId);
        }
    }

    public static class MessageNotFoundException extends MessagingException {
        public MessageNotFoundException(Long messageId) {
            super("MESSAGE_NOT_FOUND", "Message not found with ID: " + messageId, messageId);
        }
    }

    public static class UnauthorizedConversationAccessException extends MessagingException {
        public UnauthorizedConversationAccessException(Long userId, Long conversationId) {
            super("UNAUTHORIZED_CONVERSATION_ACCESS",
                  "User " + userId + " is not authorized to access conversation " + conversationId,
                  userId, conversationId);
        }
    }

    public static class AttachmentUploadException extends MessagingException {
        public AttachmentUploadException(String fileName, String reason) {
            super("ATTACHMENT_UPLOAD_FAILED",
                  "Failed to upload attachment '" + fileName + "': " + reason,
                  fileName, reason);
        }
    }

    public static class MessageValidationException extends MessagingException {
        public MessageValidationException(String validationError) {
            super("MESSAGE_VALIDATION_FAILED",
                  "Message validation failed: " + validationError,
                  validationError);
        }
    }

    public static class RateLimitExceededException extends MessagingException {
        public RateLimitExceededException(String limitType, int limit) {
            super("RATE_LIMIT_EXCEEDED",
                  "Rate limit exceeded for " + limitType + ". Limit: " + limit,
                  limitType, limit);
        }
    }
}
