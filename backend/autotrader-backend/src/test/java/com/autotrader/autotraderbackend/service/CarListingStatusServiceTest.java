package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.events.ListingApprovedEvent;
import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
import com.autotrader.autotraderbackend.events.ListingExpiredEvent;
import com.autotrader.autotraderbackend.events.ListingMarkedAsSoldEvent;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Objects;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingStatusServiceTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarListingMapper carListingMapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ListingModerationService moderationService;

    @InjectMocks
    private CarListingStatusService carListingStatusService;

    private User testUser;
    private CarListing testListing;
    private CarListingResponse testListingResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setSeller(testUser);
        testListing.setApproved(true);
        testListing.setIsUserActive(true);

        testListingResponse = new CarListingResponse();
        testListingResponse.setId(1L);
        testListingResponse.setIsSold(false);
        testListingResponse.setIsArchived(false);
    }

    @Test
    void markListingAsSold_Success() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);
        
        // Mock moderation service calls - listing is not archived and not sold yet
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(false);
        when(moderationService.isListingSold(testListing.getId())).thenReturn(false);
        doNothing().when(moderationService).markListingAsSold(testListing.getId(), testUser.getUsername());

        CarListingResponse result = carListingStatusService.markListingAsSold(testListing.getId(), testUser.getUsername());

        assertNotNull(result);
        verify(moderationService).markListingAsSold(testListing.getId(), testUser.getUsername());
        verify(eventPublisher).publishEvent(any(ListingMarkedAsSoldEvent.class));
        // Note: sold status assertions removed - now computed from moderation actions
        // Note: carListingRepository.save() no longer called - status managed by moderation service
    }

    @Test
    void markListingAsSold_AlreadySold() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);
        
        // Mock moderation service calls - listing is not archived but already sold
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(false);
        when(moderationService.isListingSold(testListing.getId())).thenReturn(true);

        CarListingResponse result = carListingStatusService.markListingAsSold(testListing.getId(), testUser.getUsername());

        // Should return the listing response without making changes
        assertNotNull(result);
        verify(moderationService, never()).markListingAsSold(any(), any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void archiveListing_Success() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);
        
        // Mock moderation service calls - listing is not archived yet
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(false);
        doNothing().when(moderationService).archiveListing(testListing.getId(), testUser.getUsername());

        CarListingResponse result = carListingStatusService.archiveListing(testListing.getId(), testUser.getUsername());

        assertNotNull(result);
        verify(moderationService).archiveListing(testListing.getId(), testUser.getUsername());
        verify(eventPublisher).publishEvent(any(ListingArchivedEvent.class));
        // Note: archived status assertions removed - now computed from moderation actions
    }

    @Test
    void unarchiveListing_Success() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);
        
        // Mock moderation service calls - listing is currently archived
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(true);
        doNothing().when(moderationService).unarchiveListing(testListing.getId(), testUser.getUsername());

        CarListingResponse result = carListingStatusService.unarchiveListing(testListing.getId(), testUser.getUsername());

        assertNotNull(result);
        verify(moderationService).unarchiveListing(testListing.getId(), testUser.getUsername());
        verify(carListingRepository).save(testListing);
        // Note: archived status assertions removed - now computed from moderation actions
    }

    @Test
    void pauseListing_Success() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.pauseListing(testListing.getId(), testUser.getUsername());

        verify(carListingRepository).save(testListing);
        assertThat(testListing.getIsUserActive()).isFalse();
    }

    @Test
    void resumeListing_Success() {
        testListing.setIsUserActive(false);
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.resumeListing(testListing.getId(), testUser.getUsername());

        verify(carListingRepository).save(testListing);
        assertThat(testListing.getIsUserActive()).isTrue();
    }

    @Test
    void approveListing_Success() {
        testListing.setApproved(false);
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.approveListing(testListing.getId());

        verify(carListingRepository).save(testListing);
        verify(eventPublisher).publishEvent(any(ListingApprovedEvent.class));
        assertThat(testListing.getApproved()).isTrue();
    }

    @Test
    void markListingAsSoldByAdmin_Success() {
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);
        
        // Mock moderation service calls - listing is not archived and not sold yet
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(false);
        when(moderationService.isListingSold(testListing.getId())).thenReturn(false);
        doNothing().when(moderationService).markListingAsSold(testListing.getId(), "admin");

        CarListingResponse result = carListingStatusService.markListingAsSoldByAdmin(testListing.getId());

        assertNotNull(result);
        verify(moderationService).markListingAsSold(testListing.getId(), "admin");
        verify(eventPublisher).publishEvent(any(ListingMarkedAsSoldEvent.class));
        // Note: sold status assertions removed - now computed from moderation actions
    }

    @Test
    void archiveListingByAdmin_Success() {
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);
        
        // Mock moderation service calls - listing is not archived yet
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(false);
        doNothing().when(moderationService).archiveListing(testListing.getId(), "admin");

        CarListingResponse result = carListingStatusService.archiveListingByAdmin(testListing.getId());

        assertNotNull(result);
        verify(moderationService).archiveListing(testListing.getId(), "admin");
        verify(eventPublisher).publishEvent(any(ListingArchivedEvent.class));
        // Note: archived status assertions removed - now computed from moderation actions
    }

    @Test
    void unarchiveListingByAdmin_Success() {
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);
        
        // Mock moderation service calls - listing is currently archived
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(true);
        doNothing().when(moderationService).unarchiveListing(testListing.getId(), "admin");

        CarListingResponse result = carListingStatusService.unarchiveListingByAdmin(testListing.getId());

        assertNotNull(result);
        verify(moderationService).unarchiveListing(testListing.getId(), "admin");
        verify(carListingRepository).save(testListing);
        // Note: archived status assertions removed - now computed from moderation actions
    }

    @Test
    void listing_NotFound() {
        when(carListingRepository.findById(anyLong())).thenReturn(Optional.empty());
        // Simulating calls that would require a user, even if not directly used in findListingById
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(testUser)); 

        assertThrows(ResourceNotFoundException.class,
                () -> carListingStatusService.markListingAsSold(999L, testUser.getUsername()));
        assertThrows(ResourceNotFoundException.class,
                () -> carListingStatusService.archiveListing(999L, testUser.getUsername()));
        assertThrows(ResourceNotFoundException.class,
                () -> carListingStatusService.unarchiveListing(999L, testUser.getUsername()));
        assertThrows(ResourceNotFoundException.class,
                () -> carListingStatusService.pauseListing(999L, testUser.getUsername()));
        assertThrows(ResourceNotFoundException.class,
                () -> carListingStatusService.resumeListing(999L, testUser.getUsername()));
    }

    @Test
    void unauthorized_WrongUser() {
        User wrongUser = new User();
        wrongUser.setId(2L);
        wrongUser.setUsername("wronguser");

        when(userRepository.findByUsername(wrongUser.getUsername())).thenReturn(Optional.of(wrongUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));

        // Act & Assert
        SecurityException soldException = assertThrows(SecurityException.class,
                () -> carListingStatusService.markListingAsSold(testListing.getId(), wrongUser.getUsername()));
        assertEquals("User does not have permission to modify this listing.", soldException.getMessage());

        SecurityException archiveException = assertThrows(SecurityException.class,
                () -> carListingStatusService.archiveListing(testListing.getId(), wrongUser.getUsername()));
        assertEquals("User does not have permission to modify this listing.", archiveException.getMessage());

        SecurityException unarchiveException = assertThrows(SecurityException.class,
                () -> carListingStatusService.unarchiveListing(testListing.getId(), wrongUser.getUsername()));
        assertEquals("User does not have permission to modify this listing.", unarchiveException.getMessage());

        SecurityException pauseException = assertThrows(SecurityException.class,
                () -> carListingStatusService.pauseListing(testListing.getId(), wrongUser.getUsername()));
        assertEquals("User does not have permission to modify this listing.", pauseException.getMessage());

        SecurityException resumeException = assertThrows(SecurityException.class,
                () -> carListingStatusService.resumeListing(testListing.getId(), wrongUser.getUsername()));
        assertEquals("User does not have permission to modify this listing.", resumeException.getMessage());

        // Verify
        verify(userRepository, times(5)).findByUsername(wrongUser.getUsername());
        verify(carListingRepository, times(5)).findById(testListing.getId());
        verify(carListingRepository, never()).save(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponse(any(CarListing.class));
    }

    // --- Tests for pauseListing ---
    @Test
    void pauseListing_AlreadyPaused() {
        testListing.setIsUserActive(false);
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.pauseListing(testListing.getId(), testUser.getUsername());

        verify(carListingRepository, never()).save(any());
    }

    @Test
    void resumeListing_AlreadyActive() {
        testListing.setIsUserActive(true);
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.resumeListing(testListing.getId(), testUser.getUsername());

        verify(carListingRepository, never()).save(any());
    }

    @Test
    void admin_Operations_NotFound() {
        // Arrange
        Long nonExistentId = 999L;
        when(carListingRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        String expectedErrorMessage = String.format("Car Listing not found with id : '%d'", nonExistentId);

        assertAll(
            () -> {
                ResourceNotFoundException soldException = assertThrows(ResourceNotFoundException.class,
                        () -> carListingStatusService.markListingAsSoldByAdmin(nonExistentId));
                assertThat(soldException)
                    .isNotNull()
                    .extracting(ResourceNotFoundException::getMessage)
                    .isEqualTo(expectedErrorMessage);
            },
            () -> {
                ResourceNotFoundException approveException = assertThrows(ResourceNotFoundException.class,
                        () -> carListingStatusService.approveListing(nonExistentId));
                assertThat(approveException)
                    .isNotNull()
                    .extracting(ResourceNotFoundException::getMessage)
                    .isEqualTo(expectedErrorMessage);
            },
            () -> {
                ResourceNotFoundException archiveException = assertThrows(ResourceNotFoundException.class,
                        () -> carListingStatusService.archiveListingByAdmin(nonExistentId));
                assertThat(archiveException)
                    .isNotNull()
                    .extracting(ResourceNotFoundException::getMessage)
                    .isEqualTo(expectedErrorMessage);
            },
            () -> {
                ResourceNotFoundException unarchiveException = assertThrows(ResourceNotFoundException.class,
                        () -> carListingStatusService.unarchiveListingByAdmin(nonExistentId));
                assertThat(unarchiveException)
                    .isNotNull()
                    .extracting(ResourceNotFoundException::getMessage)
                    .isEqualTo(expectedErrorMessage);
            }
        );

        // Verify
        verify(carListingRepository, times(4)).findById(nonExistentId);
        verify(carListingRepository, never()).save(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponse(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponseForAdmin(any(CarListing.class));
    }

    @Test
    void admin_Operations_IllegalState() {
        // Arrange - Setup listing in various invalid states
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));

        // Case 1: Already approved
        testListing.setApproved(true);
        IllegalStateException approveException = assertThrows(IllegalStateException.class,
                () -> carListingStatusService.approveListing(testListing.getId()));
        assertEquals("Listing with ID 1 is already approved.", approveException.getMessage());
        testListing.setApproved(false); // Reset state

        // Case 2: Already archived - mock moderation service to return true
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(true);
        IllegalStateException archiveException = assertThrows(IllegalStateException.class,
                () -> carListingStatusService.archiveListingByAdmin(testListing.getId()));
        assertEquals("Listing with ID 1 is already archived.", archiveException.getMessage());

        // Case 3: Already sold - mock moderation service to return true
        testListing.setApproved(true); // Listing needs to be approved to be sold without other errors
        when(moderationService.isListingArchived(testListing.getId())).thenReturn(false); // Not archived
        when(moderationService.isListingSold(testListing.getId())).thenReturn(true); // Already sold

        IllegalStateException soldException = assertThrows(IllegalStateException.class,
                () -> carListingStatusService.markListingAsSoldByAdmin(testListing.getId()));
        assertEquals("Listing with ID 1 is already marked as sold.", soldException.getMessage());
        testListing.setApproved(true); // Reset to original setUp state if needed for other tests
    }

    @Test
    void expireListing_Success() {
        // Arrange
        testListingResponse.setIsExpired(true); // Ensure this field is set for the test
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        // Act
        CarListingResponse response = carListingStatusService.expireListing(testListing.getId());

        // Assert
        assertThat(response)
            .isNotNull()
            .satisfies(r -> {
                assertThat(r.getId()).isEqualTo(testListing.getId());
                assertThat(r.getIsExpired()).isTrue();
            });

        verify(carListingRepository).save(argThat(listing -> 
            Objects.nonNull(listing) &&
            listing.getId().equals(testListing.getId()) &&
            // Note: expired status check removed - now computed from moderation actions
            !listing.getIsUserActive()
        ));
        verify(carListingMapper).toCarListingResponse(testListing);
        verify(eventPublisher).publishEvent(any(ListingExpiredEvent.class));
    }
}
