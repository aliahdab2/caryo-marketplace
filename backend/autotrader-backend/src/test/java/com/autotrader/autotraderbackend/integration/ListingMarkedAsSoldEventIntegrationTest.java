package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.events.ListingMarkedAsSoldEvent;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
import com.autotrader.autotraderbackend.service.ListingModerationService;
import org.mockito.InjectMocks;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ListingMarkedAsSoldEventIntegrationTest {

    @InjectMocks
    private CarListingStatusService carListingStatusService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private CarListingMapper carListingMapper;

    @Mock
    private ListingModerationService moderationService;

    private CarListing mockListing;
    private User mockUser;

    @BeforeEach
    public void setUp() {
        // Setup test user
        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");

        // Setup test listing
        mockListing = new CarListing();
        mockListing.setId(1L);
        mockListing.setTitle("Test Listing");
        mockListing.setSeller(mockUser);

        // Setup repository mocks
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(carListingRepository.findById(mockListing.getId())).thenReturn(Optional.of(mockListing));
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(i -> i.getArgument(0));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenAnswer(i -> {
            CarListing listing = i.getArgument(0);
            CarListingResponse response = new CarListingResponse();
            response.setId(listing.getId());
            // Note: isSold now computed from moderation actions
            response.setIsSold(false);
            return response;
        });
        
        // Setup moderation service mocks
        when(moderationService.isListingArchived(mockListing.getId())).thenReturn(false);
        when(moderationService.isListingSold(mockListing.getId())).thenReturn(false);
        doNothing().when(moderationService).markListingAsSold(mockListing.getId(), "testuser");
    }

    @Test
    public void testListingMarkedAsSoldEventPublished() {
        // Arrange
        doNothing().when(eventPublisher).publishEvent(any(ListingMarkedAsSoldEvent.class));

        // Act
        carListingStatusService.markListingAsSold(mockListing.getId(), "testuser");

        // Assert
        verify(eventPublisher, times(1)).publishEvent(any(ListingMarkedAsSoldEvent.class));
    }
}