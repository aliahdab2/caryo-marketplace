package com.caryo.marketplace.controller;

import com.caryo.marketplace.security.jwt.AuthTokenFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for PricingController
 * 
 * Tests the pricing API endpoint that exposes subscription tier pricing
 * from backend configuration (application.properties).
 */
@WebMvcTest(
    controllers = PricingController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = AuthTokenFilter.class)
)
@AutoConfigureMockMvc(addFilters = false)
@TestPropertySource(properties = {
    "subscription.basic.price=50",
    "subscription.basic.listing_limit=100",
    "subscription.advanced.price=100",
    "subscription.advanced.listing_limit=250",
    "subscription.professional.price=200",
    "subscription.professional.listing_limit=-1"
})
class PricingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getSubscriptionTiers_ShouldReturnAllTiers() throws Exception {
        mockMvc.perform(get("/api/v1/pricing/tiers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].id").exists())
                .andExpect(jsonPath("$.data[0].name").exists())
                .andExpect(jsonPath("$.data[0].price").exists())
                .andExpect(jsonPath("$.data[0].currency").exists())
                .andExpect(jsonPath("$.data[0].listingLimit").exists())
                .andExpect(jsonPath("$.data[0].features").isArray())
                .andExpect(jsonPath("$.message").value(containsString("retrieved successfully")));
    }

    @Test
    void getSubscriptionTiers_ShouldReturnBasicTierWithCorrectPrice() throws Exception {
        mockMvc.perform(get("/api/v1/pricing/tiers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == 'basic')]").exists())
                .andExpect(jsonPath("$.data[?(@.id == 'basic')].price").value(50))
                .andExpect(jsonPath("$.data[?(@.id == 'basic')].listingLimit").value(100))
                .andExpect(jsonPath("$.data[?(@.id == 'basic')].currency").value("USD"))
                .andExpect(jsonPath("$.data[?(@.id == 'basic')].features").isArray())
                .andExpect(jsonPath("$.data[?(@.id == 'basic')].features[0]").exists());
    }

    @Test
    void getSubscriptionTiers_ShouldReturnAdvancedTierWithCorrectPrice() throws Exception {
        mockMvc.perform(get("/api/v1/pricing/tiers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == 'advanced')]").exists())
                .andExpect(jsonPath("$.data[?(@.id == 'advanced')].price").value(100))
                .andExpect(jsonPath("$.data[?(@.id == 'advanced')].listingLimit").value(250))
                .andExpect(jsonPath("$.data[?(@.id == 'advanced')].currency").value("USD"))
                .andExpect(jsonPath("$.data[?(@.id == 'advanced')].recommended").value(true))
                .andExpect(jsonPath("$.data[?(@.id == 'advanced')].popular").value(true))
                .andExpect(jsonPath("$.data[?(@.id == 'advanced')].features").isArray())
                .andExpect(jsonPath("$.data[?(@.id == 'advanced')].features[0]").exists());
    }

    @Test
    void getSubscriptionTiers_ShouldReturnProfessionalTierWithCorrectPrice() throws Exception {
        mockMvc.perform(get("/api/v1/pricing/tiers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == 'professional')]").exists())
                .andExpect(jsonPath("$.data[?(@.id == 'professional')].price").value(200))
                .andExpect(jsonPath("$.data[?(@.id == 'professional')].listingLimit").value(-1))
                .andExpect(jsonPath("$.data[?(@.id == 'professional')].currency").value("USD"))
                .andExpect(jsonPath("$.data[?(@.id == 'professional')].features").isArray())
                // Use index 2 since professional is the 3rd tier (basic=0, advanced=1, professional=2)
                .andExpect(jsonPath("$.data[2].features").value(hasItem("featureUnlimitedListings")));
    }

    @Test
    void getSubscriptionTiers_ShouldReturnTiersInCorrectOrder() throws Exception {
        mockMvc.perform(get("/api/v1/pricing/tiers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value("basic"))
                .andExpect(jsonPath("$.data[1].id").value("advanced"))
                .andExpect(jsonPath("$.data[2].id").value("professional"));
    }

    @Test
    void getSubscriptionTiers_ShouldReturnApiResponseFormat() throws Exception {
        mockMvc.perform(get("/api/v1/pricing/tiers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").exists())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void getSubscriptionTiers_ShouldReturnTiersWithFeatures() throws Exception {
        mockMvc.perform(get("/api/v1/pricing/tiers")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].features[0]").exists())
                .andExpect(jsonPath("$.data[1].features[0]").exists())
                .andExpect(jsonPath("$.data[2].features[0]").exists());
    }
}
