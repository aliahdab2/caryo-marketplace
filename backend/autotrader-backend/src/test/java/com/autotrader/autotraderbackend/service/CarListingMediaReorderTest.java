package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.MediaReorderRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingMediaReorderTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarListingMapper carListingMapper;

    @InjectMocks
    private CarListingService carListingService;

    private CarListing testListing;
    private User testUser;
    private List<ListingMedia> testMedia;
    private List<MediaReorderRequest> reorderRequests;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        // Create test listing
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Test Car");
        testListing.setSeller(testUser);

        // Create test media items
        testMedia = new ArrayList<>();
        
        ListingMedia media1 = new ListingMedia();
        media1.setId(1L);
        media1.setSortOrder(0);
        media1.setCarListing(testListing);
        testMedia.add(media1);

        ListingMedia media2 = new ListingMedia();
        media2.setId(2L);
        media2.setSortOrder(1);
        media2.setCarListing(testListing);
        testMedia.add(media2);

        ListingMedia media3 = new ListingMedia();
        media3.setId(3L);
        media3.setSortOrder(2);
        media3.setCarListing(testListing);
        testMedia.add(media3);

        testListing.setMedia(testMedia);

        // Create reorder requests (reverse the order)
        reorderRequests = List.of(
            new MediaReorderRequest(3L, 0), // Move media3 to first
            new MediaReorderRequest(2L, 1), // Keep media2 in middle
            new MediaReorderRequest(1L, 2)  // Move media1 to last
        );
    }

    @Test
    void testReorderMedia_Success() {
        // Arrange
        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        
        CarListingResponse expectedResponse = new CarListingResponse();
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(expectedResponse);

        // Act
        CarListingResponse result = carListingService.reorderMedia(1L, reorderRequests, "testuser");

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse, result);

        // Verify that sort orders were updated correctly
        assertEquals(2, testMedia.get(0).getSortOrder()); // media1 moved to position 2
        assertEquals(1, testMedia.get(1).getSortOrder()); // media2 stays at position 1
        assertEquals(0, testMedia.get(2).getSortOrder()); // media3 moved to position 0

        verify(carListingRepository).save(testListing);
        verify(carListingMapper).toCarListingResponse(testListing);
    }

    @Test
    void testReorderMedia_ListingNotFound() {
        // Arrange
        when(carListingRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> 
            carListingService.reorderMedia(999L, reorderRequests, "testuser")
        );

        verify(carListingRepository, never()).save(any());
    }

    @Test
    void testReorderMedia_UserNotFound() {
        // Arrange
        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> 
            carListingService.reorderMedia(1L, reorderRequests, "nonexistent")
        );

        verify(carListingRepository, never()).save(any());
    }

    @Test
    void testReorderMedia_UnauthorizedUser() {
        // Arrange
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");

        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
        when(userRepository.findByUsername("otheruser")).thenReturn(Optional.of(otherUser));

        // Act & Assert
        assertThrows(SecurityException.class, () -> 
            carListingService.reorderMedia(1L, reorderRequests, "otheruser")
        );

        verify(carListingRepository, never()).save(any());
    }

    @Test
    void testReorderMedia_MediaNotBelongToListing() {
        // Arrange
        List<MediaReorderRequest> invalidRequests = List.of(
            new MediaReorderRequest(1L, 0),
            new MediaReorderRequest(999L, 1) // This media ID doesn't exist in the listing
        );

        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            carListingService.reorderMedia(1L, invalidRequests, "testuser")
        );

        verify(carListingRepository, never()).save(any());
    }

    @Test
    void testReorderMedia_NullParameters() {
        // Test null listing ID
        assertThrows(NullPointerException.class, () -> 
            carListingService.reorderMedia(null, reorderRequests, "testuser")
        );

        // Test null reorder requests
        assertThrows(NullPointerException.class, () -> 
            carListingService.reorderMedia(1L, null, "testuser")
        );

        // Test blank username
        assertThrows(IllegalArgumentException.class, () -> 
            carListingService.reorderMedia(1L, reorderRequests, "")
        );

        assertThrows(IllegalArgumentException.class, () -> 
            carListingService.reorderMedia(1L, reorderRequests, null)
        );
    }

    @Test
    void testReorderMedia_EmptyReorderList() {
        // Arrange
        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        
        CarListingResponse expectedResponse = new CarListingResponse();
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(expectedResponse);

        // Act
        CarListingResponse result = carListingService.reorderMedia(1L, List.of(), "testuser");

        // Assert
        assertNotNull(result);
        verify(carListingRepository).save(testListing);
    }
}
