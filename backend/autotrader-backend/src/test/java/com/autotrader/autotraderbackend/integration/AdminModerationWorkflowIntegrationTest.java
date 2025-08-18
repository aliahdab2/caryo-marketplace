package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.repository.*;
import com.autotrader.autotraderbackend.service.ListingModerationService;
import com.autotrader.autotraderbackend.util.TestDataGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.AutoConfigureTestEntityManager;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebMvc
@AutoConfigureTestEntityManager
@ActiveProfiles("test")
@Transactional
class AdminModerationWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private ListingModerationActionRepository moderationActionRepository;

    @Autowired
    private ListingModerationService listingModerationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CarBrandRepository carBrandRepository;

    @Autowired
    private CarModelRepository carModelRepository;

    @Autowired
    private GovernorateRepository governorateRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private CarListing testListing;
    private User testUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = TestDataGenerator.createTestUser("testuser", "password");
        testUser = userRepository.save(testUser);

        // Create admin user
        adminUser = TestDataGenerator.createTestAdminUser("admin", "password");
        adminUser = userRepository.save(adminUser);

        // Create test brand and model
        CarBrand brand = TestDataGenerator.createTestCarBrand();
        brand = carBrandRepository.save(brand);

        CarModel model = TestDataGenerator.createTestCarModel(brand);
        model = carModelRepository.save(model);

        // Create test governorate
        Governorate governorate = TestDataGenerator.createTestGovernorate("SY");
        governorate = governorateRepository.save(governorate);

        // Create test listing
        testListing = TestDataGenerator.createTestListing(testUser, model, governorate);
        testListing.setApproved(true); // Make it approved for testing
        testListing = carListingRepository.save(testListing);
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void completeAdminWorkflow_ShouldCreateProperAuditTrail() throws Exception {
        Long listingId = testListing.getId();

        // Step 1: Hide the listing
        Map<String, String> hideData = new HashMap<>();
        hideData.put("reason", "Inappropriate content detected");

        mockMvc.perform(put("/api/admin/listings/" + listingId + "/hide")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(hideData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Listing hidden successfully"));

        // Verify hide action was created
        assertTrue(listingModerationService.isListingHiddenByAdmin(listingId));
        assertEquals("HIDDEN", listingModerationService.getListingStatus(listingId));

        // Step 2: Unhide the listing
        mockMvc.perform(put("/api/admin/listings/" + listingId + "/unhide")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Listing unhidden successfully"));

        // Verify unhide action was created
        assertFalse(listingModerationService.isListingHiddenByAdmin(listingId));
        assertEquals("ACTIVE", listingModerationService.getListingStatus(listingId));

        // Step 3: Verify audit trail
        List<ListingModerationAction> history = listingModerationService.getModerationHistory(listingId);
        assertEquals(2, history.size());

        // Latest action should be UNHIDE
        ListingModerationAction latestAction = history.get(0);
        assertEquals("UNHIDE", latestAction.getActionType());
        assertEquals("admin@example.com", latestAction.getPerformedBy());
        assertTrue(latestAction.getIsActive());

        // Previous action should be HIDE (now inactive)
        ListingModerationAction hideAction = history.get(1);
        assertEquals("HIDE", hideAction.getActionType());
        assertEquals("Inappropriate content detected", hideAction.getReason());
        assertEquals("admin@example.com", hideAction.getPerformedBy());
        assertFalse(hideAction.getIsActive()); // Should be deactivated
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void hideAlreadyHiddenListing_ShouldCreateNewHideAction() throws Exception {
        Long listingId = testListing.getId();

        // Hide the listing first time
        Map<String, String> hideData1 = new HashMap<>();
        hideData1.put("reason", "First hide reason");

        mockMvc.perform(put("/api/admin/listings/" + listingId + "/hide")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(hideData1)))
                .andExpect(status().isOk());

        // Hide the listing second time with different reason
        Map<String, String> hideData2 = new HashMap<>();
        hideData2.put("reason", "Second hide reason");

        mockMvc.perform(put("/api/admin/listings/" + listingId + "/hide")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(hideData2)))
                .andExpect(status().isOk());

        // Verify both actions exist but only latest is active
        List<ListingModerationAction> history = listingModerationService.getModerationHistory(listingId);
        assertEquals(2, history.size());

        // Latest hide action should be active
        ListingModerationAction latestHide = history.get(0);
        assertEquals("HIDE", latestHide.getActionType());
        assertEquals("Second hide reason", latestHide.getReason());
        assertTrue(latestHide.getIsActive());

        // Previous hide action should be inactive
        ListingModerationAction previousHide = history.get(1);
        assertEquals("HIDE", previousHide.getActionType());
        assertEquals("First hide reason", previousHide.getReason());
        assertFalse(previousHide.getIsActive());

        // Listing should still be hidden
        assertTrue(listingModerationService.isListingHiddenByAdmin(listingId));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    void hideListingAsRegularUser_ShouldReturnForbidden() throws Exception {
        Long listingId = testListing.getId();

        Map<String, String> hideData = new HashMap<>();
        hideData.put("reason", "Should not work");

        mockMvc.perform(put("/api/admin/listings/" + listingId + "/hide")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(hideData)))
                .andExpect(status().isForbidden());

        // Verify no moderation action was created
        List<ListingModerationAction> history = listingModerationService.getModerationHistory(listingId);
        assertEquals(0, history.size());
        assertFalse(listingModerationService.isListingHiddenByAdmin(listingId));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void unhideNonHiddenListing_ShouldStillWork() throws Exception {
        Long listingId = testListing.getId();

        // Verify listing is not hidden initially
        assertFalse(listingModerationService.isListingHiddenByAdmin(listingId));

        // Try to unhide non-hidden listing
        mockMvc.perform(put("/api/admin/listings/" + listingId + "/unhide")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Listing unhidden successfully"));

        // Verify unhide action was still created (for audit purposes)
        List<ListingModerationAction> history = listingModerationService.getModerationHistory(listingId);
        assertEquals(1, history.size());
        assertEquals("UNHIDE", history.get(0).getActionType());
    }

    @Test
    void publicListingAccess_WhenHidden_ShouldReturnNotFound() throws Exception {
        Long listingId = testListing.getId();

        // First, verify listing is accessible
        mockMvc.perform(get("/api/listings/" + listingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listingId));

        // Hide the listing as admin
        listingModerationService.hideListingAsAdmin(testListing.getId(), "Test hide", "admin");

        // Now public access should return 404
        mockMvc.perform(get("/api/listings/" + listingId))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void performanceTest_MultipleActionsOnSameListing() throws Exception {
        Long listingId = testListing.getId();

        // Perform multiple actions rapidly
        for (int i = 0; i < 5; i++) {
            // Hide
            Map<String, String> hideData = new HashMap<>();
            hideData.put("reason", "Hide reason " + i);

            mockMvc.perform(put("/api/admin/listings/" + listingId + "/hide")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(hideData)))
                    .andExpect(status().isOk());

            // Unhide
            mockMvc.perform(put("/api/admin/listings/" + listingId + "/unhide")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        // Verify all actions are recorded
        List<ListingModerationAction> history = listingModerationService.getModerationHistory(listingId);
        assertEquals(10, history.size()); // 5 hide + 5 unhide actions

        // Verify final state is unhidden
        assertFalse(listingModerationService.isListingHiddenByAdmin(listingId));
        assertEquals("ACTIVE", listingModerationService.getListingStatus(listingId));
    }
}
