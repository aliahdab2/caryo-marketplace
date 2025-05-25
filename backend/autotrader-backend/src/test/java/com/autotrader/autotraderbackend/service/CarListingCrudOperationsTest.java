package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
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
    private LocationRepository locationRepository;

    @Mock
    private CarModelService carModelService;

    @Mock
    private StorageService storageService;

    @Mock
    private CarListingMapper carListingMapper;

    @InjectMocks
    private CarListingService carListingService;

    private CarListing testListing;
    private CarListingResponse testListingResponse;
    private User testUser;
    private Location testLocation;
    private CarBrand testCarBrand;
    private CarModel testCarModel;
    private static final String TEST_USERNAME = "testuser";
    private static final Long TEST_LISTING_ID = 1L;
    private static final Long TEST_LOCATION_ID = 1L;
    private static final Long TEST_CAR_MODEL_ID = 1L;
    private static final Long TEST_CAR_BRAND_ID = 1L;


    @BeforeEach
    void setUp() {
        // Set up test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername(TEST_USERNAME);

        // Set up test location
        testLocation = new Location();
        testLocation.setId(TEST_LOCATION_ID);
        testLocation.setDisplayNameEn("Test Location");
        testLocation.setDisplayNameAr("موقع اختبار");
        testLocation.setSlug("test-location");
        testLocation.setCountryCode("SY");

        // Set up test car brand
        testCarBrand = new CarBrand();
        testCarBrand.setId(TEST_CAR_BRAND_ID);
        testCarBrand.setName("TestBrand");
        testCarBrand.setDisplayNameEn("Test Brand");
        testCarBrand.setDisplayNameAr("علامة تجارية اختبار");
        testCarBrand.setSlug("test-brand");

        // Set up test car model
        testCarModel = new CarModel();
        testCarModel.setId(TEST_CAR_MODEL_ID);
        testCarModel.setName("TestModel");
        testCarModel.setDisplayNameEn("Test Model");
        testCarModel.setDisplayNameAr("نموذج اختبار");
        testCarModel.setSlug("test-model");
        testCarModel.setBrand(testCarBrand);

        // Set up test listing
        testListing = new CarListing();
        testListing.setId(TEST_LISTING_ID);
        testListing.setTitle("Test Car");
        testListing.setModel(testCarModel);
        testListing.setBrandNameEn(testCarBrand.getDisplayNameEn());
        testListing.setBrandNameAr(testCarBrand.getDisplayNameAr());
        testListing.setModelNameEn(testCarModel.getDisplayNameEn());
        testListing.setModelNameAr(testCarModel.getDisplayNameAr());
        testListing.setModelYear(2020);
        testListing.setMileage(10000);
        testListing.setPrice(new BigDecimal("15000.00"));
        testListing.setLocation(testLocation);
        testListing.setDescription("Test Description");
        testListing.setTransmission("Manual");
        testListing.setApproved(true);
        testListing.setSeller(testUser);
        testListing.setCreatedAt(LocalDateTime.now());
        
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
        testListingResponse.setBrandNameEn(testCarBrand.getDisplayNameEn());
        testListingResponse.setBrandNameAr(testCarBrand.getDisplayNameAr());
        testListingResponse.setModelNameEn(testCarModel.getDisplayNameEn());
        testListingResponse.setModelNameAr(testCarModel.getDisplayNameAr());
        testListingResponse.setModelYear(2020);
        testListingResponse.setPrice(new BigDecimal("15000.00"));
    }

    @Test
    void updateListing_ownedByUser_shouldUpdateFields() {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setPrice(new BigDecimal("16000.00"));
        updateRequest.setModelId(TEST_CAR_MODEL_ID); 
        updateRequest.setLocationId(TEST_LOCATION_ID);


        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));
        when(locationRepository.findById(TEST_LOCATION_ID)).thenReturn(Optional.of(testLocation));
        when(carModelService.getModelById(TEST_CAR_MODEL_ID)).thenReturn(testCarModel); // Mock CarModelService
        
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(invocation -> invocation.getArgument(0)); 
        
        CarListingResponse updatedResponse = new CarListingResponse();
        updatedResponse.setId(TEST_LISTING_ID);
        updatedResponse.setTitle("Updated Title");
        updatedResponse.setPrice(new BigDecimal("16000.00"));
        updatedResponse.setBrandNameEn(testCarBrand.getDisplayNameEn());
        updatedResponse.setBrandNameAr(testCarBrand.getDisplayNameAr());
        updatedResponse.setModelNameEn(testCarModel.getDisplayNameEn());
        updatedResponse.setModelNameAr(testCarModel.getDisplayNameAr());

        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(updatedResponse);


        // Act
        CarListingResponse result = carListingService.updateListing(TEST_LISTING_ID, updateRequest, TEST_USERNAME);

        // Assert
        assertNotNull(result);
        assertEquals(TEST_LISTING_ID, result.getId());
        assertEquals("Updated Title", result.getTitle());
        assertEquals(0, new BigDecimal("16000.00").compareTo(result.getPrice()));
        
        verify(carListingRepository).save(argThat(listing -> 
            "Updated Title".equals(listing.getTitle()) &&
            new BigDecimal("16000.00").equals(listing.getPrice()) &&
            listing.getModel().equals(testCarModel) &&
            listing.getLocation().equals(testLocation) 
        ));
        verify(locationRepository).findById(TEST_LOCATION_ID);
        verify(carModelService).getModelById(TEST_CAR_MODEL_ID); // Verify CarModelService interaction
    }

    @Test
    void updateListing_notOwnedByUser_shouldThrowSecurityException() {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setModelId(TEST_CAR_MODEL_ID);
        updateRequest.setLocationId(TEST_LOCATION_ID);
        
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

        // Act & Assert
        Exception exception = assertThrows(SecurityException.class, () -> 
            carListingService.updateListing(TEST_LISTING_ID, updateRequest, "differentuser"));
        
        assertEquals("You are not authorized to update this listing", exception.getMessage());
        verify(carListingRepository, never()).save(any(CarListing.class));
    }

    @Test
    void updateListing_nonExistentListing_shouldThrowResourceNotFoundException() {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setModelId(TEST_CAR_MODEL_ID);
        updateRequest.setLocationId(TEST_LOCATION_ID);
        
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(ResourceNotFoundException.class, () -> 
            carListingService.updateListing(TEST_LISTING_ID, updateRequest, TEST_USERNAME));
        
        assertTrue(exception.getMessage().contains("CarListing not found with id : '1'"));
    }

    @Test
    void deleteListing_ownedByUser_shouldDeleteSuccessfully() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));
        
        // Act
        carListingService.deleteListing(TEST_LISTING_ID, TEST_USERNAME);
        
        // Assert
        testListing.getMedia().forEach(media -> verify(storageService).delete(media.getFileKey()));
        verify(carListingRepository).delete(testListing);
    }

    @Test
    void deleteListing_notOwnedByUser_shouldThrowSecurityException() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

        // Act & Assert
        Exception exception = assertThrows(SecurityException.class, () -> 
            carListingService.deleteListing(TEST_LISTING_ID, "differentuser"));
        
        assertEquals("You are not authorized to delete this listing", exception.getMessage());
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
        
        assertTrue(exception.getMessage().contains("CarListing not found with id : '1'"));
    }
    
    @Test
    void deleteListingAsAdmin_shouldDeleteSuccessfully() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));
        
        // Act
        carListingService.deleteListingAsAdmin(TEST_LISTING_ID);
        
        // Assert
        testListing.getMedia().forEach(media -> verify(storageService).delete(media.getFileKey()));
        verify(carListingRepository).delete(testListing);
    }
    
    @Test
    void deleteListingAsAdmin_nonExistentListing_shouldThrowResourceNotFoundException() {
        // Arrange
        when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.empty());

        // Act & Assert
        Exception exception = assertThrows(ResourceNotFoundException.class, () -> 
            carListingService.deleteListingAsAdmin(TEST_LISTING_ID));
        
        assertTrue(exception.getMessage().contains("CarListing not found with id : '1'"));
    }
}
