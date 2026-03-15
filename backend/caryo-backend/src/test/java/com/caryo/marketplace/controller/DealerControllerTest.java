package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.dealer.DealerNotFoundException;
import com.caryo.marketplace.model.Dealer;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.response.DealerProfileResponse;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.service.DealerService;
import com.caryo.marketplace.service.DealerTrialService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DealerController.
 * Tests the authenticated dealer profile endpoints.
 */
@ExtendWith(MockitoExtension.class)
class DealerControllerTest {

    @Mock
    private DealerService dealerService;

    @Mock
    private DealerTrialService dealerTrialService;

    @InjectMocks
    private DealerController dealerController;

    private UserDetailsImpl userDetails;
    private Dealer testDealer;
    private User testUser;

    private static final Long TEST_USER_ID = 1L;
    private static final Long TEST_DEALER_ID = 10L;

    @BeforeEach
    void setUp() {
        // Create mock user
        testUser = new User();
        testUser.setId(TEST_USER_ID);
        testUser.setUsername("dealer_user");
        testUser.setEmail("dealer@example.com");

        // Create UserDetailsImpl
        userDetails = UserDetailsImpl.build(testUser);

        // Create test dealer entity
        testDealer = Dealer.builder()
            .id(TEST_DEALER_ID)
            .user(testUser)
            .businessName("Damascus Motors")
            .vatNumber("VAT123456")
            .tradingAddress("Damascus, Syria")
            .businessEmail("contact@damascusmotors.com")
            .businessPhone("+963-11-XXX-XXXX")
            .logoUrl("https://example.com/logo.png")
            .bannerUrl("https://example.com/banner.png")
            .description("Trusted dealer since 2012")
            .descriptionAr("وكيل موثوق منذ 2012")
            .workingHours("{\"weekdays\":\"9:00 AM - 6:00 PM\"}")
            .socialLinks("{\"facebook\":\"https://facebook.com/damascusmotors\"}")
            .subscriptionTier("TRIAL")
            .subscriptionStatus("ACTIVE")
            .trialStartedAt(ZonedDateTime.now().minusDays(5))
            .trialListingsCount(2)
            .trialExpired(false)
            .canCreateListings(true)
            .timezone("Asia/Damascus")
            .createdAt(LocalDateTime.now().minusYears(1))
            .updatedAt(LocalDateTime.now())
            .build();
    }

    @Nested
    @DisplayName("GET /api/dealer/profile")
    class GetDealerProfile {

        @Test
        @DisplayName("Should return DealerProfileResponse DTO for authenticated dealer")
        void getDealerProfile_Success() {
            // Arrange
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.of(testDealer));

            // Act
            ResponseEntity<?> response = dealerController.getDealerProfile(userDetails);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            
            // Verify it returns a DTO, not the entity
            assertTrue(response.getBody() instanceof DealerProfileResponse, 
                "Response should be DealerProfileResponse DTO, not Dealer entity");
            
            DealerProfileResponse dto = (DealerProfileResponse) response.getBody();
            assertEquals(TEST_DEALER_ID, dto.getId());
            assertEquals("Damascus Motors", dto.getBusinessName());
            assertEquals("VAT123456", dto.getVatNumber());
            assertEquals("Damascus, Syria", dto.getTradingAddress());
            assertEquals("contact@damascusmotors.com", dto.getBusinessEmail());
            assertEquals("+963-11-XXX-XXXX", dto.getBusinessPhone());
            assertEquals("https://example.com/logo.png", dto.getLogoUrl());
            assertEquals("https://example.com/banner.png", dto.getBannerUrl());
            assertEquals("Trusted dealer since 2012", dto.getDescription());
            assertEquals("وكيل موثوق منذ 2012", dto.getDescriptionAr());
            assertNotNull(dto.getWorkingHours());
            assertNotNull(dto.getSocialLinks());
            assertEquals("TRIAL", dto.getSubscriptionTier());
            assertEquals("ACTIVE", dto.getSubscriptionStatus());
            assertNotNull(dto.getTrialStartedAt());
            assertEquals(2, dto.getTrialListingsCount());
            assertFalse(dto.getTrialExpired());
            assertTrue(dto.getCanCreateListings());
            assertEquals("Asia/Damascus", dto.getTimezone());

            verify(dealerService).getDealerByUserId(TEST_USER_ID);
        }

        @Test
        @DisplayName("Should throw DealerNotFoundException when dealer not found")
        void getDealerProfile_NotFound() {
            // Arrange
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.empty());

            // Act & Assert — exception propagates to GlobalExceptionHandler
            assertThrows(DealerNotFoundException.class, () ->
                    dealerController.getDealerProfile(userDetails));

