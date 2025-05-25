package com.autotrader.autotraderbackend.payload.response;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CarListingResponseTest {

    @Test
    void testDefaultConstructor() {
        CarListingResponse response = new CarListingResponse();
        
        assertNull(response.getId());
        assertNull(response.getTitle());
        // Check denormalized fields instead of direct brand/model
        assertNull(response.getBrandNameEn());
        assertNull(response.getBrandNameAr());
        assertNull(response.getModelNameEn());
        assertNull(response.getModelNameAr());
        assertNull(response.getModelYear());
        assertNull(response.getMileage());
        assertNull(response.getPrice());
        assertNull(response.getLocationDetails());
        assertNull(response.getDescription());
        assertNotNull(response.getMedia()); // Should be initialized as empty list
        assertTrue(response.getMedia().isEmpty());
        assertNull(response.getApproved());
        assertNull(response.getSellerId());
        assertNull(response.getSellerUsername());
        assertNull(response.getCreatedAt());
        assertNull(response.getIsSold());
        assertNull(response.getIsArchived());
        assertNull(response.getIsUserActive()); // Added assertion
    }

    @Test
    void testAllArgsConstructor() {
        // Setup test data
        Long id = 1L;
        String title = "Test Car";
        // Replaced brand and model with denormalized fields
        Integer modelYear = 2022;
        Integer mileage = 5000;
        BigDecimal price = new BigDecimal("25000.00");
        String brandNameEn = "Toyota";
        String brandNameAr = "تويوتا";
        String modelNameEn = "Camry";
        String modelNameAr = "كامري";
        LocationResponse locationDetails = new LocationResponse();
        String description = "Test Description";
        List<ListingMediaResponse> media = new ArrayList<>();
        Boolean approved = true;
        Long sellerId = 2L;
        String sellerUsername = "seller1";
        LocalDateTime createdAt = LocalDateTime.now();
        Boolean isSold = false;
        Boolean isArchived = false;
        Boolean isUserActive = true;
        Boolean isExpired = false;

        // Create response with all args constructor - adjusted for new fields
        CarListingResponse response = new CarListingResponse(
                id, title, modelYear, mileage, price,
                brandNameEn, brandNameAr, modelNameEn, modelNameAr,
                locationDetails, description, media, approved, sellerId,
                sellerUsername, createdAt, isSold, isArchived, isUserActive,
                isExpired
        );

        // Verify all fields
        assertEquals(id, response.getId());
        assertEquals(title, response.getTitle());
        assertEquals(brandNameEn, response.getBrandNameEn());
        assertEquals(brandNameAr, response.getBrandNameAr());
        assertEquals(modelNameEn, response.getModelNameEn());
        assertEquals(modelNameAr, response.getModelNameAr());
        assertEquals(modelYear, response.getModelYear());
        assertEquals(mileage, response.getMileage());
        assertEquals(price, response.getPrice());
        assertEquals(locationDetails, response.getLocationDetails());
        assertEquals(description, response.getDescription());
        assertEquals(media, response.getMedia());
        assertEquals(approved, response.getApproved());
        assertEquals(sellerId, response.getSellerId());
        assertEquals(sellerUsername, response.getSellerUsername());
        assertEquals(createdAt, response.getCreatedAt());
        assertEquals(isSold, response.getIsSold());
        assertEquals(isArchived, response.getIsArchived());
        assertEquals(isUserActive, response.getIsUserActive());
        assertEquals(isExpired, response.getIsExpired());
    }

    @Test
    void testSettersAndGetters() {
        // Create an empty response
        CarListingResponse response = new CarListingResponse();
        
        // Set properties
        response.setId(1L);
        response.setTitle("Test Car");
        // Use denormalized fields instead of direct brand/model
        response.setBrandNameEn("Toyota");
        response.setBrandNameAr("تويوتا");
        response.setModelNameEn("Camry");
        response.setModelNameAr("كامري");
        response.setModelYear(2022);
        response.setMileage(5000);
        response.setPrice(new BigDecimal("25000.00"));
        
        LocationResponse locationDetails = new LocationResponse();
        locationDetails.setId(1L);
        locationDetails.setDisplayNameEn("Test Location");
        response.setLocationDetails(locationDetails);
        
        response.setDescription("Test Description");
        
        List<ListingMediaResponse> media = new ArrayList<>();
        ListingMediaResponse mediaItem = new ListingMediaResponse();
        mediaItem.setId(1L);
        mediaItem.setUrl("http://example.com/image.jpg");
        media.add(mediaItem);
        response.setMedia(media);
        
        response.setApproved(true);
        response.setSellerId(2L);
        response.setSellerUsername("seller1");
        
        LocalDateTime now = LocalDateTime.now();
        response.setCreatedAt(now);
        
        response.setIsSold(false);
        response.setIsArchived(false);
        response.setIsUserActive(true);
        response.setIsExpired(false);
        
        // Verify properties
        assertEquals(1L, response.getId());
        assertEquals("Test Car", response.getTitle());
        assertEquals("Toyota", response.getBrandNameEn());
        assertEquals("تويوتا", response.getBrandNameAr());
        assertEquals("Camry", response.getModelNameEn());
        assertEquals("كامري", response.getModelNameAr());
        assertEquals(Integer.valueOf(2022), response.getModelYear());
        assertEquals(Integer.valueOf(5000), response.getMileage());
        assertEquals(new BigDecimal("25000.00"), response.getPrice());
        assertEquals(locationDetails, response.getLocationDetails());
        assertEquals("Test Location", response.getLocationDetails().getDisplayNameEn());
        assertEquals("Test Description", response.getDescription());
        assertEquals(1, response.getMedia().size());
        assertEquals("http://example.com/image.jpg", response.getMedia().get(0).getUrl());
        assertTrue(response.getApproved());
        assertEquals(2L, response.getSellerId());
        assertEquals("seller1", response.getSellerUsername());
        assertEquals(now, response.getCreatedAt());
        assertFalse(response.getIsSold());
        assertFalse(response.getIsArchived());
        assertTrue(response.getIsUserActive()); // Added assertion
        assertFalse(response.getIsExpired()); // Added assertion for isExpired
    }
}
