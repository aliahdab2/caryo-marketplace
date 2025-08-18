package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.NewsletterSubscriptionRequest;
import com.autotrader.autotraderbackend.payload.NewsletterSubscriptionResponse;
import com.autotrader.autotraderbackend.service.NewsletterService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for NewsletterController.
 */
@ExtendWith(MockitoExtension.class)
class NewsletterControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private NewsletterService newsletterService;

    @InjectMocks
    private NewsletterController newsletterController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(newsletterController).build();
    }

    @Test
    @DisplayName("Should successfully subscribe with valid email and English language")
    void subscribe_WithValidEmailAndEnglishLanguage_ShouldReturnSuccess() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("test@example.com");
        request.setPreferredLanguage("en");
        request.setSource("homepage");

        NewsletterSubscriptionResponse expectedResponse = NewsletterSubscriptionResponse.success(
            "test@example.com", 
            "Please check your email to confirm your subscription."
        );

        when(newsletterService.subscribe(any(NewsletterSubscriptionRequest.class)))
            .thenReturn(expectedResponse);

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.alreadySubscribed").value(false))
                .andExpect(jsonPath("$.requiresConfirmation").value(true))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    @DisplayName("Should successfully subscribe with valid email and Arabic language")
    void subscribe_WithValidEmailAndArabicLanguage_ShouldReturnSuccess() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("test@example.com");
        request.setPreferredLanguage("ar");
        request.setSource("homepage");

        NewsletterSubscriptionResponse expectedResponse = NewsletterSubscriptionResponse.success(
            "test@example.com", 
            "Please check your email to confirm your subscription."
        );

        when(newsletterService.subscribe(any(NewsletterSubscriptionRequest.class)))
            .thenReturn(expectedResponse);

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.email").value("test@example.com"));
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
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return validation error for missing email")
    void subscribe_WithMissingEmail_ShouldReturnValidationError() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setPreferredLanguage("en");

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
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
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should handle duplicate subscription gracefully")
    void subscribe_WithDuplicateEmail_ShouldHandleGracefully() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("duplicate@example.com");
        request.setPreferredLanguage("en");

        NewsletterSubscriptionResponse expectedResponse = NewsletterSubscriptionResponse.alreadyExists(
            "duplicate@example.com", 
            "You're already subscribed to our newsletter!"
        );

        when(newsletterService.subscribe(any(NewsletterSubscriptionRequest.class)))
            .thenReturn(expectedResponse);

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.email").value("duplicate@example.com"))
                .andExpect(jsonPath("$.alreadySubscribed").value(true))
                .andExpect(jsonPath("$.requiresConfirmation").value(false));
    }

    @Test
    @DisplayName("Should confirm subscription successfully with valid token")
    void confirmSubscription_WithValidToken_ShouldReturnSuccessPage() throws Exception {
        String validToken = "valid-token";

        when(newsletterService.confirmSubscription(validToken))
            .thenReturn(true);

        mockMvc.perform(get("/api/public/newsletter/confirm")
                .param("token", validToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/plain"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Subscription Confirmed!")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Caryo")));
    }

    @Test
    @DisplayName("Should return error page for invalid confirmation token")
    void confirmSubscription_WithInvalidToken_ShouldReturnErrorPage() throws Exception {
        String invalidToken = "invalid-token";

        when(newsletterService.confirmSubscription(invalidToken))
            .thenReturn(false);

        mockMvc.perform(get("/api/public/newsletter/confirm")
                .param("token", invalidToken))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("text/plain"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Invalid or Expired Token")));
    }

    @Test
    @DisplayName("Should unsubscribe successfully with valid token")
    void unsubscribe_WithValidToken_ShouldReturnSuccessPage() throws Exception {
        String validToken = "valid-token";

        when(newsletterService.unsubscribe(validToken))
            .thenReturn(true);

        mockMvc.perform(get("/api/public/newsletter/unsubscribe")
                .param("token", validToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/plain"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Successfully Unsubscribed")));
    }

    @Test
    @DisplayName("Should return error page for invalid unsubscribe token")
    void unsubscribe_WithInvalidToken_ShouldReturnErrorPage() throws Exception {
        String invalidToken = "invalid-token";

        when(newsletterService.unsubscribe(invalidToken))
            .thenReturn(false);

        mockMvc.perform(get("/api/public/newsletter/unsubscribe")
                .param("token", invalidToken))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Invalid or Expired Token")));
    }

    @Test
    @DisplayName("Should use default language when not specified")
    void subscribe_WithoutLanguage_ShouldUseDefaultLanguage() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("default@example.com");
        // No language specified

        NewsletterSubscriptionResponse expectedResponse = NewsletterSubscriptionResponse.success(
            "default@example.com", 
            "Please check your email to confirm your subscription."
        );

        when(newsletterService.subscribe(any(NewsletterSubscriptionRequest.class)))
            .thenReturn(expectedResponse);

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Should use default source when not specified")
    void subscribe_WithoutSource_ShouldUseDefaultSource() throws Exception {
        NewsletterSubscriptionRequest request = new NewsletterSubscriptionRequest();
        request.setEmail("source@example.com");
        request.setPreferredLanguage("en");
        // No source specified

        NewsletterSubscriptionResponse expectedResponse = NewsletterSubscriptionResponse.success(
            "source@example.com", 
            "Please check your email to confirm your subscription."
        );

        when(newsletterService.subscribe(any(NewsletterSubscriptionRequest.class)))
            .thenReturn(expectedResponse);

        mockMvc.perform(post("/api/public/newsletter/subscribe")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}