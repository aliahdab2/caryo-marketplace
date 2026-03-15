package com.caryo.marketplace.service;

import com.caryo.marketplace.model.Dealer;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.repository.CarListingRepository;
import com.caryo.marketplace.repository.DealerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Simplified unit tests for DealerTrialService focusing on critical paths.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DealerTrialService Tests")
class DealerTrialServiceTest {

    @Mock
    private DealerRepository dealerRepository;

    @Mock
    private CarListingRepository carListingRepository;

    @InjectMocks
    private DealerTrialService dealerTrialService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(dealerTrialService, "trialDurationMonths", 2);
        ReflectionTestUtils.setField(dealerTrialService, "trialListingLimit", 15);
        ReflectionTestUtils.setField(dealerTrialService, "gracePeriodDays", 3);
        ReflectionTestUtils.setField(dealerTrialService, "basicListingLimit", 100);
        ReflectionTestUtils.setField(dealerTrialService, "advancedListingLimit", 250);
        ReflectionTestUtils.setField(dealerTrialService, "professionalListingLimit", -1);
    }

    @Test
    @DisplayName("Should return true when trial just started")
    void shouldReturnTrueWhenTrialJustStarted() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now())
                .trialListingsCount(0)
                .trialExpired(false)
                .subscriptionStatus("trial")
                .subscriptionTier("trial")
                .build();

        // When
        boolean isActive = dealerTrialService.isTrialActive(dealer);

        // Then
        assertThat(isActive).isTrue();
    }

    @Test
    @DisplayName("Should return false when trial explicitly marked as expired")
    void shouldReturnFalseWhenMarkedExpired() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now().minusDays(10))
                .trialListingsCount(5)
                .trialExpired(true)
                .subscriptionStatus("suspended")
                .subscriptionTier("trial")
                .build();

        // When
        boolean isActive = dealerTrialService.isTrialActive(dealer);

        // Then
        assertThat(isActive).isFalse();
    }

    @Test
    @DisplayName("Should allow listing creation when trial is active and under limit")
    void shouldAllowListingWhenTrialActiveAndUnderLimit() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now().minusDays(10))
                .trialListingsCount(5)
                .trialExpired(false)
                .subscriptionStatus("trial")
                .subscriptionTier("trial")
                .canCreateListings(true)
                .build();

        // When
        boolean canCreate = dealerTrialService.canCreateListing(dealer);

        // Then
        assertThat(canCreate).isTrue();
    }

    @Test
    @DisplayName("Should deny listing creation when feature flag is disabled")
    void shouldDenyListingWhenFeatureFlagDisabled() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now().minusDays(10))
                .trialListingsCount(5)
                .trialExpired(false)
                .subscriptionStatus("trial")
                .subscriptionTier("trial")
                .canCreateListings(false)
                .build();

        // When
        boolean canCreate = dealerTrialService.canCreateListing(dealer);

        // Then
        assertThat(canCreate).isFalse();
    }

    @Test
    @DisplayName("Should increment listing count for dealer on trial")
    void shouldIncrementCountForTrialDealer() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now().minusDays(10))
                .trialListingsCount(5)
                .trialExpired(false)
                .subscriptionStatus("trial")
                .subscriptionTier("trial")
                .build();

        when(dealerRepository.save(any(Dealer.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        dealerTrialService.incrementListingCount(dealer);

        // Then
        ArgumentCaptor<Dealer> dealerCaptor = ArgumentCaptor.forClass(Dealer.class);
        verify(dealerRepository).save(dealerCaptor.capture());
        Dealer savedDealer = dealerCaptor.getValue();
        assertThat(savedDealer.getTrialListingsCount()).isEqualTo(6);
    }

    @Test
    @DisplayName("Should not increment listing count for dealer with active subscription")
    void shouldNotIncrementCountForActiveSubscription() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now().minusMonths(3))
                .trialListingsCount(10)
                .trialExpired(false)
                .subscriptionStatus("active")
                .subscriptionTier("basic")
                .build();

        // When
        dealerTrialService.incrementListingCount(dealer);

        // Then
        verify(dealerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should allow basic tier listing when under limit")
    void shouldAllowBasicTierWhenUnderLimit() {
        // Given
        User user = new User();
        Dealer dealer = Dealer.builder()
                .id(1L)
                .user(user)
                .subscriptionStatus("active")
                .subscriptionTier("basic")
                .canCreateListings(true)
                .build();

        when(carListingRepository.countActiveListingsByUser(user)).thenReturn(99L); // Limit is 100

        // When
        boolean canCreate = dealerTrialService.canCreateListing(dealer);

        // Then
        assertThat(canCreate).isTrue();
    }

    @Test
    @DisplayName("Should block basic tier listing when limit reached")
    void shouldBlockBasicTierWhenLimitReached() {
        // Given
        User user = new User();
        Dealer dealer = Dealer.builder()
                .id(1L)
                .user(user)
                .subscriptionStatus("active")
                .subscriptionTier("basic")
                .canCreateListings(true)
                .build();

        when(carListingRepository.countActiveListingsByUser(user)).thenReturn(100L); // Limit is 100

        // When
        boolean canCreate = dealerTrialService.canCreateListing(dealer);

        // Then
        assertThat(canCreate).isFalse();
    }

    @Test
    @DisplayName("Should allow professional tier listing regardless of count")
    void shouldAllowProfessionalTier() {
        // Given
        User user = new User();
        Dealer dealer = Dealer.builder()
                .id(1L)
                .user(user)
                .subscriptionStatus("active")
                .subscriptionTier("professional")
                .canCreateListings(true)
                .build();

        // Even with huge count
        // carListingRepository not mocked intentionally - professional check returns
        // early

        // When
        boolean canCreate = dealerTrialService.canCreateListing(dealer);

        // Then
        assertThat(canCreate).isTrue();
    }

    @Test
    @DisplayName("Should successfully extend trial by days")
    void shouldExtendTrialByDays() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now().minusMonths(2))
                .trialListingsCount(10)
                .trialExpired(false)
                .subscriptionStatus("trial")
                .subscriptionTier("trial")
                .build();

        when(dealerRepository.save(any(Dealer.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        dealerTrialService.extendTrial(dealer, 30, "Test extension");

        // Then
        ArgumentCaptor<Dealer> dealerCaptor = ArgumentCaptor.forClass(Dealer.class);
        verify(dealerRepository).save(dealerCaptor.capture());
        Dealer savedDealer = dealerCaptor.getValue();
        assertThat(savedDealer.getTrialExtendedUntil()).isNotNull();
    }

    @Test
    @DisplayName("Should return complete trial status")
    void shouldReturnCompleteTrialStatus() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now().minusDays(15))
                .trialListingsCount(5)
                .trialExpired(false)
                .subscriptionStatus("trial")
                .subscriptionTier("trial")
                .timezone("Asia/Damascus")
                .canCreateListings(true)
                .build();

        // When
        DealerTrialService.TrialStatus status = dealerTrialService.getTrialStatus(dealer);

        // Then
        assertThat(status).isNotNull();
        assertThat(status.getListingsUsed()).isEqualTo(5);
        assertThat(status.getListingsLimit()).isEqualTo(15);
        assertThat(status.getListingsRemaining()).isEqualTo(10);
        assertThat(status.isCanCreateListings()).isTrue();
    }

    @Test
    @DisplayName("Should mark trial as expired")
    void shouldExpireTrial() {
        // Given
        Dealer dealer = Dealer.builder()
                .id(1L)
                .businessName("Test Dealer")
                .businessEmail("test@dealer.sy")
                .businessPhone("+963-11-1234567")
                .trialStartedAt(ZonedDateTime.now().minusMonths(2))
                .trialListingsCount(15)
                .trialExpired(false)
                .subscriptionStatus("trial")
                .subscriptionTier("trial")
                .canCreateListings(true)
                .build();

        when(dealerRepository.save(any(Dealer.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        dealerTrialService.expireTrial(dealer);

        // Then
        ArgumentCaptor<Dealer> dealerCaptor = ArgumentCaptor.forClass(Dealer.class);
        verify(dealerRepository).save(dealerCaptor.capture());
        Dealer savedDealer = dealerCaptor.getValue();
        assertThat(savedDealer.getTrialExpired()).isTrue();
        // Note: expireTrial() only sets trialExpired flag
        // Other fields (canCreateListings, subscriptionStatus) are managed elsewhere
    }
}
