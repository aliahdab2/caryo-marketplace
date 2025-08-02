package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.model.NewsletterSubscription;
import com.autotrader.autotraderbackend.repository.NewsletterSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AdminNewsletterController.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AdminNewsletterControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private NewsletterSubscriptionRepository newsletterRepository;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        newsletterRepository.deleteAll();
    }

    @Test
    @DisplayName("Should return newsletter statistics for admin")
    @WithMockUser(roles = "ADMIN")
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
        inactiveSubscription.setActive(false);
        newsletterRepository.save(inactiveSubscription);

        NewsletterSubscription unconfirmedSubscription = new NewsletterSubscription();
        unconfirmedSubscription.setEmail("unconfirmed@example.com");
        unconfirmedSubscription.setPreferredLanguage("en");
        unconfirmedSubscription.setActive(true);
        // No confirmedAt - still pending
        newsletterRepository.save(unconfirmedSubscription);

        mockMvc.perform(get("/api/admin/newsletter/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeSubscriptions").value(1)) // Only confirmed and active
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    @DisplayName("Should deny access to stats endpoint without admin role")
    @WithMockUser(roles = "USER")
    void getStats_ShouldDenyAccessWithoutAdminRole() throws Exception {
        mockMvc.perform(get("/api/admin/newsletter/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should deny access to stats endpoint without authentication")
    void getStats_ShouldDenyAccessWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/newsletter/stats"))
                .andExpect(status().isUnauthorized());
    }
}
