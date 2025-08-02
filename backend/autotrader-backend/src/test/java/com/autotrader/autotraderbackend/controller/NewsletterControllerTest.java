package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.NewsletterSubscription;
import com.autotrader.autotraderbackend.payload.NewsletterSubscriptionRequest;
import com.autotrader.autotraderbackend.repository.NewsletterSubscriptionRepository;
import com.autotrader.autotraderbackend.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for NewsletterController.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NewsletterControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NewsletterSubscriptionRepository newsletterRepository;

    @MockBean
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        newsletterRepository.deleteAll();
        
        // Mock email service to avoid actual email sending during tests
        doNothing().when(emailService).sendTemplatedEmail(anyString(), anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Should successfully subscribe with valid email and English language")
    void subscribe_WithValidEmailAndEnglishLanguage_ShouldReturnSuccess() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("test@example.com");
        request.setPreferredLanguage("en");
        request.setSource("homepage");

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.alreadySubscribed").value(false))
                .andExpect(jsonPath("$.requiresConfirmation").value(true))
                .andExpect(jsonPath("$.message").isNotEmpty());

        // Verify subscription was saved to database
        Optional<NewsletterSubscription> subscription = newsletterRepository.findByEmail("test@example.com");
        assertTrue(subscription.isPresent());
        assertEquals("en", subscription.get().getPreferredLanguage());
        assertEquals("homepage", subscription.get().getSubscriptionSource());
        assertNotNull(subscription.get().getConfirmationToken());
        assertNotNull(subscription.get().getUnsubscribeToken());
        assertNull(subscription.get().getConfirmedAt());
    }

    @Test
    @DisplayName("Should successfully subscribe with valid email and Arabic language")
    void subscribe_WithValidEmailAndArabicLanguage_ShouldReturnSuccess() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("test@example.com");
        request.setPreferredLanguage("ar");
        request.setSource("homepage");

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.email").value("test@example.com"));

        // Verify subscription language
        Optional<NewsletterSubscription> subscription = newsletterRepository.findByEmail("test@example.com");
        assertTrue(subscription.isPresent());
        assertEquals("ar", subscription.get().getPreferredLanguage());
    }

    @Test
    @DisplayName("Should return validation error for invalid email format")
    void subscribe_WithInvalidEmailFormat_ShouldReturnValidationError() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("invalid-email");
        request.setPreferredLanguage("en");

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.email").value("Email must be valid"));
    }

    @Test
    @DisplayName("Should return validation error for missing email")
    void subscribe_WithMissingEmail_ShouldReturnValidationError() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setPreferredLanguage("en");

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.email").value("Email is required"));
    }

    @Test
    @DisplayName("Should return validation error for empty email")
    void subscribe_WithEmptyEmail_ShouldReturnValidationError() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("");
        request.setPreferredLanguage("en");

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.email").value("Email is required"));
    }

    @Test
    @DisplayName("Should handle duplicate subscription gracefully")
    void subscribe_WithDuplicateEmail_ShouldHandleGracefully() throws Exception {
        // First subscription
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("duplicate@example.com");
        request.setPreferredLanguage("en");

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Second subscription with same email
        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.email").value("duplicate@example.com"))
                .andExpect(jsonPath("$.alreadySubscribed").value(false)) // Service regenerates tokens
                .andExpect(jsonPath("$.requiresConfirmation").value(true));
    }

    @Test
    @DisplayName("Should confirm subscription successfully with valid token")
    void confirmSubscription_WithValidToken_ShouldReturnSuccessPage() throws Exception {
        // Create a subscription with confirmation token
        NewsletterSubscription subscription = new NewsletterSubscription();
        subscription.setEmail("confirm@example.com");
        subscription.setPreferredLanguage("en");
        subscription.setConfirmationToken(UUID.randomUUID().toString());
        subscription.setUnsubscribeToken(UUID.randomUUID().toString());
        subscription.setActive(true);
        newsletterRepository.save(subscription);

        mockMvc.perform(get("/api/public/newsletter/confirm")
                .param("token", subscription.getConfirmationToken()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/plain;charset=UTF-8"))
                .andExpect(content().string(containsString("Subscription Confirmed!")))
                .andExpect(content().string(containsString("Caryo")));

        // Verify subscription was confirmed
        Optional<NewsletterSubscription> updated = newsletterRepository.findByEmail("confirm@example.com");
        assertTrue(updated.isPresent());
        assertNotNull(updated.get().getConfirmedAt());
        assertNull(updated.get().getConfirmationToken()); // Token should be cleared
    }

    @Test
    @DisplayName("Should return error page for invalid confirmation token")
    void confirmSubscription_WithInvalidToken_ShouldReturnErrorPage() throws Exception {
        String invalidToken = UUID.randomUUID().toString();

        mockMvc.perform(get("/api/public/newsletter/confirm")
                .param("token", invalidToken))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType("text/plain;charset=UTF-8"))
                .andExpect(content().string(containsString("Invalid or Expired Token")))
                .andExpect(content().string(containsString("❌")));
    }

    @Test
    @DisplayName("Should unsubscribe successfully with valid token")
    void unsubscribe_WithValidToken_ShouldReturnSuccessPage() throws Exception {
        // Create a confirmed subscription
        NewsletterSubscription subscription = new NewsletterSubscription();
        subscription.setEmail("unsubscribe@example.com");
        subscription.setPreferredLanguage("en");
        subscription.setConfirmationToken(null);
        subscription.setConfirmedAt(LocalDateTime.now());
        subscription.setUnsubscribeToken(UUID.randomUUID().toString());
        subscription.setActive(true);
        newsletterRepository.save(subscription);

        mockMvc.perform(get("/api/public/newsletter/unsubscribe")
                .param("token", subscription.getUnsubscribeToken()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/plain;charset=UTF-8"))
                .andExpect(content().string(containsString("Successfully Unsubscribed")))
                .andExpect(content().string(containsString("📧")));

        // Verify subscription was marked as unsubscribed
        Optional<NewsletterSubscription> updated = newsletterRepository.findByEmail("unsubscribe@example.com");
        assertTrue(updated.isPresent());
        assertNotNull(updated.get().getUnsubscribedAt());
        assertFalse(updated.get().isActiveSubscription());
    }

    @Test
    @DisplayName("Should return error page for invalid unsubscribe token")
    void unsubscribe_WithInvalidToken_ShouldReturnErrorPage() throws Exception {
        String invalidToken = UUID.randomUUID().toString();

        mockMvc.perform(get("/api/public/newsletter/unsubscribe")
                .param("token", invalidToken))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Invalid or Expired Token")));
    }

    @Test
    @DisplayName("Should use default language when not specified")
    void subscribe_WithoutLanguage_ShouldUseDefaultLanguage() throws Exception {
    }

    @Test
    @DisplayName("Should return newsletter statistics")
    @org.springframework.security.test.context.support.WithMockUser(roles = "ADMIN")
    void getStats_ShouldReturnCorrectStatistics() throws Exception {
        // Create test subscriptions
        NewsletterSubscription activeSubscription = new NewsletterSubscription();
        activeSubscription.setEmail("active@example.com");
        activeSubscription.setPreferredLanguage("en");
        activeSubscription.setActive(true);
        activeSubscription.setConfirmedAt(LocalDateTime.now());
        newsletterRepository.save(activeSubscription);

        NewsletterSubscription inactiveSubscription = new NewsletterSubscription();
        inactiveSubscription.setEmail("inactive@example.com");
        inactiveSubscription.setPreferredLanguage("en");
        // Verify default language was used
        Optional<NewsletterSubscription> subscription = newsletterRepository.findByEmail("default@example.com");
        assertTrue(subscription.isPresent());
        assertEquals("en", subscription.get().getPreferredLanguage()); // Default should be 'en'
    }

    @Test
    @DisplayName("Should use default source when not specified")
    void subscribe_WithoutSource_ShouldUseDefaultSource() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("source@example.com");
        request.setPreferredLanguage("en");
        // No source specified

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Verify default source was used
        Optional<NewsletterSubscription> subscription = newsletterRepository.findByEmail("source@example.com");
        assertTrue(subscription.isPresent());
        assertEquals("homepage", subscription.get().getSubscriptionSource()); // Default should be 'homepage'
    }
}
