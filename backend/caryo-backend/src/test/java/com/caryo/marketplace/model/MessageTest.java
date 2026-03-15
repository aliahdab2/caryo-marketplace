package com.caryo.marketplace.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Message Entity Tests")
class MessageTest {

    private Message message;
    private User sender;
    private Conversation conversation;
    private MessageAttachment attachment;

    @BeforeEach
    void setUp() {
        // Create test user
        sender = new User();
        sender.setId(1L);
        sender.setUsername("sender");
        sender.setEmail("sender@test.com");
        sender.setPassword("password");

        // Create test conversation
        conversation = Conversation.builder()
                .id(1L)
                .status(ConversationStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create test message
        message = Message.builder()
                .id(1L)
                .conversation(conversation)
                .sender(sender)
                .content("Hello, is this car still available?")
                .messageType(MessageType.TEXT)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .attachments(new ArrayList<>())
                .build();

        // Create test attachment
        attachment = MessageAttachment.builder()
                .id(1L)
                .fileName("test.jpg")
                .contentType("image/jpeg")
                .size(1024L)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create message with required fields")
    void shouldCreateMessageWithRequiredFields() {
        // Assert
        assertNotNull(message);
        assertEquals(1L, message.getId());
        assertEquals(conversation, message.getConversation());
        assertEquals(sender, message.getSender());
        assertEquals("Hello, is this car still available?", message.getContent());
        assertEquals(MessageType.TEXT, message.getMessageType());
        assertFalse(message.isRead());
        assertNull(message.getReadAt());
        assertNotNull(message.getCreatedAt());
    }

    @Test
    @DisplayName("Should mark message as read")
    void shouldMarkMessageAsRead() {
        // Arrange
        LocalDateTime beforeMark = LocalDateTime.now();

        // Act
        message.markAsRead();

        // Assert
        assertTrue(message.isRead());
        assertNotNull(message.getReadAt());
        assertTrue(message.getReadAt().isAfter(beforeMark) || message.getReadAt().equals(beforeMark));
    }

    @Test
    @DisplayName("Should add attachment to message")
    void shouldAddAttachmentToMessage() {
        // Act
        message.addAttachment(attachment);

        // Assert
        assertEquals(1, message.getAttachments().size());
        assertTrue(message.getAttachments().contains(attachment));
        assertEquals(message, attachment.getMessage());
    }

    @Test
    @DisplayName("Should check if message has attachments")
    void shouldCheckIfMessageHasAttachments() {
        // Initially no attachments
        assertFalse(message.hasAttachments());

        // Add attachment
        message.addAttachment(attachment);
        assertTrue(message.hasAttachments());
    }

    @Test
    @DisplayName("Should check if message is from specific user")
    void shouldCheckIfMessageIsFromSpecificUser() {
        // Act & Assert
        assertTrue(message.isFromUser(sender));

        User otherUser = new User();
        otherUser.setId(999L);
        assertFalse(message.isFromUser(otherUser));
    }

    @Test
    @DisplayName("Should handle message with different types")
    void shouldHandleMessageWithDifferentTypes() {
        // Test TEXT type
        message.setMessageType(MessageType.TEXT);
        assertEquals(MessageType.TEXT, message.getMessageType());

        // Test IMAGE type
        message.setMessageType(MessageType.IMAGE);
        assertEquals(MessageType.IMAGE, message.getMessageType());

        // Test SYSTEM type
        message.setMessageType(MessageType.SYSTEM);
        assertEquals(MessageType.SYSTEM, message.getMessageType());
    }

    @Test
    @DisplayName("Should handle message content changes")
    void shouldHandleMessageContentChanges() {
        // Arrange
        String newContent = "Updated message content";

        // Act
        message.setContent(newContent);

        // Assert
        assertEquals(newContent, message.getContent());
    }

    @Test
    @DisplayName("Should handle message read status changes")
    void shouldHandleMessageReadStatusChanges() {
        // Initially unread
        assertFalse(message.isRead());
        assertNull(message.getReadAt());

        // Mark as read
        message.markAsRead();
        assertTrue(message.isRead());
        assertNotNull(message.getReadAt());

        // Mark as unread again
        message.setIsRead(false);
        message.setReadAt(null);
        assertFalse(message.isRead());
        assertNull(message.getReadAt());
    }

    @Test
    @DisplayName("Should handle multiple attachments")
    void shouldHandleMultipleAttachments() {
        // Arrange
        MessageAttachment attachment2 = MessageAttachment.builder()
                .id(2L)
                .fileName("test2.jpg")
                .contentType("image/jpeg")
                .size(2048L)
                .createdAt(LocalDateTime.now())
                .build();

        // Act
        message.addAttachment(attachment);
        message.addAttachment(attachment2);

        // Assert
        assertEquals(2, message.getAttachments().size());
        assertTrue(message.getAttachments().contains(attachment));
        assertTrue(message.getAttachments().contains(attachment2));
    }

    @Test
    @DisplayName("Should handle message with long content")
    void shouldHandleMessageWithLongContent() {
        // Arrange
        String longContent = "A".repeat(1000); // Max length content

        // Act
        message.setContent(longContent);

        // Assert
        assertEquals(longContent, message.getContent());
        assertEquals(1000, message.getContent().length());
    }

    @Test
    @DisplayName("Should handle message with empty content")
    void shouldHandleMessageWithEmptyContent() {
        // Arrange
        String emptyContent = "";

        // Act
        message.setContent(emptyContent);

        // Assert
        assertEquals(emptyContent, message.getContent());
        assertTrue(message.getContent().isEmpty());
    }

    @Test
    @DisplayName("Should handle message with special characters")
    void shouldHandleMessageWithSpecialCharacters() {
        // Arrange
        String specialContent = "Hello! How are you? 😊 This is a test message with special chars: @#$%^&*()";

        // Act
        message.setContent(specialContent);

        // Assert
        assertEquals(specialContent, message.getContent());
    }

    @Test
    @DisplayName("Should handle message timestamp updates")
    void shouldHandleMessageTimestampUpdates() {
        // Arrange
        LocalDateTime newTimestamp = LocalDateTime.now().plusHours(1);

        // Act
        message.setCreatedAt(newTimestamp);

        // Assert
        assertEquals(newTimestamp, message.getCreatedAt());
    }

    @Test
    @DisplayName("Should handle message with null conversation")
    void shouldHandleMessageWithNullConversation() {
        // Act
        message.setConversation(null);

        // Assert
        assertNull(message.getConversation());
    }

    @Test
    @DisplayName("Should handle message with null sender")
    void shouldHandleMessageWithNullSender() {
        // Act
        message.setSender(null);

        // Assert
        assertNull(message.getSender());
    }

    @Test
    @DisplayName("Should handle message type validation")
    void shouldHandleMessageTypeValidation() {
        // Test all valid message types
        assertDoesNotThrow(() -> message.setMessageType(MessageType.TEXT));
        assertDoesNotThrow(() -> message.setMessageType(MessageType.IMAGE));
        assertDoesNotThrow(() -> message.setMessageType(MessageType.SYSTEM));
    }
}
