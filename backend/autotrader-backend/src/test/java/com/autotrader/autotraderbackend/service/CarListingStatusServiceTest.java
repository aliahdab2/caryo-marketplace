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
        testListing.setSold(false);
        testListing.setArchived(false);
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
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.markListingAsSold(testListing.getId(), testUser.getUsername());

        verify(carListingRepository).save(testListing);
        verify(eventPublisher).publishEvent(any(ListingMarkedAsSoldEvent.class));
        assertThat(testListing.getSold()).isTrue();
    }

    @Test
    void markListingAsSold_AlreadySold() {
        testListing.setSold(true);
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.markListingAsSold(testListing.getId(), testUser.getUsername());

        verify(carListingRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void archiveListing_Success() {
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.archiveListing(testListing.getId(), testUser.getUsername());

        verify(carListingRepository).save(testListing);
        verify(eventPublisher).publishEvent(any(ListingArchivedEvent.class));
        assertThat(testListing.getArchived()).isTrue();
    }

    @Test
    void unarchiveListing_Success() {
        testListing.setArchived(true);
        when(userRepository.findByUsername(testUser.getUsername())).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.unarchiveListing(testListing.getId(), testUser.getUsername());

        verify(carListingRepository).save(testListing);
        assertThat(testListing.getArchived()).isFalse();
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
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponseForAdmin(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.markListingAsSoldByAdmin(testListing.getId());

        verify(carListingRepository).save(testListing);
        assertThat(testListing.getSold()).isTrue();
    }

    @Test
    void archiveListingByAdmin_Success() {
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.archiveListingByAdmin(testListing.getId());

        verify(carListingRepository).save(testListing);
        assertThat(testListing.getArchived()).isTrue();
    }

    @Test
    void unarchiveListingByAdmin_Success() {
        testListing.setArchived(true);
        when(carListingRepository.findById(testListing.getId())).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        carListingStatusService.unarchiveListingByAdmin(testListing.getId());

        verify(carListingRepository).save(testListing);
        assertThat(testListing.getArchived()).isFalse();
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
        // Ensure clean state before setting specific condition
        testListing.setApproved(false);
        testListing.setArchived(false);
        testListing.setSold(false);

        testListing.setApproved(true);
        IllegalStateException approveException = assertThrows(IllegalStateException.class,
                () -> carListingStatusService.approveListing(testListing.getId()));
        assertEquals("Listing with ID 1 is already approved.", approveException.getMessage());
        testListing.setApproved(false); // Reset state

        // Case 2: Already archived
        // Ensure clean state before setting specific condition
        testListing.setApproved(false);
        testListing.setArchived(false);
        testListing.setSold(false);

        testListing.setArchived(true);
        IllegalStateException archiveException = assertThrows(IllegalStateException.class,
                () -> carListingStatusService.archiveListingByAdmin(testListing.getId()));
        assertEquals("Listing with ID 1 is already archived.", archiveException.getMessage());
        testListing.setArchived(false); // Reset state

        // Case 3: Already sold
        // Ensure clean state before setting specific condition
        testListing.setApproved(true); // Listing needs to be approved to be sold without other errors
        testListing.setArchived(false);
        testListing.setSold(false);

        testListing.setSold(true);
        IllegalStateException soldException = assertThrows(IllegalStateException.class,
                () -> carListingStatusService.markListingAsSoldByAdmin(testListing.getId()));
        assertEquals("Listing with ID 1 is already marked as sold.", soldException.getMessage());
        testListing.setSold(false); // Reset state
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
            listing.getExpired() &&
            !listing.getIsUserActive()
        ));
        verify(carListingMapper).toCarListingResponse(testListing);
        verify(eventPublisher).publishEvent(any(ListingExpiredEvent.class));
    }
}
