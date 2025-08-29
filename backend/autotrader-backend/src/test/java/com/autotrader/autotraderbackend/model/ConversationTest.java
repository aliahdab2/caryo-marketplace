package com.autotrader.autotraderbackend.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Conversation Entity Tests")
class ConversationTest {

    private Conversation conversation;
    private User buyer;
    private User seller;
    private CarListing listing;
    private Message message1;
    private Message message2;
    private ConversationParticipant buyerParticipant;
    private ConversationParticipant sellerParticipant;

    @BeforeEach
    void setUp() {
        // Create test users
        buyer = new User();
        buyer.setId(1L);
        buyer.setUsername("buyer");
        buyer.setEmail("buyer@test.com");
        buyer.setPassword("password");

        seller = new User();
        seller.setId(2L);
        seller.setUsername("seller");
        seller.setEmail("seller@test.com");
        seller.setPassword("password");

        // Create test listing
        listing = new CarListing();
        listing.setId(1L);
        listing.setTitle("Test Car");
        listing.setDescription("A test car listing for conversation model tests");
        listing.setModelYear(2020);
        listing.setMileage(50000);
        listing.setPrice(java.math.BigDecimal.valueOf(25000));
        listing.setCurrency("USD");
        listing.setSeller(seller);

        // Create test conversation
        conversation = Conversation.builder()
                .id(1L)
                .listing(listing)
                .buyer(buyer)
                .seller(seller)
                .status(ConversationStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .messages(new ArrayList<>())
                .participants(new ArrayList<>())
                .build();

        // Create test messages
        message1 = Message.builder()
                .id(1L)
                .content("Hello, is this car still available?")
                .sender(buyer)
                .messageType(MessageType.TEXT)
                .createdAt(LocalDateTime.now())
                .build();

        message2 = Message.builder()
                .id(2L)
                .content("Yes, it's still available!")
                .sender(seller)
                .messageType(MessageType.TEXT)
                .createdAt(LocalDateTime.now())
                .build();

        // Create test participants
        buyerParticipant = ConversationParticipant.builder()
                .id(1L)
                .user(buyer)
                .role(ParticipantRole.BUYER)
                .joinedAt(LocalDateTime.now())
                .build();

        sellerParticipant = ConversationParticipant.builder()
                .id(2L)
                .user(seller)
                .role(ParticipantRole.SELLER)
                .joinedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create conversation with required fields")
    void shouldCreateConversationWithRequiredFields() {
        // Assert
        assertNotNull(conversation);
        assertEquals(1L, conversation.getId());
        assertEquals(listing, conversation.getListing());
        assertEquals(buyer, conversation.getBuyer());
        assertEquals(seller, conversation.getSeller());
        assertEquals(ConversationStatus.ACTIVE, conversation.getStatus());
        assertNotNull(conversation.getCreatedAt());
        assertNotNull(conversation.getUpdatedAt());
    }

    @Test
    @DisplayName("Should identify user as participant")
    void shouldIdentifyUserAsParticipant() {
        // Act & Assert
        assertTrue(conversation.isParticipant(buyer));
        assertTrue(conversation.isParticipant(seller));
        
        User nonParticipant = new User();
        nonParticipant.setId(999L);
        assertFalse(conversation.isParticipant(nonParticipant));
    }

    @Test
    @DisplayName("Should get other participant correctly")
    void shouldGetOtherParticipantCorrectly() {
        // Act & Assert
        assertEquals(seller, conversation.getOtherParticipant(buyer));
        assertEquals(buyer, conversation.getOtherParticipant(seller));
    }

    @Test
    @DisplayName("Should throw exception for non-participant user")
    void shouldThrowExceptionForNonParticipantUser() {
        // Arrange
        User nonParticipant = new User();
        nonParticipant.setId(999L);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            conversation.getOtherParticipant(nonParticipant);
        });
    }

