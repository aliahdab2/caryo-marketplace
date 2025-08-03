package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SavedSearchMatchingService
 */
@ExtendWith(MockitoExtension.class)
class SavedSearchMatchingServiceTest {

    @InjectMocks
    private SavedSearchMatchingService matchingService;

    private SavedSearch savedSearch;
    private CarListing carListing;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");

        // Create saved search with filters
        Map<String, Object> filters = new HashMap<>();
        filters.put("brands", List.of("toyota", "honda"));
        filters.put("minPrice", 15000);
        filters.put("maxPrice", 30000);
        filters.put("minYear", 2020);
        filters.put("maxYear", 2024);

        Map<String, Object> notificationPrefs = new HashMap<>();
        notificationPrefs.put("email", true);
        notificationPrefs.put("frequency", "immediate");

        savedSearch = new SavedSearch(user, "Test Search", "بحث تجريبي", filters, notificationPrefs);

        // Create car listing
        carListing = new CarListing();
        carListing.setId(1L);
        carListing.setTitle("2022 Toyota Camry");
        carListing.setPrice(BigDecimal.valueOf(25000));
        carListing.setModelYear(2022);
        carListing.setMileage(15000);

        // Create brand and model
        CarBrand toyota = new CarBrand();
        toyota.setSlug("toyota");
        toyota.setDisplayNameEn("Toyota");

        CarModel camry = new CarModel();
        camry.setSlug("camry");
        camry.setDisplayNameEn("Camry");
        camry.setBrand(toyota);

        carListing.setModel(camry);
    }

    @Test
    void matches_WithMatchingCriteria_ShouldReturnTrue() {
        // Act
        boolean result = matchingService.matches(savedSearch, carListing);

        // Assert
        assertTrue(result);
    }

    @Test
    void matches_WithNonMatchingBrand_ShouldReturnFalse() {
        // Arrange
        CarBrand nissan = new CarBrand();
        nissan.setSlug("nissan");
        nissan.setDisplayNameEn("Nissan");

        CarModel altima = new CarModel();
        altima.setSlug("altima");
        altima.setDisplayNameEn("Altima");
        altima.setBrand(nissan);

        carListing.setModel(altima);

        // Act
        boolean result = matchingService.matches(savedSearch, carListing);

        // Assert
        assertFalse(result);
    }

    @Test
    void matches_WithPriceTooHigh_ShouldReturnFalse() {
        // Arrange
        carListing.setPrice(BigDecimal.valueOf(35000)); // Above max price

        // Act
        boolean result = matchingService.matches(savedSearch, carListing);

        // Assert
        assertFalse(result);
    }

    @Test
    void matches_WithPriceTooLow_ShouldReturnFalse() {
        // Arrange
        carListing.setPrice(BigDecimal.valueOf(10000)); // Below min price

        // Act
        boolean result = matchingService.matches(savedSearch, carListing);

        // Assert
        assertFalse(result);
    }

    @Test
    void matches_WithYearTooOld_ShouldReturnFalse() {
        // Arrange
        carListing.setModelYear(2018); // Below min year

        // Act
        boolean result = matchingService.matches(savedSearch, carListing);

        // Assert
        assertFalse(result);
    }

    @Test
    void matches_WithNullSearchOrListing_ShouldReturnFalse() {
        // Act & Assert
        assertFalse(matchingService.matches(null, carListing));
        assertFalse(matchingService.matches(savedSearch, null));
        assertFalse(matchingService.matches(null, null));
    }

    @Test
    void matches_WithNoFilters_ShouldReturnTrue() {
        // Arrange
        savedSearch.setFilters(new HashMap<>());

        // Act
        boolean result = matchingService.matches(savedSearch, carListing);

        // Assert
        assertTrue(result);
    }

    @Test
    void matches_WithTransmissionFilter_ShouldMatchCorrectly() {
        // Arrange
        Map<String, Object> filters = savedSearch.getFilters();
        filters.put("transmissionId", 1L); // Use transmissionId instead of transmission

        Transmission automatic = new Transmission();
        automatic.setId(1L);
        automatic.setName("automatic");
        carListing.setTransmissionType(automatic);

        // Act
        boolean result = matchingService.matches(savedSearch, carListing);

        // Assert
        assertTrue(result);

        // Test with non-matching transmission
        filters.put("transmissionId", 2L); // Different ID
        result = matchingService.matches(savedSearch, carListing);
        assertFalse(result);
    }
}
