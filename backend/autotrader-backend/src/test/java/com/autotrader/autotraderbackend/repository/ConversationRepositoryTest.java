package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.util.TestDataBuilder;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("ConversationRepository Tests")
class ConversationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ConversationRepository conversationRepository;

    private User buyer;
    private User seller;
    private CarListing listing;
    private Conversation conversation1;
    private Conversation conversation2;
    private Conversation conversation3;

    @BeforeEach
    void setUp() {
        // Create test users
        buyer = new User();
        buyer.setUsername("buyer");
        buyer.setEmail("buyer@test.com");
        buyer.setPassword("password");
        buyer = entityManager.persistAndFlush(buyer);

        seller = new User();
        seller.setUsername("seller");
        seller.setEmail("seller@test.com");
        seller.setPassword("password");
        seller = entityManager.persistAndFlush(seller);

        // Create and persist dependencies first
        Country country = TestDataBuilder.createTestCountry();
        country = entityManager.persistAndFlush(country);
        
        Governorate governorate = TestDataBuilder.createTestGovernorate();
        governorate.setCountry(country);
        governorate = entityManager.persistAndFlush(governorate);
        
        CarBrand brand = TestDataBuilder.createTestCarBrand();
        brand = entityManager.persistAndFlush(brand);
        
        CarModel model = TestDataBuilder.createTestCarModel();
        model.setBrand(brand);
        model = entityManager.persistAndFlush(model);

        // Create test listing using TestDataBuilder
        listing = TestDataBuilder.createValidCarListing(seller);
        listing.setGovernorate(governorate);
        listing.setModel(model);
        listing = entityManager.persistAndFlush(listing);

        // Create test conversations
        conversation1 = Conversation.builder()
                .listing(listing)
                .buyer(buyer)
                .seller(seller)
                .status(ConversationStatus.ACTIVE)
                .lastMessageAt(LocalDateTime.now().minusHours(2))
                .build();
        conversation1 = entityManager.persistAndFlush(conversation1);

        conversation2 = Conversation.builder()
                .listing(listing)
                .buyer(seller)
                .seller(buyer)
                .status(ConversationStatus.ACTIVE)
                .lastMessageAt(LocalDateTime.now().minusHours(1))
                .build();
        conversation2 = entityManager.persistAndFlush(conversation2);

        // Create a third user for the third conversation to avoid unique constraint violation
        User thirdUser = new User();
        thirdUser.setUsername("thirduser");
        thirdUser.setEmail("thirduser@test.com");
        thirdUser.setPassword("password");
        thirdUser = entityManager.persistAndFlush(thirdUser);

        conversation3 = Conversation.builder()
                .listing(listing)
                .buyer(thirdUser)
                .seller(seller)
                .status(ConversationStatus.ARCHIVED)
                .lastMessageAt(LocalDateTime.now().minusDays(1))
                .build();
        conversation3 = entityManager.persistAndFlush(conversation3);

        // Create conversation participants
        ConversationParticipant buyerParticipant1 = ConversationParticipant.builder()
                .conversation(conversation1)
                .user(buyer)
                .role(ParticipantRole.BUYER)
                .joinedAt(LocalDateTime.now().minusDays(1))
                .build();
        entityManager.persistAndFlush(buyerParticipant1);

        ConversationParticipant sellerParticipant1 = ConversationParticipant.builder()
                .conversation(conversation1)
                .user(seller)
                .role(ParticipantRole.SELLER)
                .joinedAt(LocalDateTime.now().minusDays(1))
                .build();
        entityManager.persistAndFlush(sellerParticipant1);

        entityManager.flush();
    }

    @Test
    @DisplayName("Should find conversations by user")
    void shouldFindConversationsByUser() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Conversation> buyerConversations = conversationRepository.findByUser(buyer, pageable);
        Page<Conversation> sellerConversations = conversationRepository.findByUser(seller, pageable);

        // Assert
        assertEquals(2, buyerConversations.getTotalElements());
        assertEquals(3, sellerConversations.getTotalElements());
        
        // Should be ordered by lastMessageAt DESC
        assertEquals(conversation2.getId(), buyerConversations.getContent().get(0).getId());
        assertEquals(conversation1.getId(), buyerConversations.getContent().get(1).getId());
    }

    @Test
    @DisplayName("Should find conversations where user is buyer")
    void shouldFindConversationsWhereUserIsBuyer() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Conversation> buyerConversations = conversationRepository.findByBuyerOrderByLastMessageAtDesc(buyer, pageable);

        // Assert
        assertEquals(1, buyerConversations.getTotalElements());
        assertTrue(buyerConversations.getContent().stream()
                .allMatch(conv -> conv.getBuyer().getId().equals(buyer.getId())));
    }

    @Test
    @DisplayName("Should find conversations where user is seller")
    void shouldFindConversationsWhereUserIsSeller() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Conversation> sellerConversations = conversationRepository.findBySellerOrderByLastMessageAtDesc(seller, pageable);

        // Assert
        assertEquals(2, sellerConversations.getTotalElements());
        assertTrue(sellerConversations.getContent().stream()
                .allMatch(conv -> conv.getSeller().getId().equals(seller.getId())));
    }

    @Test
    @DisplayName("Should find active conversations by user")
    void shouldFindActiveConversationsByUser() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Conversation> activeConversations = conversationRepository.findActiveConversationsByUser(buyer, ConversationStatus.ACTIVE, pageable);

        // Assert
        assertEquals(2, activeConversations.getTotalElements());
        assertTrue(activeConversations.getContent().stream()
                .allMatch(conv -> conv.getStatus() == ConversationStatus.ACTIVE));
    }

    @Test
    @DisplayName("Should find conversation by listing and participants")
    void shouldFindConversationByListingAndParticipants() {
        // Act
        Optional<Conversation> found = conversationRepository.findByListingIdAndBuyerIdAndSellerId(
                listing.getId(), buyer.getId(), seller.getId());

        // Assert
        assertTrue(found.isPresent());
        assertEquals(conversation1.getId(), found.get().getId());
    }

    @Test
    @DisplayName("Should check if conversation exists")
    void shouldCheckIfConversationExists() {
        // Act
        boolean exists = conversationRepository.existsByListingIdAndBuyerIdAndSellerId(
                listing.getId(), buyer.getId(), seller.getId());

        // Assert
        assertTrue(exists);
    }

    @Test
    @DisplayName("Should return false for non-existent conversation")
    void shouldReturnFalseForNonExistentConversation() {
        // Act
        boolean exists = conversationRepository.existsByListingIdAndBuyerIdAndSellerId(
                999L, buyer.getId(), seller.getId());

        // Assert
        assertFalse(exists);
    }

    @Test
    @DisplayName("Should find conversations by listing ID")
    void shouldFindConversationsByListingId() {
        // Act
        List<Conversation> conversations = conversationRepository.findByListingId(listing.getId());

        // Assert
        assertEquals(3, conversations.size());
        assertTrue(conversations.stream()
                .allMatch(conv -> conv.getListing().getId().equals(listing.getId())));
    }

    @Test
    @DisplayName("Should count active conversations by user")
    void shouldCountActiveConversationsByUser() {
        // Act
        long count = conversationRepository.countActiveConversationsByUser(buyer, ConversationStatus.ACTIVE);

        // Assert
        assertEquals(2, count);
    }

    @Test
    @DisplayName("Should handle pagination correctly")
    void shouldHandlePaginationCorrectly() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 2); // First page with 2 items

        // Act
        Page<Conversation> page = conversationRepository.findByUser(buyer, pageable);

        // Assert
        assertEquals(2, page.getContent().size());
        assertEquals(2, page.getTotalElements());
        assertEquals(1, page.getTotalPages());
        assertFalse(page.hasNext());
        assertFalse(page.hasPrevious());
    }

    @Test
    @DisplayName("Should handle second page correctly")
    void shouldHandleSecondPageCorrectly() {
        // Arrange
        Pageable pageable = PageRequest.of(1, 2); // Second page with 2 items

        // Act
        Page<Conversation> page = conversationRepository.findByUser(buyer, pageable);

        // Assert
        assertEquals(0, page.getContent().size());
        assertEquals(2, page.getTotalElements());
        assertEquals(1, page.getTotalPages());
        assertFalse(page.hasNext());
        assertTrue(page.hasPrevious());
    }

    @Test
    @DisplayName("Should return empty page when no conversations exist")
    void shouldReturnEmptyPageWhenNoConversationsExist() {
        // Arrange
        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setEmail("newuser@test.com");
        newUser.setPassword("password");
        newUser = entityManager.persistAndFlush(newUser);

        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Conversation> conversations = conversationRepository.findByUser(newUser, pageable);

        // Assert
        assertEquals(0, conversations.getTotalElements());
        assertTrue(conversations.getContent().isEmpty());
    }

    @Test
    @DisplayName("Should handle conversation status filtering")
    void shouldHandleConversationStatusFiltering() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Conversation> activeConversations = conversationRepository.findActiveConversationsByUser(buyer, ConversationStatus.ACTIVE, pageable);

        // Assert
        assertEquals(2, activeConversations.getTotalElements());
        assertTrue(activeConversations.getContent().stream()
                .allMatch(conv -> conv.getStatus() == ConversationStatus.ACTIVE));
    }

    @Test
    @DisplayName("Should maintain conversation order by last message time")
    void shouldMaintainConversationOrderByLastMessageTime() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);

        // Act
        Page<Conversation> conversations = conversationRepository.findByUser(buyer, pageable);

        // Assert
        List<Conversation> content = conversations.getContent();
        assertTrue(content.get(0).getLastMessageAt().isAfter(content.get(1).getLastMessageAt()) ||
                content.get(0).getLastMessageAt().equals(content.get(1).getLastMessageAt()));
    }
}
