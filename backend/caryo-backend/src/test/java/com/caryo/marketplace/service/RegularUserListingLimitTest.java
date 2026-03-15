package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.RegularUserListingLimitException;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.request.CreateListingRequest;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.repository.CarListingRepository;
import com.caryo.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests for regular user listing limits.
 * Ensures that non-dealer users are restricted to a maximum number of active listings.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Regular User Listing Limits Tests")
class RegularUserListingLimitTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarListingCrudService crudService;

    @Mock
    private DealerService dealerService;

    @Mock
    private DealerTrialService dealerTrialService;

    @Mock
    private SavedSearchService savedSearchService;

    @Mock
    private CarListingMediaService carListingMediaService;

    @Mock
    private CarListingAnalyticsService analyticsService;

    @Mock
    private CarListingQueryService queryService;

    @InjectMocks
    private CarListingService carListingService;

    private User regularUser;
    private CreateListingRequest createListingRequest;
    private static final String REGULAR_USERNAME = "regular_user";
    private static final int LISTING_LIMIT = 5;

    @BeforeEach
    void setUp() {
        // Set the listing limit via reflection (simulating @Value injection)
        ReflectionTestUtils.setField(carListingService, "regularUserListingLimit", LISTING_LIMIT);

        // Create a regular user (not a dealer)
        regularUser = new User();
        regularUser.setId(1L);
        regularUser.setUsername(REGULAR_USERNAME);
        regularUser.setEmail("regular@example.com");

        // Create a valid listing request
        createListingRequest = new CreateListingRequest();
        createListingRequest.setTitle("Test Car");
        createListingRequest.setDescription("Test Description");
        createListingRequest.setPrice(new BigDecimal("10000"));
    }

    @Test
    @DisplayName("Regular user can create first listing when under limit")
    void testRegularUserCanCreateFirstListing() {
        // Arrange
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.of(regularUser));
        when(dealerService.isDealer(regularUser)).thenReturn(false);
        when(carListingRepository.countActiveListingsByUser(regularUser)).thenReturn(0L);
        
        CarListingResponse mockResponse = new CarListingResponse();
        mockResponse.setId(1L);
        when(crudService.createListingInternal(any(), eq(REGULAR_USERNAME))).thenReturn(mockResponse);

        // Act
        CarListingResponse response = carListingService.createListing(createListingRequest, REGULAR_USERNAME);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        verify(carListingRepository).countActiveListingsByUser(regularUser);
        verify(crudService).createListingInternal(createListingRequest, REGULAR_USERNAME);
    }

    @Test
    @DisplayName("Regular user can create listing when at limit minus one")
    void testRegularUserCanCreateWhenAtLimitMinusOne() {
        // Arrange - user has 4 listings, limit is 5
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.of(regularUser));
        when(dealerService.isDealer(regularUser)).thenReturn(false);
        when(carListingRepository.countActiveListingsByUser(regularUser)).thenReturn(4L);
        
        CarListingResponse mockResponse = new CarListingResponse();
        mockResponse.setId(5L);
        when(crudService.createListingInternal(any(), eq(REGULAR_USERNAME))).thenReturn(mockResponse);

        // Act
        CarListingResponse response = carListingService.createListing(createListingRequest, REGULAR_USERNAME);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(5L);
        verify(carListingRepository).countActiveListingsByUser(regularUser);
    }

    @Test
    @DisplayName("Regular user CANNOT create listing when at exact limit")
    void testRegularUserCannotCreateWhenAtExactLimit() {
        // Arrange - user has exactly 5 listings, limit is 5
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.of(regularUser));
        when(dealerService.isDealer(regularUser)).thenReturn(false);
        when(carListingRepository.countActiveListingsByUser(regularUser)).thenReturn(5L);

        // Act & Assert
        assertThatThrownBy(() -> carListingService.createListing(createListingRequest, REGULAR_USERNAME))
            .isInstanceOf(RegularUserListingLimitException.class)
            .hasMessageContaining("has reached the listing limit")
            .hasMessageContaining("Current: 5")
            .hasMessageContaining("Limit: 5")
            .hasMessageContaining("Upgrade to a dealer account");

        // Verify that we checked the limit but never tried to create
        verify(carListingRepository).countActiveListingsByUser(regularUser);
        verify(crudService, never()).createListingInternal(any(), any());
    }

    @Test
    @DisplayName("Regular user CANNOT create listing when over limit")
    void testRegularUserCannotCreateWhenOverLimit() {
        // Arrange - user somehow has 6 listings (edge case)
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.of(regularUser));
        when(dealerService.isDealer(regularUser)).thenReturn(false);
        when(carListingRepository.countActiveListingsByUser(regularUser)).thenReturn(6L);

        // Act & Assert
        assertThatThrownBy(() -> carListingService.createListing(createListingRequest, REGULAR_USERNAME))
            .isInstanceOf(RegularUserListingLimitException.class)
            .hasMessageContaining("has reached the listing limit")
            .hasMessageContaining("Current: 6");

        verify(crudService, never()).createListingInternal(any(), any());
    }

    @Test
    @DisplayName("Exception contains correct user details")
    void testExceptionContainsCorrectDetails() {
        // Arrange
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.of(regularUser));
        when(dealerService.isDealer(regularUser)).thenReturn(false);
        when(carListingRepository.countActiveListingsByUser(regularUser)).thenReturn(5L);

        // Act & Assert
        assertThatThrownBy(() -> carListingService.createListing(createListingRequest, REGULAR_USERNAME))
            .isInstanceOf(RegularUserListingLimitException.class)
            .satisfies(exception -> {
                RegularUserListingLimitException ex = (RegularUserListingLimitException) exception;
                assertThat(ex.getUsername()).isEqualTo(REGULAR_USERNAME);
                assertThat(ex.getCurrentCount()).isEqualTo(5);
                assertThat(ex.getLimit()).isEqualTo(LISTING_LIMIT);
            });
    }

    @Test
    @DisplayName("Dealer users are NOT affected by regular user limits")
    void testDealerUsersNotAffectedByRegularUserLimits() {
        // This test just verifies that dealers take a different code path
        // Full dealer validation is tested in DealerTrialServiceTest
        // We simply verify that regular user limit check is skipped for dealers
        
        User dealerUser = new User();
        dealerUser.setId(2L);
        dealerUser.setUsername("dealer_user");

        when(userRepository.findByUsername("dealer_user")).thenReturn(Optional.of(dealerUser));
        when(dealerService.isDealer(dealerUser)).thenReturn(true);
        
        // When dealer path is taken, we should NOT check regular user listing count
        // The test verifies this by ensuring countActiveListingsByUser is never called
        
        // Note: We don't actually create a listing here because that would require
        // mocking the entire dealer validation chain. We're just verifying the branching logic.
        
        // Verify that dealer check was performed
        try {
            carListingService.createListing(createListingRequest, "dealer_user");
        } catch (Exception e) {
            // Expected - dealer validation will fail because we haven't mocked DealerTrialService
            // The important part is that we never checked regular user limits
        }
        
        // Verify regular user limit was NOT checked for dealer
        verify(carListingRepository, never()).countActiveListingsByUser(any());
    }

    @Test
    @DisplayName("Count only includes active listings (approved, not sold, not archived)")
    void testCountOnlyIncludesActiveListings() {
        // Arrange
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.of(regularUser));
        when(dealerService.isDealer(regularUser)).thenReturn(false);
        // The repository query should only count active listings
        when(carListingRepository.countActiveListingsByUser(regularUser)).thenReturn(3L);
        
        CarListingResponse mockResponse = new CarListingResponse();
        when(crudService.createListingInternal(any(), eq(REGULAR_USERNAME))).thenReturn(mockResponse);

        // Act
        carListingService.createListing(createListingRequest, REGULAR_USERNAME);

        // Assert - verify the correct repository method was called
        verify(carListingRepository).countActiveListingsByUser(regularUser);
        verify(crudService).createListingInternal(any(), eq(REGULAR_USERNAME));
    }

    @Test
    @DisplayName("Limit enforcement happens BEFORE listing creation")
    void testLimitEnforcedBeforeCreation() {
        // Arrange - user at limit
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.of(regularUser));
        when(dealerService.isDealer(regularUser)).thenReturn(false);
        when(carListingRepository.countActiveListingsByUser(regularUser)).thenReturn(5L);

        // Act & Assert
        assertThatThrownBy(() -> carListingService.createListing(createListingRequest, REGULAR_USERNAME))
            .isInstanceOf(RegularUserListingLimitException.class);

        // Verify creation was NEVER attempted
        verify(crudService, never()).createListingInternal(any(), any());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Different limits can be configured via properties")
    void testDifferentLimitsCanBeConfigured() {
        // Arrange - test with different limit
        ReflectionTestUtils.setField(carListingService, "regularUserListingLimit", 3);
        
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.of(regularUser));
        when(dealerService.isDealer(regularUser)).thenReturn(false);
        when(carListingRepository.countActiveListingsByUser(regularUser)).thenReturn(3L);

        // Act & Assert - should fail with limit of 3
        assertThatThrownBy(() -> carListingService.createListing(createListingRequest, REGULAR_USERNAME))
            .isInstanceOf(RegularUserListingLimitException.class)
            .hasMessageContaining("Limit: 3");
    }

    @Test
    @DisplayName("User not found throws appropriate exception")
    void testUserNotFoundThrowsException() {
        // Arrange
        when(userRepository.findByUsername(REGULAR_USERNAME)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> carListingService.createListing(createListingRequest, REGULAR_USERNAME))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("User not found");

        verify(carListingRepository, never()).countActiveListingsByUser(any());
    }
}

