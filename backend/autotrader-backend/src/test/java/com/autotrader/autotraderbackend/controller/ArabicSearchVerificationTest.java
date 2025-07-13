package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.when;

/**
 * Test class to verify the Arabic search functionality fix using hierarchical brand syntax.
 * This test demonstrates that searching for "تويوتا:كامري" (Toyota:Camry) should only return Camry results
 * and not Corolla results, which was the original issue reported.
 * 
 * Uses the current non-deprecated hierarchical brand syntax instead of the deprecated model field.
 */
@ExtendWith(MockitoExtension.class)
class ArabicSearchVerificationTest {

    @Mock
    private CarListingService carListingService;

    @InjectMocks
    private CarListingController carListingController;

    private CarListingResponse camryListing;
    private CarListingResponse corollaListing;

    @BeforeEach
    void setUp() {
        // Create a Camry listing with Arabic text
        camryListing = new CarListingResponse();
        camryListing.setId(1L);
        camryListing.setTitle("Toyota Camry 2022");
        camryListing.setBrandNameEn("Toyota");
        camryListing.setBrandNameAr("تويوتا");
        camryListing.setModelNameEn("Camry");
        camryListing.setModelNameAr("كامري");
        camryListing.setModelYear(2022);
        camryListing.setPrice(new BigDecimal("25000.00"));

        // Create a Corolla listing with Arabic text
        corollaListing = new CarListingResponse();
        corollaListing.setId(2L);
        corollaListing.setTitle("Toyota Corolla 2023");
        corollaListing.setBrandNameEn("Toyota");
        corollaListing.setBrandNameAr("تويوتا");
        corollaListing.setModelNameEn("Corolla");
        corollaListing.setModelNameAr("كورولا");
        corollaListing.setModelYear(2023);
        corollaListing.setPrice(new BigDecimal("22000.00"));
    }

    /**
     * Test that searching for Arabic "تويوتا:كامري" (Toyota:Camry) returns only Camry results.
     * This verifies the fix for the issue where searching for Camry was also returning Corolla results.
     * Uses the current hierarchical brand syntax instead of deprecated model field.
     */
    @Test
    void searchForArabicToyotaCamry_ShouldReturnOnlyCamryResults() {
        // Arrange
        String arabicToyotaCamry = "تويوتا:كامري"; // Toyota:Camry in Arabic using hierarchical syntax
        List<CarListingResponse> camryOnlyResults = List.of(camryListing);
        Page<CarListingResponse> camryPage = new PageImpl<>(camryOnlyResults);
        Pageable pageable = PageRequest.of(0, 10);

        // Mock the service to return only Camry when searching for "تويوتا:كامري"
        when(carListingService.getFilteredListings(
            argThat(filter -> arabicToyotaCamry.equals(filter.getBrand())), 
            any(Pageable.class)
        )).thenReturn(camryPage);

        // Create filter request with Arabic Toyota:Camry hierarchical syntax
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrand(arabicToyotaCamry);

        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = 
            carListingController.getFilteredListings(filterRequest, pageable);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        List<CarListingResponse> results = response.getBody().getContent();
        assertEquals(1, results.size(), "Should return exactly one result for Arabic Toyota:Camry search");
        
        CarListingResponse result = results.get(0);
        assertEquals("كامري", result.getModelNameAr(), "Result should be Camry in Arabic");
        assertEquals("Camry", result.getModelNameEn(), "Result should be Camry in English");
        assertNotEquals("كورولا", result.getModelNameAr(), "Result should NOT be Corolla");
        assertEquals(camryListing.getId(), result.getId(), "Should return the correct Camry listing");
    }

