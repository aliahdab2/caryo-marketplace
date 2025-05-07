package com.autotrader.autotraderbackend.mapper;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.Location; // Ensure this import is present
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.ListingMediaResponse;
// Ensure com.autotrader.autotraderbackend.payload.response.LocationResponse is NOT imported here
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)

class CarListingMapperTest {

    @Mock
    private StorageService storageService;

    @InjectMocks
    private CarListingMapper carListingMapper;

    private CarListing testCarListing;
    private User testSeller;

    @BeforeEach
    void setUp() {
        testSeller = new User();
        testSeller.setId(1L);
        testSeller.setUsername("testseller");

        Location testLocation = new Location(); // Create Location object
        testLocation.setId(1L);
        testLocation.setDisplayNameEn("Test City");
        testLocation.setDisplayNameAr("مدينة اختبار");
        testLocation.setSlug("test-city");
        testLocation.setCountryCode("SY"); // Set the required countryCode field

        testCarListing = new CarListing();
        testCarListing.setId(10L);
        testCarListing.setTitle("Test Toyota");
        testCarListing.setBrand("Toyota");
        testCarListing.setModel("Camry");
        testCarListing.setModelYear(2021);
        testCarListing.setPrice(new BigDecimal("25000.00"));
        testCarListing.setMileage(15000);
        testCarListing.setDescription("A great test car");
        testCarListing.setLocation(testLocation); // Use setLocation instead of setLocationEntity
        testCarListing.setCreatedAt(LocalDateTime.now().minusDays(1));
        testCarListing.setApproved(true);
        testCarListing.setSeller(testSeller);
        
        // Add media instead of imageKey
        ListingMedia primaryImage = new ListingMedia();
        primaryImage.setCarListing(testCarListing);
        primaryImage.setFileKey("listings/10/image.jpg");
        primaryImage.setFileName("image.jpg");
        primaryImage.setContentType("image/jpeg");
        primaryImage.setSize(1024L);
        primaryImage.setSortOrder(0);
        primaryImage.setIsPrimary(true);
        primaryImage.setMediaType("image");
        testCarListing.addMedia(primaryImage);
    }

    @Test
    void toCarListingResponse_WithFullData_ShouldMapCorrectly() {
        // Arrange
        String expectedSignedUrl = "http://example.com/signed/image.jpg";
        when(storageService.getSignedUrl(eq("listings/10/image.jpg"), anyLong())).thenReturn(expectedSignedUrl);

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertEquals(testCarListing.getId(), response.getId());
        assertEquals(testCarListing.getTitle(), response.getTitle());
        assertEquals(testCarListing.getBrand(), response.getBrand());
        assertEquals(testCarListing.getModel(), response.getModel());
        assertEquals(testCarListing.getModelYear(), response.getModelYear());
        assertEquals(0, testCarListing.getPrice().compareTo(response.getPrice()));
        assertEquals(testCarListing.getMileage(), response.getMileage());
        assertEquals(testCarListing.getDescription(), response.getDescription());
        
        // Assert LocationDetails (new way)
        assertNotNull(response.getLocationDetails());
        assertEquals(testCarListing.getLocation().getId(), response.getLocationDetails().getId());
        assertEquals(testCarListing.getLocation().getDisplayNameEn(), response.getLocationDetails().getDisplayNameEn());
        // Assert other LocationDetails fields if necessary

        assertEquals(testCarListing.getCreatedAt(), response.getCreatedAt());
        assertEquals(testCarListing.getApproved(), response.getApproved());
        assertEquals(testSeller.getId(), response.getSellerId());
        assertEquals(testSeller.getUsername(), response.getSellerUsername());
        
        // Assert media collection
        assertNotNull(response.getMedia());
        assertEquals(1, response.getMedia().size());
        ListingMediaResponse mediaResponse = response.getMedia().get(0);
        assertNotNull(mediaResponse);
        assertEquals("listings/10/image.jpg", mediaResponse.getFileKey());
        assertEquals("image.jpg", mediaResponse.getFileName());
        assertEquals("image/jpeg", mediaResponse.getContentType());
        assertEquals(1024L, mediaResponse.getSize());
        assertEquals(0, mediaResponse.getSortOrder());
        assertTrue(mediaResponse.getIsPrimary());
        assertEquals("image", mediaResponse.getMediaType());
        assertEquals(expectedSignedUrl, mediaResponse.getUrl());

        verify(storageService).getSignedUrl(eq("listings/10/image.jpg"), anyLong());
    }

    @Test
    void toCarListingResponse_WithNoMedia_ShouldHaveEmptyMediaList() {
        // Arrange - clear all media
        testCarListing.getMedia().clear();

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertTrue(response.getMedia().isEmpty());
        verify(storageService, never()).getSignedUrl(anyString(), anyLong());
    }

