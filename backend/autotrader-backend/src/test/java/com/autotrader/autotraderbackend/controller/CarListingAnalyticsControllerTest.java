package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.BodyStyle;
import com.autotrader.autotraderbackend.model.FuelType;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.service.BodyStyleService;
import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.service.FuelTypeService;
import com.autotrader.autotraderbackend.service.I18nService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CarListingAnalyticsController.
 * Tests the analytics endpoints that were extracted from CarListingController.
 */
@ExtendWith(MockitoExtension.class)
class CarListingAnalyticsControllerTest {

    @Mock
    private CarListingService carListingService;

    @Mock
    private BodyStyleService bodyStyleService;

    @Mock
    private FuelTypeService fuelTypeService;

    @Mock
    private I18nService i18nService;

    @InjectMocks
    private CarListingAnalyticsController analyticsController;

    private ListingFilterRequest filterRequest;

    @BeforeEach
    void setUp() {
        filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota", "honda"));
        filterRequest.setModelSlugs(Arrays.asList("camry", "civic"));

        // Setup default service mocks
        lenient().when(bodyStyleService.getAllBodyStyles()).thenReturn(Arrays.asList(
            createBodyStyle("sedan"), createBodyStyle("suv"), createBodyStyle("hatchback")
        ));
        lenient().when(fuelTypeService.getAllFuelTypes()).thenReturn(Arrays.asList(
            createFuelType("gasoline"), createFuelType("diesel"), createFuelType("electric")
        ));

        // Setup default i18n mock behavior - make stubbings lenient to avoid unnecessary stubbing warnings
        lenient().when(i18nService.getMessage(anyString(), anyString())).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(i18nService.getMessage(anyString(), any(HttpServletRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private BodyStyle createBodyStyle(String name) {
        BodyStyle bodyStyle = new BodyStyle();
        bodyStyle.setName(name);
        return bodyStyle;
    }

    private FuelType createFuelType(String slug) {
        FuelType fuelType = new FuelType();
        fuelType.setSlug(slug);
        return fuelType;
    }

    @Test
    void getApprovedListingsCount_ShouldReturnCount() {
        // Arrange
        long expectedCount = 150L;
        when(carListingService.getApprovedListingsCount()).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getApprovedListingsCount();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getApprovedListingsCount();
    }

    @Test
    void getApprovedListingsCount_WithException_ShouldReturnZero() {
        // Arrange
        when(carListingService.getApprovedListingsCount()).thenThrow(new RuntimeException("Database error"));

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getApprovedListingsCount();

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(0L, response.getBody().get("count"));
    }

    @Test
    void getFilteredListingsCount_WithPostRequest_ShouldReturnCount() {
        // Arrange
        long expectedCount = 42L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getFilteredListingsCount(filterRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter ->
            filter.getBrandSlugs().equals(filterRequest.getBrandSlugs()) &&
            filter.getModelSlugs().equals(filterRequest.getModelSlugs())
        ));
    }

    @Test
    void getFilteredListingsCount_WithEmptyFilter_ShouldReturnTotalCount() {
        // Arrange
        ListingFilterRequest emptyFilter = new ListingFilterRequest();
        long expectedCount = 1000L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getFilteredListingsCount(emptyFilter);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
    }

    @Test
    void getFilteredListingsCountByParams_WithBrandSlugs_ShouldReturnCount() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("toyota", "honda");
        long expectedCount = 75L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getFilteredListingsCountByParams(
            brandSlugs, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter ->
            filter.getBrandSlugs().equals(brandSlugs)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithLocationId_ShouldReturnCount() {
        // Arrange
        Long locationId = 123L;
        long expectedCount = 25L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getFilteredListingsCountByParams(
            null, null, null, null, null, locationId, null, null, null, null, null, null, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter ->
            filter.getLocationId().equals(locationId)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithPriceRange_ShouldReturnCount() {
        // Arrange
        BigDecimal minPrice = BigDecimal.valueOf(10000);
        BigDecimal maxPrice = BigDecimal.valueOf(50000);
        long expectedCount = 50L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, minPrice, maxPrice, null, null, null, null, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter ->
            filter.getMinPrice().equals(minPrice) && filter.getMaxPrice().equals(maxPrice)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithSoldFlag_ShouldReturnCount() {
        // Arrange
        Boolean isSold = true;
        long expectedCount = 10L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, null, null, null, null, isSold, null, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter ->
            filter.getIsSold().equals(isSold)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithArchivedFlag_ShouldReturnCount() {
        // Arrange
        Boolean isArchived = false;
        long expectedCount = 200L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, null, null, null, null, null, isArchived, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter ->
            filter.getIsArchived().equals(isArchived)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithSearchQuery_ShouldReturnCount() {
        // Arrange
        String searchQuery = "Toyota Camry";
        long expectedCount = 5L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, searchQuery);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter ->
            filter.getSearchQuery().equals(searchQuery)
        ));
    }

    @Test
    void getFilterBreakdown_ShouldReturnBreakdown() {
        // Arrange
        Map<String, Object> expectedBreakdown = Map.of(
            "brands", Map.of("toyota", 100L, "honda", 80L),
            "models", Map.of("camry", 50L, "civic", 30L)
        );
        when(carListingService.getFilterBreakdown(null)).thenReturn(expectedBreakdown);

        // Act
        ResponseEntity<Map<String, Object>> response = analyticsController.getFilterBreakdown();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedBreakdown, response.getBody());
        verify(carListingService).getFilterBreakdown(null);
    }

    @Test
    void getFilterBreakdownWithFilters_ShouldReturnFilteredBreakdown() {
        // Arrange
        Map<String, Object> expectedBreakdown = Map.of("brands", Map.of("toyota", 50L));
        when(carListingService.getFilterBreakdown(filterRequest)).thenReturn(expectedBreakdown);

        // Act
        ResponseEntity<Map<String, Object>> response = analyticsController.getFilterBreakdownWithFilters(filterRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedBreakdown, response.getBody());
        verify(carListingService).getFilterBreakdown(filterRequest);
    }

    @Test
    void getCountsByYear_ShouldReturnYearCounts() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("toyota");
        Map<String, Long> expectedCounts = Map.of("2024", 50L, "2023", 40L, "2022", 30L);
        when(carListingService.getCountsByYear(any(ListingFilterRequest.class))).thenReturn(expectedCounts);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getCountsByYear(
            brandSlugs, null, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedCounts, response.getBody());
        verify(carListingService).getCountsByYear(argThat(filter ->
            filter.getBrandSlugs().equals(brandSlugs)
        ));
    }

    @Test
    void getCountsByBrand_ShouldReturnBrandCounts() {
        // Arrange
        List<String> modelSlugs = Arrays.asList("camry");
        Map<String, Long> expectedCounts = Map.of("toyota", 100L, "honda", 80L);
        when(carListingService.getCountsByBrand(any(ListingFilterRequest.class))).thenReturn(expectedCounts);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getCountsByBrand(
            modelSlugs, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedCounts, response.getBody());
        verify(carListingService).getCountsByBrand(argThat(filter ->
            filter.getModelSlugs().equals(modelSlugs)
        ));
    }

    @Test
    void getCountsByModel_ShouldReturnModelCounts() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("toyota");
        Map<String, Long> expectedCounts = Map.of("camry", 50L, "corolla", 30L);
        when(carListingService.getCountsByModel(any(ListingFilterRequest.class))).thenReturn(expectedCounts);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getCountsByModel(
            brandSlugs, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedCounts, response.getBody());
        verify(carListingService).getCountsByModel(argThat(filter ->
            filter.getBrandSlugs().equals(brandSlugs)
        ));
    }

    @Test
    void getCountsBySellerType_ShouldReturnSellerTypeCounts() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("toyota");
        Map<String, Long> expectedCounts = Map.of("private", 100L, "dealer", 200L);
        when(carListingService.getCountsBySellerType(any(ListingFilterRequest.class))).thenReturn(expectedCounts);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getCountsBySellerType(
            brandSlugs, null, null, null, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedCounts, response.getBody());
        verify(carListingService).getCountsBySellerType(argThat(filter ->
            filter.getBrandSlugs().equals(brandSlugs)
        ));
    }

    @Test
    void getCountsByFuelType_ShouldReturnFuelTypeCounts() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("toyota");
        Map<String, Long> expectedCounts = Map.of("gasoline", 80L, "diesel", 20L);
        when(carListingService.getCountsByFuelType(any(ListingFilterRequest.class))).thenReturn(expectedCounts);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getCountsByFuelType(
            brandSlugs, null, null, null, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedCounts, response.getBody());
        verify(carListingService).getCountsByFuelType(argThat(filter ->
            filter.getBrandSlugs().equals(brandSlugs)
        ));
    }

    @Test
    void getCountsByTransmission_ShouldReturnTransmissionCounts() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("toyota");
        Map<String, Long> expectedCounts = Map.of("manual", 60L, "automatic", 40L);
        when(carListingService.getCountsByTransmission(any(ListingFilterRequest.class))).thenReturn(expectedCounts);

        // Act
        ResponseEntity<Map<String, Long>> response = analyticsController.getCountsByTransmission(
            brandSlugs, null, null, null, null, null, null, null, null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedCounts, response.getBody());
        verify(carListingService).getCountsByTransmission(argThat(filter ->
            filter.getBrandSlugs().equals(brandSlugs)
        ));
    }
}
