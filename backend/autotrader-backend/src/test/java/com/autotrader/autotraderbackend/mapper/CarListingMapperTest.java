package com.autotrader.autotraderbackend.mapper;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
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

        testCarListing = new CarListing();
        testCarListing.setId(10L);
        testCarListing.setTitle("Test Toyota");
        testCarListing.setBrand("Toyota");
        testCarListing.setModel("Camry");
        testCarListing.setModelYear(2021);
        testCarListing.setPrice(new BigDecimal("25000.00"));
        testCarListing.setMileage(15000);
        testCarListing.setDescription("A great test car");
        testCarListing.setLocation("Test City");
        testCarListing.setCreatedAt(LocalDateTime.now().minusDays(1));
        testCarListing.setApproved(true);
        testCarListing.setSeller(testSeller);
        testCarListing.setImageKey("listings/10/image.jpg");
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
        assertEquals(testCarListing.getLocation(), response.getLocation());
        assertEquals(testCarListing.getCreatedAt(), response.getCreatedAt());
        assertEquals(testCarListing.getApproved(), response.getApproved());
        assertEquals(testSeller.getId(), response.getSellerId());
        assertEquals(testSeller.getUsername(), response.getSellerUsername());
        assertEquals(expectedSignedUrl, response.getImageUrl());

        verify(storageService).getSignedUrl(eq("listings/10/image.jpg"), anyLong());
    }

    @Test
    void toCarListingResponse_WithNullImageKey_ShouldHaveNullImageUrl() {
        // Arrange
        testCarListing.setImageKey(null);

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertNull(response.getImageUrl());
        verify(storageService, never()).getSignedUrl(anyString(), anyLong());
    }

    @Test
    void toCarListingResponse_WithBlankImageKey_ShouldHaveNullImageUrl() {
        // Arrange
        testCarListing.setImageKey("   ");

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertNull(response.getImageUrl());
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
    void toCarListingResponse_WhenGetSignedUrlThrowsUnsupportedOperation_ShouldHaveNullImageUrl() {
        // Arrange
        when(storageService.getSignedUrl(eq("listings/10/image.jpg"), anyLong()))
                .thenThrow(new UnsupportedOperationException("Not supported"));

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertNull(response.getImageUrl());
        verify(storageService).getSignedUrl(eq("listings/10/image.jpg"), anyLong());
    }

    @Test
    void toCarListingResponse_WhenGetSignedUrlThrowsGenericException_ShouldHaveNullImageUrl() {
        // Arrange
        when(storageService.getSignedUrl(eq("listings/10/image.jpg"), anyLong()))
                .thenThrow(new RuntimeException("Something went wrong"));

        // Act
        CarListingResponse response = carListingMapper.toCarListingResponse(testCarListing);

        // Assert
        assertNotNull(response);
        assertNull(response.getImageUrl());
        verify(storageService).getSignedUrl(eq("listings/10/image.jpg"), anyLong());
    }
}