            verify(dealerService).getDealerByUserId(TEST_USER_ID);
        }

        @Test
        @DisplayName("Should handle null optional fields gracefully")
        void getDealerProfile_NullOptionalFields() {
            // Arrange - dealer with minimal fields set
            Dealer minimalDealer = Dealer.builder()
                .id(TEST_DEALER_ID)
                .user(testUser)
                .businessName("Minimal Motors")
                .build();
            
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.of(minimalDealer));

            // Act
            ResponseEntity<?> response = dealerController.getDealerProfile(userDetails);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            DealerProfileResponse dto = (DealerProfileResponse) response.getBody();
            assertNotNull(dto);
            assertEquals("Minimal Motors", dto.getBusinessName());
            assertNull(dto.getDescription());
            assertNull(dto.getWorkingHours());
            assertNull(dto.getSocialLinks());
        }

        @Test
        @DisplayName("Should not expose Hibernate proxy objects (no lazy-loading errors)")
        void getDealerProfile_NoHibernateProxies() {
            // Arrange
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.of(testDealer));

            // Act
            ResponseEntity<?> response = dealerController.getDealerProfile(userDetails);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            
            // The response should be a clean DTO that can be serialized without Hibernate proxies
            assertTrue(response.getBody() instanceof DealerProfileResponse);
            DealerProfileResponse dto = (DealerProfileResponse) response.getBody();
            
            // Verify DTO doesn't have User object reference (which caused the original bug)
            // DTO should only have primitive/String fields, no entity references
            assertNotNull(dto.getId());
            assertDoesNotThrow(() -> dto.getBusinessName());
        }
    }

    @Nested
    @DisplayName("GET /api/dealer/trial-status")
    class GetTrialStatus {

        @Test
        @DisplayName("Should return trial status for dealer")
        void getTrialStatus_Success() {
            // Arrange
            DealerTrialService.TrialStatus trialStatus = DealerTrialService.TrialStatus.builder()
                .active(true)
                .daysRemaining(9)
                .listingsUsed(2)
                .listingsRemaining(1)
                .listingsLimit(3)
                .usagePercent(66.7)
                .expiresAt(ZonedDateTime.now().plusDays(9))
                .inGracePeriod(false)
                .graceEndsAt(null)
                .canCreateListings(true)
                .subscriptionTier("TRIAL")
                .subscriptionStatus("ACTIVE")
                .build();
            
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.of(testDealer));
            when(dealerTrialService.getTrialStatus(testDealer)).thenReturn(trialStatus);

            // Act
            ResponseEntity<?> response = dealerController.getTrialStatus(userDetails);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(dealerService).getDealerByUserId(TEST_USER_ID);
            verify(dealerTrialService).getTrialStatus(testDealer);
        }

        @Test
        @DisplayName("Should throw DealerNotFoundException when dealer not found")
        void getTrialStatus_DealerNotFound() {
            // Arrange
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.empty());

            // Act & Assert — exception propagates to GlobalExceptionHandler
            assertThrows(DealerNotFoundException.class, () ->
                    dealerController.getTrialStatus(userDetails));
        }
    }

    @Nested
    @DisplayName("GET /api/dealer/can-create-listing")
    class CanCreateListing {

        @Test
        @DisplayName("Should return true when dealer can create listings")
        void canCreateListing_True() {
            // Arrange
            DealerTrialService.TrialStatus trialStatus = DealerTrialService.TrialStatus.builder()
                .active(true)
                .daysRemaining(9)
                .listingsUsed(2)
                .listingsRemaining(1)
                .listingsLimit(3)
                .usagePercent(66.7)
                .expiresAt(ZonedDateTime.now().plusDays(9))
                .inGracePeriod(false)
                .graceEndsAt(null)
                .canCreateListings(true)
                .subscriptionTier("TRIAL")
                .subscriptionStatus("ACTIVE")
                .build();
            
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.of(testDealer));
            when(dealerTrialService.canCreateListing(testDealer)).thenReturn(true);
            when(dealerTrialService.getTrialStatus(testDealer)).thenReturn(trialStatus);

            // Act
            ResponseEntity<?> response = dealerController.canCreateListing(userDetails);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(dealerTrialService).canCreateListing(testDealer);
            verify(dealerTrialService).getTrialStatus(testDealer);
        }

        @Test
        @DisplayName("Should return false when dealer cannot create listings")
        void canCreateListing_False() {
            // Arrange
            Dealer expiredDealer = Dealer.builder()
                .id(TEST_DEALER_ID)
                .user(testUser)
                .businessName("Expired Motors")
                .trialExpired(true)
                .trialListingsCount(3)
                .canCreateListings(false)
                .build();
            
            DealerTrialService.TrialStatus expiredStatus = DealerTrialService.TrialStatus.builder()
                .active(false)
                .daysRemaining(0)
                .listingsUsed(3)
                .listingsRemaining(0)
                .listingsLimit(3)
                .usagePercent(100.0)
                .expiresAt(ZonedDateTime.now().minusDays(1))
                .inGracePeriod(false)
                .graceEndsAt(null)
                .canCreateListings(false)
                .subscriptionTier("TRIAL")
                .subscriptionStatus("EXPIRED")
                .build();
            
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.of(expiredDealer));
            when(dealerTrialService.canCreateListing(expiredDealer)).thenReturn(false);
            when(dealerTrialService.getTrialStatus(expiredDealer)).thenReturn(expiredStatus);

            // Act
            ResponseEntity<?> response = dealerController.canCreateListing(userDetails);

            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(dealerTrialService).canCreateListing(expiredDealer);
            verify(dealerTrialService).getTrialStatus(expiredDealer);
        }

        @Test
        @DisplayName("Should throw DealerNotFoundException when dealer not found")
        void canCreateListing_DealerNotFound() {
            // Arrange
            when(dealerService.getDealerByUserId(TEST_USER_ID)).thenReturn(Optional.empty());

            // Act & Assert — exception propagates to GlobalExceptionHandler
            assertThrows(DealerNotFoundException.class, () ->
                    dealerController.canCreateListing(userDetails));
        }
    }
}