    @Test
    @DisplayName("Should add message to conversation")
    void shouldAddMessageToConversation() {
        // Arrange
        LocalDateTime beforeAdd = conversation.getLastMessageAt();
        
        // Act
        conversation.addMessage(message1);
        
        // Assert
        assertEquals(1, conversation.getMessages().size());
        assertTrue(conversation.getMessages().contains(message1));
        assertEquals(message1.getConversation(), conversation);
        assertNotNull(conversation.getLastMessageAt());
        if (beforeAdd != null) {
            assertTrue(conversation.getLastMessageAt().isAfter(beforeAdd) || conversation.getLastMessageAt().equals(beforeAdd));
        } else {
            assertNotNull(conversation.getLastMessageAt());
        }
    }

    @Test
    @DisplayName("Should add participant to conversation")
    void shouldAddParticipantToConversation() {
        // Act
        conversation.addParticipant(buyerParticipant);
        
        // Assert
        assertEquals(1, conversation.getParticipants().size());
        assertTrue(conversation.getParticipants().contains(buyerParticipant));
        assertEquals(conversation, buyerParticipant.getConversation());
    }

    @Test
    @DisplayName("Should handle multiple messages correctly")
    void shouldHandleMultipleMessagesCorrectly() {
        // Act
        conversation.addMessage(message1);
        conversation.addMessage(message2);
        
        // Assert
        assertEquals(2, conversation.getMessages().size());
        assertTrue(conversation.getMessages().contains(message1));
        assertTrue(conversation.getMessages().contains(message2));
        assertEquals(message2.getCreatedAt(), conversation.getLastMessageAt());
    }

    @Test
    @DisplayName("Should handle conversation status changes")
    void shouldHandleConversationStatusChanges() {
        // Act
        conversation.setStatus(ConversationStatus.ARCHIVED);
        
        // Assert
        assertEquals(ConversationStatus.ARCHIVED, conversation.getStatus());
    }

    @Test
    @DisplayName("Should handle conversation with no messages")
    void shouldHandleConversationWithNoMessages() {
        // Assert
        assertTrue(conversation.getMessages().isEmpty());
        assertNull(conversation.getLastMessageAt());
    }

    @Test
    @DisplayName("Should handle conversation with no participants")
    void shouldHandleConversationWithNoParticipants() {
        // Assert
        assertTrue(conversation.getParticipants().isEmpty());
    }

    @Test
    @DisplayName("Should maintain message order when adding messages")
    void shouldMaintainMessageOrderWhenAddingMessages() {
        // Act
        conversation.addMessage(message1);
        conversation.addMessage(message2);
        
        // Assert
        List<Message> messages = conversation.getMessages();
        assertEquals(message1, messages.get(0));
        assertEquals(message2, messages.get(1));
    }

    @Test
    @DisplayName("Should handle conversation with attachments")
    void shouldHandleConversationWithAttachments() {
        // Arrange
        MessageAttachment attachment = MessageAttachment.builder()
                .id(1L)
                .fileName("test.jpg")
                .contentType("image/jpeg")
                .size(1024L)
                .build();
        
        message1.addAttachment(attachment);
        
        // Act
        conversation.addMessage(message1);
        
        // Assert
        assertEquals(1, conversation.getMessages().size());
        assertTrue(message1.hasAttachments());
        assertEquals(1, message1.getAttachments().size());
    }

    @Test
    @DisplayName("Should handle conversation status validation")
    void shouldHandleConversationStatusValidation() {
        // Test valid statuses
        assertDoesNotThrow(() -> conversation.setStatus(ConversationStatus.ACTIVE));
        assertDoesNotThrow(() -> conversation.setStatus(ConversationStatus.ARCHIVED));
        assertDoesNotThrow(() -> conversation.setStatus(ConversationStatus.BLOCKED));
    }

    @Test
    @DisplayName("Should handle conversation with system messages")
    void shouldHandleConversationWithSystemMessages() {
        // Arrange
        Message systemMessage = Message.builder()
                .id(3L)
                .content("Conversation started")
                .sender(buyer)
                .messageType(MessageType.SYSTEM)
                .createdAt(LocalDateTime.now())
                .build();
        
        // Act
        conversation.addMessage(systemMessage);
        
        // Assert
        assertEquals(1, conversation.getMessages().size());
        assertEquals(MessageType.SYSTEM, systemMessage.getMessageType());
    }
}