    @Test
    void toCarListingResponse_WithBlankImageKey_ShouldHaveNullMediaUrl() {
        // Arrange - set blank file key
        testCarListing.getMedia().clear();
        ListingMedia blankKeyMedia = new ListingMedia();
        blankKeyMedia.setCarListing(testCarListing);
        blankKeyMedia.setFileKey("   ");
        blankKeyMedia.setFileName("image.jpg");
        blankKeyMedia.setContentType("image/jpeg");
        blankKeyMedia.setSize(1024L);
        blankKeyMedia.setSortOrder(0);
        blankKeyMedia.setIsPrimary(true);
        blankKeyMedia.setMediaType("image");
        testCarListing.addMedia(blankKeyMedia);

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getMedia().size());
        assertNull(response.getMedia().get(0).getUrl());
        verify(storageService, never()).getSignedUrl(anyString(), anyLong());
    }

    @Test
    void toCarListingResponse_WithNullSeller_ShouldHaveNullSellerInfo() {
        // Arrange
        testCarListing.setSeller(null);

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertNull(response.getSellerId());
        assertNull(response.getSellerUsername());
    }

    @Test
    void toCarListingResponse_WithNullInput_ShouldReturnNull() {
        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(null);

        // Assert
        assertNull(response);
        verify(storageService, never()).getSignedUrl(anyString(), anyLong());
    }

    @Test
    void toCarListingResponse_WhenGetSignedUrlThrowsUnsupportedOperation_ShouldHaveNullMediaUrl() {
        // Arrange - using primary image file key for test
        when(storageService.getSignedUrl(eq("listings/10/image.jpg"), anyLong()))
                .thenThrow(new UnsupportedOperationException("Not supported"));

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getMedia().size());
        assertNull(response.getMedia().get(0).getUrl());
        verify(storageService).getSignedUrl(eq("listings/10/image.jpg"), anyLong());
    }

    @Test
    void toCarListingResponse_WhenGetSignedUrlThrowsGenericException_ShouldHaveNullMediaUrl() {
        // Arrange - using primary image file key for test
        when(storageService.getSignedUrl(eq("listings/10/image.jpg"), anyLong()))
                .thenThrow(new RuntimeException("Something went wrong"));

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getMedia().size());
        assertNull(response.getMedia().get(0).getUrl());
        verify(storageService).getSignedUrl(eq("listings/10/image.jpg"), anyLong());
    }
    
    @Test
    void toCarListingResponse_WithMultipleMedia_ShouldMapAllMedia() {
        // Arrange - add a second media item
        String expectedSignedUrl1 = "http://example.com/signed/image1.jpg";
        String expectedSignedUrl2 = "http://example.com/signed/image2.jpg";
        
        // Clear existing media and add two new items
        testCarListing.getMedia().clear();
        
        ListingMedia primaryImage = new ListingMedia();
        primaryImage.setId(101L);
        primaryImage.setCarListing(testCarListing);
        primaryImage.setFileKey("listings/10/image1.jpg");
        primaryImage.setFileName("image1.jpg");
        primaryImage.setContentType("image/jpeg");
        primaryImage.setSize(1024L);
        primaryImage.setSortOrder(0);
        primaryImage.setIsPrimary(true);
        primaryImage.setMediaType("image");
        testCarListing.addMedia(primaryImage);
        
        ListingMedia secondaryImage = new ListingMedia();
        secondaryImage.setId(102L);
        secondaryImage.setCarListing(testCarListing);
        secondaryImage.setFileKey("listings/10/image2.jpg");
        secondaryImage.setFileName("image2.jpg");
        secondaryImage.setContentType("image/jpeg");
        secondaryImage.setSize(2048L);
        secondaryImage.setSortOrder(1);
        secondaryImage.setIsPrimary(false);
        secondaryImage.setMediaType("image");
        testCarListing.addMedia(secondaryImage);
        
        when(storageService.getSignedUrl(eq("listings/10/image1.jpg"), anyLong())).thenReturn(expectedSignedUrl1);
        when(storageService.getSignedUrl(eq("listings/10/image2.jpg"), anyLong())).thenReturn(expectedSignedUrl2);
        
        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);
        
        // Assert
        assertNotNull(response);
        
        // Check media collection
        assertNotNull(response.getMedia());
        assertEquals(2, response.getMedia().size());
        
        // Check first media item (should be primary)
        ListingMediaResponse media1 = response.getMedia().get(0);
        assertEquals(101L, media1.getId());
        assertEquals("listings/10/image1.jpg", media1.getFileKey());
        assertEquals("image1.jpg", media1.getFileName());
        assertEquals("image/jpeg", media1.getContentType());
        assertEquals(1024L, media1.getSize());
        assertEquals(0, media1.getSortOrder());
        assertTrue(media1.getIsPrimary());
        assertEquals("image", media1.getMediaType());
        assertEquals(expectedSignedUrl1, media1.getUrl());
        
        // Check second media item
        ListingMediaResponse media2 = response.getMedia().get(1);
        assertEquals(102L, media2.getId());
        assertEquals("listings/10/image2.jpg", media2.getFileKey());
        assertEquals("image2.jpg", media2.getFileName());
        assertEquals("image/jpeg", media2.getContentType());
        assertEquals(2048L, media2.getSize());
        assertEquals(1, media2.getSortOrder());
        assertFalse(media2.getIsPrimary());
        assertEquals("image", media2.getMediaType());
        assertEquals(expectedSignedUrl2, media2.getUrl());
        
        // Verify that signed URLs were generated for both images
        verify(storageService).getSignedUrl(eq("listings/10/image1.jpg"), anyLong());
        verify(storageService).getSignedUrl(eq("listings/10/image2.jpg"), anyLong());
    }
}
