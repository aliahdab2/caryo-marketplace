package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.*;
import com.caryo.marketplace.util.TestDataBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("MessageRepository Tests")
class MessageRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private MessageRepository messageRepository;

    private User sender1;
    private User sender2;
    private Conversation conversation;
    private Message message1;
    private Message message2;
    private Message message3;
    private Message message4;
    private Governorate governorate;
    private CarModel model;
    private LocalDateTime baseTime;

    @BeforeEach
    void setUp() {
        // Create test users
        sender1 = TestDataBuilder.createValidUser("sender1", "sender1@test.com");
        sender1 = entityManager.persistAndFlush(sender1);

        sender2 = TestDataBuilder.createValidUser("sender2", "sender2@test.com");
        sender2 = entityManager.persistAndFlush(sender2);

        // Create and persist dependencies first
        Country country = TestDataBuilder.createTestCountry();
        country = entityManager.persistAndFlush(country);

        governorate = TestDataBuilder.createTestGovernorate();
        governorate.setCountry(country);
        governorate = entityManager.persistAndFlush(governorate);

        CarBrand brand = TestDataBuilder.createTestCarBrand();
        brand = entityManager.persistAndFlush(brand);

        model = TestDataBuilder.createTestCarModel();
        model.setBrand(brand);
        model = entityManager.persistAndFlush(model);

        // Create test listing using TestDataBuilder
        CarListing listing = TestDataBuilder.createValidCarListing(sender1);
        listing.setGovernorate(governorate);
        listing.setModel(model);
        listing = entityManager.persistAndFlush(listing);

        // Set base time for consistent testing
        baseTime = LocalDateTime.of(2024, 1, 1, 12, 0, 0);

        // Create test conversation
        conversation = Conversation.builder()
                .listing(listing)
                .buyer(sender1)
                .seller(sender2)
                .status(ConversationStatus.ACTIVE)
                .lastMessageAt(baseTime)
                .build();
        conversation = entityManager.persistAndFlush(conversation);

        // Create test messages with fixed timestamps

        message1 = Message.builder()
                .conversation(conversation)
                .sender(sender1)
                .content("Hello, is this car still available?")
                .messageType(MessageType.TEXT)
                .isRead(false)
                .createdAt(baseTime.minusHours(3))
                .build();
        message1 = entityManager.persistAndFlush(message1);

        message2 = Message.builder()
                .conversation(conversation)
                .sender(sender2)
                .content("Yes, it's still available!")
                .messageType(MessageType.TEXT)
                .isRead(false)
                .createdAt(baseTime.minusHours(2))
                .build();
        message2 = entityManager.persistAndFlush(message2);

        message3 = Message.builder()
                .conversation(conversation)
                .sender(sender1)
                .content("Great! Can I see more photos?")
                .messageType(MessageType.TEXT)
                .isRead(true)
                .readAt(baseTime.minusHours(1))
                .createdAt(baseTime.minusHours(1))
                .build();
        message3 = entityManager.persistAndFlush(message3);

        message4 = Message.builder()
                .conversation(conversation)
                .sender(sender2)
                .content("Of course! Here are some additional photos.")
                .messageType(MessageType.IMAGE)
                .isRead(false)
                .createdAt(baseTime)
                .build();
        message4 = entityManager.persistAndFlush(message4);

        entityManager.flush();
    }

    @Test
    @DisplayName("Should find messages by conversation ID ordered by creation time")
    void shouldFindMessagesByConversationIdOrderedByCreationTime() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId(), pageable);

        // Assert
        assertEquals(4, messages.getTotalElements());
        List<Message> content = messages.getContent();

        // Should be ordered by createdAt ASC (oldest first)
        assertEquals(message1.getId(), content.get(0).getId());
        assertEquals(message2.getId(), content.get(1).getId());
        assertEquals(message3.getId(), content.get(2).getId());
        assertEquals(message4.getId(), content.get(3).getId());
    }

    @Test
    @DisplayName("Should find recent messages by conversation ID")
    void shouldFindRecentMessagesByConversationId() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 3); // Get 3 most recent messages

        // Act
        List<Message> recentMessages = messageRepository.findRecentMessagesByConversationId(conversation.getId(), pageable);

        // Assert
        assertEquals(3, recentMessages.size());

        // Should be ordered by createdAt DESC (newest first)
        assertEquals(message4.getId(), recentMessages.get(0).getId());
        assertEquals(message3.getId(), recentMessages.get(1).getId());
        assertEquals(message2.getId(), recentMessages.get(2).getId());
    }

    @Test
    @DisplayName("Should find unread messages by conversation ID")
    void shouldFindUnreadMessagesByConversationId() {
        // Act
        List<Message> unreadMessages = messageRepository.findByConversationIdAndIsReadFalseOrderByCreatedAtAsc(conversation.getId());

        // Assert
        assertEquals(3, unreadMessages.size());
        assertTrue(unreadMessages.stream().allMatch(msg -> !msg.isRead()));

        // Should be ordered by createdAt ASC
        assertEquals(message1.getId(), unreadMessages.get(0).getId());
        assertEquals(message2.getId(), unreadMessages.get(1).getId());
        assertEquals(message4.getId(), unreadMessages.get(2).getId());
    }

    @Test
    @DisplayName("Should find unread messages for a specific user")
    void shouldFindUnreadMessagesForSpecificUser() {
        // Act
        List<Message> unreadForSender1 = messageRepository.findUnreadMessagesForUser(conversation.getId(), sender1);
        List<Message> unreadForSender2 = messageRepository.findUnreadMessagesForUser(conversation.getId(), sender2);

        // Assert
        assertEquals(2, unreadForSender1.size()); // Messages from sender2
        assertEquals(1, unreadForSender2.size()); // Messages from sender1

        // All unread messages should be from the other user
        assertTrue(unreadForSender1.stream().allMatch(msg -> msg.getSender().getId().equals(sender2.getId())));
        assertTrue(unreadForSender2.stream().allMatch(msg -> msg.getSender().getId().equals(sender1.getId())));
    }

    @Test
    @DisplayName("Should count unread messages for a user")
    void shouldCountUnreadMessagesForUser() {
        // Act
        long unreadCountForSender1 = messageRepository.countUnreadMessagesForUser(conversation.getId(), sender1);
        long unreadCountForSender2 = messageRepository.countUnreadMessagesForUser(conversation.getId(), sender2);

        // Assert
        assertEquals(2, unreadCountForSender1);
        assertEquals(1, unreadCountForSender2);
    }

    @Test
    @DisplayName("Should find messages by sender")
    void shouldFindMessagesBySender() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Message> sender1Messages = messageRepository.findBySenderOrderByCreatedAtDesc(sender1, pageable);
        Page<Message> sender2Messages = messageRepository.findBySenderOrderByCreatedAtDesc(sender2, pageable);

        // Assert
        assertEquals(2, sender1Messages.getTotalElements());
        assertEquals(2, sender2Messages.getTotalElements());

        // Should be ordered by createdAt DESC (newest first)
        List<Message> sender1Content = sender1Messages.getContent();
        assertEquals(message3.getId(), sender1Content.get(0).getId());
        assertEquals(message1.getId(), sender1Content.get(1).getId());
    }

    @Test
    @DisplayName("Should find messages by conversation and sender")
    void shouldFindMessagesByConversationAndSender() {
        // Act
        List<Message> sender1Messages = messageRepository.findByConversationIdAndSenderIdOrderByCreatedAtAsc(conversation.getId(), sender1.getId());
        List<Message> sender2Messages = messageRepository.findByConversationIdAndSenderIdOrderByCreatedAtAsc(conversation.getId(), sender2.getId());

        // Assert
        assertEquals(2, sender1Messages.size());
        assertEquals(2, sender2Messages.size());

        // Should be ordered by createdAt ASC
        assertEquals(message1.getId(), sender1Messages.get(0).getId());
        assertEquals(message3.getId(), sender1Messages.get(1).getId());

        assertEquals(message2.getId(), sender2Messages.get(0).getId());
        assertEquals(message4.getId(), sender2Messages.get(1).getId());
    }

    @Test
    @DisplayName("Should mark message as read")
    void shouldMarkMessageAsRead() {
        // Arrange
        LocalDateTime readAt = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);

        // Act
        messageRepository.markMessageAsRead(message1.getId(), readAt);
        entityManager.flush();
        entityManager.clear();

        // Assert
        Message updatedMessage = entityManager.find(Message.class, message1.getId());
        assertTrue(updatedMessage.isRead());
        // Compare with microsecond precision to avoid nanosecond timing issues
        assertEquals(readAt.truncatedTo(ChronoUnit.MICROS),
                    updatedMessage.getReadAt().truncatedTo(ChronoUnit.MICROS));
    }

    @Test
    @DisplayName("Should mark all messages in conversation as read for a user")
    void shouldMarkAllMessagesAsReadInConversationForUser() {
        // Arrange
        LocalDateTime readAt = LocalDateTime.now();

        // Act
        messageRepository.markAllMessagesAsReadInConversation(conversation.getId(), sender1, readAt);
        entityManager.flush();
        entityManager.clear();

        // Assert
        List<Message> allMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId(), PageRequest.of(0, 10)).getContent();

        // Messages from sender2 should now be read
        assertTrue(allMessages.stream()
                .filter(msg -> msg.getSender().getId().equals(sender2.getId()))
                .allMatch(Message::isRead));

        // Messages from sender1 should remain unchanged
        assertTrue(allMessages.stream()
                .filter(msg -> msg.getSender().getId().equals(sender1.getId()))
                .anyMatch(msg -> !msg.isRead()));
    }

    @Test
    @DisplayName("Should find messages created after a specific time")
    void shouldFindMessagesCreatedAfterSpecificTime() {
        // Arrange
        // Since @CreationTimestamp overrides our manual timestamps, we need to work with actual timestamps
        // Set afterTime to be between message2 and message3 (since they're created sequentially in setUp)
        LocalDateTime afterTime = message2.getCreatedAt().plusNanos(1); // Just after message2

        // Act
        List<Message> recentMessages = messageRepository.findByConversationIdAndCreatedAtAfterOrderByCreatedAtAsc(conversation.getId(), afterTime);

        // Assert
        assertEquals(2, recentMessages.size());
        assertTrue(recentMessages.stream().allMatch(msg -> msg.getCreatedAt().isAfter(afterTime)));

        // Should be ordered by createdAt ASC - since messages are created sequentially,
        // message3 and message4 should be after message2
        assertTrue(recentMessages.stream().anyMatch(msg -> msg.getId().equals(message3.getId())));
        assertTrue(recentMessages.stream().anyMatch(msg -> msg.getId().equals(message4.getId())));
    }

    @Test
    @DisplayName("Should handle pagination correctly")
    void shouldHandlePaginationCorrectly() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 2); // First page with 2 items

        // Act
        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId(), pageable);

        // Assert
        assertEquals(2, messages.getContent().size());
        assertEquals(4, messages.getTotalElements());
        assertEquals(2, messages.getTotalPages());
        assertTrue(messages.hasNext());
        assertFalse(messages.hasPrevious());
    }

    @Test
    @DisplayName("Should handle empty conversation")
    void shouldHandleEmptyConversation() {
        // Arrange
        User newUser = TestDataBuilder.createValidUser("newuser", "newuser@test.com");
        newUser = entityManager.persistAndFlush(newUser);

        // Create new listing with existing dependencies
        CarListing newListing = TestDataBuilder.createValidCarListing(newUser);
        newListing.setTitle("New Car");
        newListing.setModelYear(2021);
        newListing.setMileage(30000);
        newListing.setPrice(java.math.BigDecimal.valueOf(30000));
        newListing.setGovernorate(governorate); // Use the same governorate
        newListing.setModel(model); // Use the same model
        newListing = entityManager.persistAndFlush(newListing);

        Conversation newConversation = Conversation.builder()
                .listing(newListing)
                .buyer(newUser)
                .seller(sender1)
                .status(ConversationStatus.ACTIVE)
                .build();
        newConversation = entityManager.persistAndFlush(newConversation);

        // Act
        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(newConversation.getId(), PageRequest.of(0, 10));

        // Assert
        assertEquals(0, messages.getTotalElements());
        assertTrue(messages.getContent().isEmpty());
    }

    @Test
    @DisplayName("Should handle message types correctly")
    void shouldHandleMessageTypesCorrectly() {
        // Act
        List<Message> textMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId(), PageRequest.of(0, 10))
                .getContent()
                .stream()
                .filter(msg -> msg.getMessageType() == MessageType.TEXT)
                .toList();

        List<Message> imageMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId(), PageRequest.of(0, 10))
                .getContent()
                .stream()
                .filter(msg -> msg.getMessageType() == MessageType.IMAGE)
                .toList();

        // Assert
        assertEquals(3, textMessages.size());
        assertEquals(1, imageMessages.size());
        assertEquals(message4.getId(), imageMessages.get(0).getId());
    }
}
