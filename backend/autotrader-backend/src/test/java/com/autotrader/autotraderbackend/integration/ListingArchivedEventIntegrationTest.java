package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.CarListingService;
import org.mockito.InjectMocks;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ListingArchivedEventIntegrationTest {

    @InjectMocks
    private CarListingService carListingService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private CarListingMapper carListingMapper;

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
        mockListing.setArchived(false);

        // Setup repository mocks
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(carListingRepository.findById(mockListing.getId())).thenReturn(Optional.of(mockListing));
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(i -> i.getArgument(0));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenAnswer(i -> {
            CarListing listing = i.getArgument(0);
            CarListingResponse response = new CarListingResponse();
            response.setId(listing.getId());
            response.setIsArchived(listing.getArchived());
            return response;
        });
    }

    @Test
    public void testListingArchivedEventPublished() {
        // Arrange
        doNothing().when(eventPublisher).publishEvent(any(ListingArchivedEvent.class));

        // Act
        carListingService.archiveListing(mockListing.getId(), "testuser");

        // Assert
        verify(eventPublisher, times(1)).publishEvent(any(ListingArchivedEvent.class));
    }
}
