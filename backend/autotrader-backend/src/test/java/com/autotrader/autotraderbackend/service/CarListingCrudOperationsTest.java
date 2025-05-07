package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CarListingCrudOperationsTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private CarListingMapper carListingMapper;

    @InjectMocks
    private CarListingService carListingService;

    private CarListing testListing;
    private CarListingResponse testListingResponse;
    private User testUser;
    private static final String TEST_USERNAME = "testuser";
    private static final Long TEST_LISTING_ID = 1L;

    @BeforeEach
    void setUp() {
        // Set up test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername(TEST_USERNAME);

        // Set up test listing
        testListing = new CarListing();
        testListing.setId(TEST_LISTING_ID);
        testListing.setTitle("Test Car");
        testListing.setBrand("Test Brand");
        testListing.setModel("Test Model");
        testListing.setModelYear(2020);
        testListing.setMileage(10000);
        testListing.setPrice(new BigDecimal("15000.00"));
        // Using locationEntity instead of deprecated location string
        Location testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setDisplayNameEn("Test Location");
        testLocation.setDisplayNameAr("موقع اختبار");
        testLocation.setSlug("test-location");
        testLocation.setCountryCode("SY"); // Set the required countryCode field
        testListing.setLocation(testLocation);
        testListing.setDescription("Test Description");
        testListing.setTransmission("Manual");
        testListing.setApproved(true);
        testListing.setSeller(testUser);
        testListing.setCreatedAt(LocalDateTime.now());
        
        // Add ListingMedia instead of imageKey
        ListingMedia testMedia = new ListingMedia();
        testMedia.setCarListing(testListing);
        testMedia.setFileKey("test-image-key");
        testMedia.setFileName("test-image.jpg");
        testMedia.setContentType("image/jpeg");
        testMedia.setSize(1024L);
        testMedia.setSortOrder(0);
        testMedia.setIsPrimary(true);
        testMedia.setMediaType("image");
        testListing.addMedia(testMedia);

        // Set up test listing response
        testListingResponse = new CarListingResponse();
        testListingResponse.setId(TEST_LISTING_ID);
        testListingResponse.setTitle("Test Car");
    }

    @Test
    void updateListing_ownedByUser_shouldUpdateFields() {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setPrice(new BigDecimal("16000.00"));

        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(testListingResponse);

        // Act
        CarListingResponse result = carListingService.updateListing(TEST_LISTING_ID, updateRequest, TEST_USERNAME);

        // Assert
        assertNotNull(result);
        assertEquals(TEST_LISTING_ID, result.getId());
        
        // Verify that the repository was called with updated values
        verify(carListingRepository).save(argThat(listing -> 
            "Updated Title".equals(listing.getTitle()) &&
            new BigDecimal("16000.00").equals(listing.getPrice()) &&
            "Test Model".equals(listing.getModel()) // unchanged field
        ));
    }

    @Test
    void updateListing_notOwnedByUser_shouldThrowSecurityException() {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Title");
        
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

        // Act & Assert
        Exception exception = assertThrows(SecurityException.class, () -> 
            carListingService.updateListing(TEST_LISTING_ID, updateRequest, "differentuser"));
        
        assertTrue(exception.getMessage().contains("not authorized"));
        verify(carListingRepository, never()).save(any(CarListing.class));
    }

    @Test
    void updateListing_nonExistentListing_shouldThrowResourceNotFoundException() {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Title");
        
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(ResourceNotFoundException.class, () -> 
            carListingService.updateListing(TEST_LISTING_ID, updateRequest, TEST_USERNAME));
        
        assertTrue(exception.getMessage().contains("not found"));
    }

    @Test
    void deleteListing_ownedByUser_shouldDeleteSuccessfully() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));
        
        // Act
        carListingService.deleteListing(TEST_LISTING_ID, TEST_USERNAME);
        
        // Assert
        verify(storageService).delete("test-image-key");
        verify(carListingRepository).delete(testListing);
    }

    @Test
    void deleteListing_notOwnedByUser_shouldThrowSecurityException() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

        // Act & Assert
        Exception exception = assertThrows(SecurityException.class, () -> 
            carListingService.deleteListing(TEST_LISTING_ID, "differentuser"));
        
        assertTrue(exception.getMessage().contains("not authorized"));
        verify(carListingRepository, never()).delete(any(CarListing.class));
        verify(storageService, never()).delete(anyString());
    }
    
    @Test
    void deleteListing_nonExistentListing_shouldThrowResourceNotFoundException() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(ResourceNotFoundException.class, () -> 
            carListingService.deleteListing(TEST_LISTING_ID, TEST_USERNAME));
        
        assertTrue(exception.getMessage().contains("not found"));
    }
    
    @Test
    void deleteListingAsAdmin_shouldDeleteSuccessfully() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));
        
        // Act
        carListingService.deleteListingAsAdmin(TEST_LISTING_ID);
        
        // Assert
        verify(storageService).delete("test-image-key");
        verify(carListingRepository).delete(testListing);
    }
    
    @Test
    void deleteListingAsAdmin_nonExistentListing_shouldThrowResourceNotFoundException() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(ResourceNotFoundException.class, () -> 
            carListingService.deleteListingAsAdmin(TEST_LISTING_ID));
        
        assertTrue(exception.getMessage().contains("not found"));
    }
}
