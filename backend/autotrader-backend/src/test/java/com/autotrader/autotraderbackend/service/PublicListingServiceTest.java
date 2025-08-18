package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicListingServiceTest {

    @Mock
    private CarListingService carListingService;

    @Mock
    private ListingModerationService listingModerationService;

    @InjectMocks
    private PublicListingService publicListingService;

    private CarListing testListing;
    private CarListingResponse testResponse;

    @BeforeEach
    void setUp() {
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Test Car");
        testListing.setApproved(true);

        testResponse = new CarListingResponse();
        testResponse.setId(1L);
        testResponse.setTitle("Test Car");
        testResponse.setApproved(true);
    }

    @Test
    void getPublicListingById_WhenListingExistsAndActive_ShouldReturnListing() {
        // Arrange
        when(carListingService.getListingById(1L)).thenReturn(testResponse);
        when(listingModerationService.isListingHiddenByAdmin(1L)).thenReturn(false);
        when(listingModerationService.isListingSold(1L)).thenReturn(false);
        when(listingModerationService.isListingArchived(1L)).thenReturn(false);
        when(listingModerationService.isListingExpired(1L)).thenReturn(false);

        // Act
        CarListingResponse result = publicListingService.getPublicListingById(1L);

        // Assert
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Test Car", result.getTitle());
        assertTrue(result.getApproved());
    }

    @Test
    void getPublicListingById_WhenListingNotApproved_ShouldThrowException() {
        // Arrange
        testResponse.setApproved(false);
        when(carListingService.getListingById(1L)).thenReturn(testResponse);

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> publicListingService.getPublicListingById(1L)
        );
        
        assertEquals("CarListing not found with id : '1'", exception.getMessage());
    }

    @Test
    void getPublicListingById_WhenListingHiddenByAdmin_ShouldThrowException() {
        // Arrange
        when(carListingService.getListingById(1L)).thenReturn(testResponse);
        when(listingModerationService.isListingHiddenByAdmin(1L)).thenReturn(true);

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> publicListingService.getPublicListingById(1L)
        );
        
        assertEquals("CarListing not found with id : '1'", exception.getMessage());
    }

    @Test
    void getPublicListingById_WhenListingSold_ShouldThrowException() {
        // Arrange
        when(carListingService.getListingById(1L)).thenReturn(testResponse);
        when(listingModerationService.isListingHiddenByAdmin(1L)).thenReturn(false);
        when(listingModerationService.isListingSold(1L)).thenReturn(true);

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> publicListingService.getPublicListingById(1L)
        );
        
        assertEquals("CarListing not found with id : '1'", exception.getMessage());
    }

    @Test
    void getPublicListingById_WhenListingArchived_ShouldThrowException() {
        // Arrange
        when(carListingService.getListingById(1L)).thenReturn(testResponse);
        when(listingModerationService.isListingHiddenByAdmin(1L)).thenReturn(false);
        when(listingModerationService.isListingSold(1L)).thenReturn(false);
        when(listingModerationService.isListingArchived(1L)).thenReturn(true);

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> publicListingService.getPublicListingById(1L)
        );
        
        assertEquals("CarListing not found with id : '1'", exception.getMessage());
    }

    @Test
    void getPublicListingById_WhenListingExpired_ShouldThrowException() {
        // Arrange
        when(carListingService.getListingById(1L)).thenReturn(testResponse);
        when(listingModerationService.isListingHiddenByAdmin(1L)).thenReturn(false);
        when(listingModerationService.isListingSold(1L)).thenReturn(false);
        when(listingModerationService.isListingArchived(1L)).thenReturn(false);
        when(listingModerationService.isListingExpired(1L)).thenReturn(true);

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> publicListingService.getPublicListingById(1L)
        );
        
        assertEquals("CarListing not found with id : '1'", exception.getMessage());
    }

    @Test
    void getPublicListingById_WhenCarListingServiceThrowsException_ShouldPropagateException() {
        // Arrange
        when(carListingService.getListingById(1L))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", 1L));

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(
            ResourceNotFoundException.class,
            () -> publicListingService.getPublicListingById(1L)
        );
        
        assertEquals("CarListing not found with id : '1'", exception.getMessage());
    }

    @Test
    void getPublicListingById_ShouldCallModerationServiceInCorrectOrder() {
        // Arrange
        when(carListingService.getListingById(1L)).thenReturn(testResponse);
        when(listingModerationService.isListingHiddenByAdmin(1L)).thenReturn(false);
        when(listingModerationService.isListingSold(1L)).thenReturn(false);
        when(listingModerationService.isListingArchived(1L)).thenReturn(false);
        when(listingModerationService.isListingExpired(1L)).thenReturn(false);

        // Act
        publicListingService.getPublicListingById(1L);

        // Assert - Verify the order of calls for performance optimization
        var inOrder = inOrder(listingModerationService);
        inOrder.verify(listingModerationService).isListingHiddenByAdmin(1L);
        inOrder.verify(listingModerationService).isListingSold(1L);
        inOrder.verify(listingModerationService).isListingArchived(1L);
        inOrder.verify(listingModerationService).isListingExpired(1L);
    }
}
