package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.payload.request.CreateConversationRequest;
import com.autotrader.autotraderbackend.payload.request.SendMessageRequest;
import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import com.autotrader.autotraderbackend.payload.response.ConversationResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.ConversationRepository;
import com.autotrader.autotraderbackend.repository.MessageRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the messaging system.
 * Tests the complete flow from API endpoints to database persistence.
 */
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
public class MessagingSystemIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    private User buyer;
    private User seller;
    private CarListing listing;

    @BeforeEach
    void setUp() {
        // Clean up any existing data
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        carListingRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        buyer = createTestUser("buyer@test.com", "Buyer User");
        seller = createTestUser("seller@test.com", "Seller User");

        // Create test listing
        listing = createTestListing(seller);
    }

    @Test
    @WithMockUser(username = "buyer@test.com")
    void testCompleteMessagingFlow() throws Exception {
        // 1. Create conversation
        CreateConversationRequest createRequest = new CreateConversationRequest();
        createRequest.setListingId(listing.getId());
        createRequest.setInitialMessage("Hi, I'm interested in your car!");
        createRequest.setMessageType("TEXT");

        MvcResult createResult = mockMvc.perform(post("/api/conversations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
                .with(user(buyer.getEmail()).authorities(() -> "ROLE_USER"))
                .header("Accept-Language", "en"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Conversation created successfully"))
                .andExpect(jsonPath("$.data.id").exists())
                .andReturn();

        // Extract conversation ID from response
        String responseJson = createResult.getResponse().getContentAsString();
        ApiResponse<ConversationResponse> createResponse = objectMapper.readValue(responseJson, 
            new TypeReference<ApiResponse<ConversationResponse>>() {});
        Long conversationId = createResponse.getData().getId();

        // Verify conversation was created in database
        assertThat(conversationRepository.findById(conversationId)).isPresent();
        assertThat(messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, Pageable.unpaged()).getContent()).hasSize(1);

        // 2. Send additional message
        SendMessageRequest sendRequest = new SendMessageRequest();
        sendRequest.setContent("What's the best price you can offer?");
        sendRequest.setMessageType("TEXT");

        mockMvc.perform(post("/api/conversations/{id}/messages", conversationId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sendRequest))
                .with(user(buyer.getEmail()).authorities(() -> "ROLE_USER"))
                .header("Accept-Language", "en"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Message sent successfully"))
                .andExpect(jsonPath("$.data.content").value("What's the best price you can offer?"));

        // Verify message count increased
        assertThat(messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, Pageable.unpaged()).getContent()).hasSize(2);

        // 3. Get user's conversations
        mockMvc.perform(get("/api/conversations/my-conversations")
                .with(user(buyer.getEmail()).authorities(() -> "ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].id").value(conversationId));

        // 4. Get conversation messages
        mockMvc.perform(get("/api/conversations/{id}/messages", conversationId)
                .with(user(buyer.getEmail()).authorities(() -> "ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isNotEmpty());

        // 5. Archive conversation
        mockMvc.perform(patch("/api/conversations/{id}/archive", conversationId)
                .with(user(buyer.getEmail()).authorities(() -> "ROLE_USER"))
                .header("Accept-Language", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Conversation archived successfully"));

        // Verify conversation is archived
        Conversation archivedConversation = conversationRepository.findById(conversationId).orElseThrow();
        assertThat(archivedConversation.getStatus()).isEqualTo(ConversationStatus.ARCHIVED);

        // 6. Verify archived conversation doesn't appear in active conversations
        mockMvc.perform(get("/api/conversations/my-conversations")
                .with(user(buyer.getEmail()).authorities(() -> "ROLE_USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isEmpty()); // Should be empty since conversation is archived
    }

    @Test
    @WithMockUser(username = "buyer@test.com")
    void testInternationalizationSupport() throws Exception {
        // Test Arabic language support
        CreateConversationRequest createRequest = new CreateConversationRequest();
        createRequest.setListingId(listing.getId());
        createRequest.setInitialMessage("مرحبا، أنا مهتم بسيارتك!");
        createRequest.setMessageType("TEXT");

        mockMvc.perform(post("/api/conversations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
                .with(user(buyer.getEmail()).authorities(() -> "ROLE_USER"))
                .header("Accept-Language", "ar"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("تم إنشاء المحادثة بنجاح")) // Arabic message
                .andExpect(jsonPath("$.data.id").exists());
    }

    @Test
    @WithMockUser(username = "unauthorized@test.com")
    void testUnauthorizedAccess() throws Exception {
        // Create a conversation first
        Conversation conversation = createTestConversation();

        // Try to access conversation as unauthorized user
        mockMvc.perform(get("/api/conversations/{id}/messages", conversation.getId())
                .with(user("unauthorized@test.com").authorities(() -> "ROLE_USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "buyer@test.com")
    void testValidationErrors() throws Exception {
        // Test missing required fields
        CreateConversationRequest invalidRequest = new CreateConversationRequest();
        // Missing listingId and message

        mockMvc.perform(post("/api/conversations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest))
                .with(user(buyer.getEmail()).authorities(() -> "ROLE_USER")))
                .andExpect(status().isBadRequest());
    }

    // Helper methods

    private User createTestUser(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(email);
        user.setPassword("hashedPassword");
        
        // Create and save a basic role
        Role userRole = new Role("ROLE_USER");
        user.setRoles(Set.of(userRole));
        
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private CarListing createTestListing(User owner) {
        CarListing listing = new CarListing();
        listing.setTitle("Test Car 2020");
        listing.setDescription("A great test car");
        listing.setPrice(new BigDecimal("25000"));
        listing.setModelYear(2020);
        listing.setMileage(50000);
        listing.setTransmission("Automatic");
        listing.setExteriorColor("White");
        listing.setSeller(owner);
        listing.setApproved(true);
        listing.setSold(false);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setUpdatedAt(LocalDateTime.now());
        return carListingRepository.save(listing);
    }

    private Conversation createTestConversation() {
        Conversation conversation = new Conversation();
        conversation.setBuyer(buyer);
        conversation.setSeller(seller);
        conversation.setListing(listing);
        conversation.setStatus(ConversationStatus.ACTIVE);
        conversation.setCreatedAt(LocalDateTime.now());
        conversation.setLastMessageAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }
}