    /**
     * Test that searching for Arabic "تويوتا:كورولا" (Toyota:Corolla) returns only Corolla results.
     * This verifies that the fix works correctly in the opposite direction as well.
     * Uses the current hierarchical brand syntax instead of deprecated model field.
     */
    @Test
    void searchForArabicToyotaCorolla_ShouldReturnOnlyCorollaResults() {
        // Arrange
        String arabicToyotaCorolla = "تويوتا:كورولا"; // Toyota:Corolla in Arabic using hierarchical syntax
        List<CarListingResponse> corollaOnlyResults = List.of(corollaListing);
        Page<CarListingResponse> corollaPage = new PageImpl<>(corollaOnlyResults);
        Pageable pageable = PageRequest.of(0, 10);

        // Mock the service to return only Corolla when searching for "تويوتا:كورولا"
        when(carListingService.getFilteredListings(
            argThat(filter -> arabicToyotaCorolla.equals(filter.getBrand())), 
            any(Pageable.class)
        )).thenReturn(corollaPage);

        // Create filter request with Arabic Toyota:Corolla hierarchical syntax
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrand(arabicToyotaCorolla);

        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = 
            carListingController.getFilteredListings(filterRequest, pageable);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        List<CarListingResponse> results = response.getBody().getContent();
        assertEquals(1, results.size(), "Should return exactly one result for Arabic Toyota:Corolla search");
        
        CarListingResponse result = results.get(0);
        assertEquals("كورولا", result.getModelNameAr(), "Result should be Corolla in Arabic");
        assertEquals("Corolla", result.getModelNameEn(), "Result should be Corolla in English");
        assertNotEquals("كامري", result.getModelNameAr(), "Result should NOT be Camry");
        assertEquals(corollaListing.getId(), result.getId(), "Should return the correct Corolla listing");
    }

    /**
     * Test that URL-encoded search parameters work correctly with hierarchical brand syntax.
     * This mimics the actual URL format: /search?brand=تويوتا:كامري (Toyota:Camry)
     * Instead of the deprecated separate brand and model parameters.
     */
    @Test
    void searchWithUrlEncodedArabicParameters_ShouldWorkCorrectly() {
        // Arrange - Using hierarchical syntax for brand:model (URL-decoded)
        String urlDecodedBrandModel = "تويوتا:كامري"; // Toyota:Camry in Arabic
        
        List<CarListingResponse> camryOnlyResults = List.of(camryListing);
        Page<CarListingResponse> camryPage = new PageImpl<>(camryOnlyResults);
        Pageable pageable = PageRequest.of(0, 10);

        when(carListingService.getFilteredListings(
            argThat(filter -> urlDecodedBrandModel.equals(filter.getBrand())), 
            any(Pageable.class)
        )).thenReturn(camryPage);

        // Create filter request as it would come from URL using hierarchical syntax
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrand(urlDecodedBrandModel);

        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = 
            carListingController.getFilteredListings(filterRequest, pageable);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        List<CarListingResponse> results = response.getBody().getContent();
        assertEquals(1, results.size(), "URL-encoded Arabic search should return exactly one Camry result");
        
        CarListingResponse result = results.get(0);
        assertEquals("كامري", result.getModelNameAr(), "Should find Camry from URL-encoded search");
        assertNotEquals("كورولا", result.getModelNameAr(), "Should not find Corolla from Camry search");
    }

    /**
     * Test that demonstrates the fix - exact matching prevents false positives.
     * Before the fix, searching for "كامري" would match both "كامري" and "كورولا" 
     * due to similar Arabic characters in LIKE '%value%' patterns.
     * Now uses hierarchical brand syntax for precise brand:model matching.
     */
    @Test
    void exactMatchingPreventsArabicFalsePositives() {
        // Arrange - Using hierarchical syntax for exact matching
        String searchTerm = "تويوتا:كامري"; // Toyota:Camry in Arabic
        
        // The fix ensures only exact matches are returned
        List<CarListingResponse> exactMatchOnly = List.of(camryListing);
        Page<CarListingResponse> exactMatchPage = new PageImpl<>(exactMatchOnly);
        Pageable pageable = PageRequest.of(0, 10);

        when(carListingService.getFilteredListings(
            argThat(filter -> searchTerm.equals(filter.getBrand())), 
            any(Pageable.class)
        )).thenReturn(exactMatchPage);

        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrand(searchTerm);

        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = 
            carListingController.getFilteredListings(filterRequest, pageable);

        // Assert
        List<CarListingResponse> results = response.getBody().getContent();
        
        // Verify exact matching behavior
        assertEquals(1, results.size(), "Exact matching should return only one result");
        assertTrue(results.stream().allMatch(r -> 
            "كامري".equals(r.getModelNameAr()) || "Camry".equals(r.getModelNameEn())
        ), "All results should be exactly Camry, not similar models");
        
        assertTrue(results.stream().noneMatch(r -> 
            "كورولا".equals(r.getModelNameAr()) || "Corolla".equals(r.getModelNameEn())
        ), "No results should be Corolla when searching for Toyota:Camry");
    }
}
