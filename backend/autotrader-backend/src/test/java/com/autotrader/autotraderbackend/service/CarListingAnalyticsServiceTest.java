package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.repository.CarListingRepository;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingAnalyticsServiceTest extends BaseCarListingTest {

    @Mock
    private CarListingRepository carListingRepository;


    @InjectMocks
    private CarListingAnalyticsService analyticsService;

    private ListingFilterRequest filterRequest;
    private List<Object[]> mockYearCounts;
    private List<Object[]> mockBrandCounts;
    private List<Object[]> mockModelCounts;
    private List<Object[]> mockSellerTypeCounts;
    private List<Object[]> mockFuelTypeCounts;

    @BeforeEach
    void setUp() {
        filterRequest = new ListingFilterRequest();

        // Setup mock data for year counts
        mockYearCounts = Arrays.asList(
            new Object[]{2020, 5L},
            new Object[]{2021, 10L},
            new Object[]{2022, 15L}
        );

        // Setup mock data for brand counts
        mockBrandCounts = Arrays.asList(
            new Object[]{"toyota", 20L},
            new Object[]{"honda", 15L},
            new Object[]{"bmw", 10L}
        );

        // Setup mock data for model counts
        mockModelCounts = Arrays.asList(
            new Object[]{"camry", 12L},
            new Object[]{"civic", 8L},
            new Object[]{"x5", 6L}
        );

        // Setup mock data for seller type counts
        mockSellerTypeCounts = Arrays.asList(
            new Object[]{"PRIVATE", 30L},
            new Object[]{"DEALER", 20L}
        );

        // Setup mock data for fuel type counts
        mockFuelTypeCounts = Arrays.asList(
            new Object[]{"gasoline", 35L},
            new Object[]{"diesel", 15L}
        );
    }

    @Test
    void getFilterBreakdown_WithNullFilters_ShouldReturnYearsAndBrands() {
        // Arrange
        when(carListingRepository.findDistinctYearsWithCounts()).thenReturn(new ArrayList<>());
        when(carListingRepository.findDistinctBrandSlugsWithCounts()).thenReturn(new ArrayList<>());

        // Act
        Map<String, Object> result = analyticsService.getFilterBreakdown(null);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.containsKey("years"));
        assertTrue(result.containsKey("brands"));
        assertFalse(result.containsKey("models")); // Models should not be included without brand filters

        verify(carListingRepository).findDistinctYearsWithCounts();
        verify(carListingRepository).findDistinctBrandSlugsWithCounts();
    }

    @Test
    void getFilterBreakdown_WithBrandFilters_ShouldIncludeModels() {
        // Arrange
        ListingFilterRequest requestWithBrands = new ListingFilterRequest();
        requestWithBrands.setBrandSlugs(Arrays.asList("toyota", "honda"));

        // Mock the specification-based queries since brand filters make it a complex filter
        List<CarListing> mockListings = Arrays.asList(
            createMockListingWithBrand("toyota"),
            createMockListingWithBrand("honda"),
            createMockListingWithBrand("toyota")
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);
        when(carListingRepository.findDistinctBrandSlugsWithCounts()).thenReturn(mockBrandCounts);

        // Act
        Map<String, Object> result = analyticsService.getFilterBreakdown(requestWithBrands);

        // Assert
        assertNotNull(result);
        assertTrue(result.containsKey("years"));
        assertTrue(result.containsKey("brands"));
        assertTrue(result.containsKey("models"));

        // Verify that specification-based queries were used for years and models due to complex filter
        verify(carListingRepository, times(2)).findAll(anySpecification());
        verify(carListingRepository).findDistinctBrandSlugsWithCounts();
    }

    @Test
    void getCountsByYear_WithSimpleFilter_ShouldUseOptimizedQuery() {
        // Arrange
        when(carListingRepository.findDistinctYearsWithCounts()).thenReturn(mockYearCounts);

        // Act
        Map<String, Long> result = analyticsService.getCountsByYear(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(5L, result.get("2020"));
        assertEquals(10L, result.get("2021"));
        assertEquals(15L, result.get("2022"));

        verify(carListingRepository).findDistinctYearsWithCounts();
    }

    @Test
    void getCountsByYear_WithComplexFilter_ShouldUseSpecification() {
        // Arrange
        ListingFilterRequest complexFilter = new ListingFilterRequest();
        complexFilter.setMinPrice(BigDecimal.valueOf(10000.0));
        complexFilter.setBrandSlugs(Arrays.asList("toyota"));

        List<CarListing> mockListings = Arrays.asList(
            createMockListing(2020),
            createMockListing(2021),
            createMockListing(2021)
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);

        // Act
        Map<String, Long> result = analyticsService.getCountsByYear(complexFilter);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get("2020"));
        assertEquals(2L, result.get("2021"));
    }

    @Test
    void getCountsByBrand_WithSimpleFilter_ShouldUseOptimizedQuery() {
        // Arrange
        when(carListingRepository.findDistinctBrandSlugsWithCounts()).thenReturn(mockBrandCounts);

        // Act
        Map<String, Long> result = analyticsService.getCountsByBrand(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(20L, result.get("toyota"));
        assertEquals(15L, result.get("honda"));
        assertEquals(10L, result.get("bmw"));

        verify(carListingRepository).findDistinctBrandSlugsWithCounts();
    }

    @Test
    void getCountsByBrand_WithComplexFilter_ShouldUseSpecification() {
        // Arrange
        ListingFilterRequest complexFilter = new ListingFilterRequest();
        complexFilter.setMinPrice(BigDecimal.valueOf(10000.0));

        List<CarListing> mockListings = Arrays.asList(
            createMockListingWithBrand("toyota"),
            createMockListingWithBrand("honda"),
            createMockListingWithBrand("toyota")
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);

        // Act
        Map<String, Long> result = analyticsService.getCountsByBrand(complexFilter);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(2L, result.get("toyota"));
        assertEquals(1L, result.get("honda"));
    }

    @Test
    void getCountsByModel_WithSimpleFilter_ShouldUseOptimizedQuery() {
        // Arrange
        when(carListingRepository.findDistinctModelSlugsWithCounts()).thenReturn(mockModelCounts);

        // Act
        Map<String, Long> result = analyticsService.getCountsByModel(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(12L, result.get("camry"));
        assertEquals(8L, result.get("civic"));
        assertEquals(6L, result.get("x5"));

        verify(carListingRepository).findDistinctModelSlugsWithCounts();
    }

    @Test
    void getCountsBySellerType_WithSimpleFilter_ShouldUseOptimizedQuery() {
        // Arrange
        when(carListingRepository.findDistinctSellerTypesWithCounts()).thenReturn(mockSellerTypeCounts);

        // Act
        Map<String, Long> result = analyticsService.getCountsBySellerType(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(30L, result.get("PRIVATE"));
        assertEquals(20L, result.get("DEALER"));

        verify(carListingRepository).findDistinctSellerTypesWithCounts();
    }

    @Test
    void getCountsByFuelType_WithSimpleFilter_ShouldUseOptimizedQuery() {
        // Arrange
        when(carListingRepository.findDistinctFuelTypesWithCounts()).thenReturn(mockFuelTypeCounts);

        // Act
        Map<String, Long> result = analyticsService.getCountsByFuelType(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(35L, result.get("gasoline"));
        assertEquals(15L, result.get("diesel"));

        verify(carListingRepository).findDistinctFuelTypesWithCounts();
    }

    @Test
    void getCountsByTransmission_ShouldAlwaysUseSpecification() {
        // Arrange
        List<CarListing> mockListings = Arrays.asList(
            createMockListingWithTransmission("automatic"),
            createMockListingWithTransmission("manual"),
            createMockListingWithTransmission("automatic")
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);

        // Act
        Map<String, Long> result = analyticsService.getCountsByTransmission(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(2L, result.get("automatic"));
        assertEquals(1L, result.get("manual"));
    }

    @Test
    void getCountsByBodyStyle_WithSimpleFilter_ShouldUseSpecification() {
        // Arrange
        List<CarListing> mockListings = Arrays.asList(
            createMockListingWithBodyStyle("sedan"),
            createMockListingWithBodyStyle("suv"),
            createMockListingWithBodyStyle("sedan"),
            createMockListingWithBodyStyle("hatchback"),
            createMockListingWithBodyStyle("suv"),
            createMockListingWithBodyStyle("sedan")
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);

        // Act
        Map<String, Long> result = analyticsService.getCountsByBodyStyle(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(3L, result.get("sedan"));
        assertEquals(2L, result.get("suv"));
        assertEquals(1L, result.get("hatchback"));
    }

    @Test
    void getCountsByBodyStyle_WithComplexFilter_ShouldFilterCorrectly() {
        // Arrange
        ListingFilterRequest complexFilter = new ListingFilterRequest();
        complexFilter.setBrandSlugs(Arrays.asList("toyota", "honda"));
        complexFilter.setMinPrice(BigDecimal.valueOf(15000.0));
        complexFilter.setMaxPrice(BigDecimal.valueOf(35000.0));

        List<CarListing> mockListings = Arrays.asList(
            createMockListingWithBodyStyle("sedan"),
            createMockListingWithBodyStyle("suv"),
            createMockListingWithBodyStyle("sedan"),
            createMockListingWithBodyStyle("coupe")
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);

        // Act
        Map<String, Long> result = analyticsService.getCountsByBodyStyle(complexFilter);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(2L, result.get("sedan"));
        assertEquals(1L, result.get("suv"));
        assertEquals(1L, result.get("coupe"));
    }

    @Test
    void getCountsByBodyStyle_WithEmptyResults_ShouldReturnEmptyMap() {
        // Arrange
        when(carListingRepository.findAll(anySpecification())).thenReturn(Collections.emptyList());

        // Act
        Map<String, Long> result = analyticsService.getCountsByBodyStyle(filterRequest);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getCountsByBodyStyle_WithNullBodyStyle_ShouldSkipNulls() {
        // Arrange
        List<CarListing> mockListings = Arrays.asList(
            createMockListingWithBodyStyle("sedan"),
            createMockListingWithBodyStyle(null),  // null body style
            createMockListingWithBodyStyle("suv"),
            createMockListingWithBodyStyle(null)   // null body style
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);

        // Act
        Map<String, Long> result = analyticsService.getCountsByBodyStyle(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get("sedan"));
        assertEquals(1L, result.get("suv"));
    }

    @Test
    void getCountsByBodyStyle_WithRepositoryException_ShouldReturnEmptyMap() {
        // Arrange
        when(carListingRepository.findAll(anySpecification())).thenThrow(new RuntimeException("Database error"));

        // Act
        Map<String, Long> result = analyticsService.getCountsByBodyStyle(filterRequest);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getCountsByBodyStyle_WithFuelTypeFilter_ShouldApplyFilter() {
        // Arrange
        ListingFilterRequest filterWithFuelType = new ListingFilterRequest();
        filterWithFuelType.setFuelTypeSlugs(Arrays.asList("gasoline", "diesel"));

        List<CarListing> mockListings = Arrays.asList(
            createMockListingWithBodyStyle("sedan"),
            createMockListingWithBodyStyle("sedan"),
            createMockListingWithBodyStyle("suv")
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);

        // Act
        Map<String, Long> result = analyticsService.getCountsByBodyStyle(filterWithFuelType);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(2L, result.get("sedan"));
        assertEquals(1L, result.get("suv"));
    }

    @Test
    void getCountsByBodyStyle_ShouldReturnResultsInInsertionOrder() {
        // Arrange
        List<CarListing> mockListings = Arrays.asList(
            createMockListingWithBodyStyle("pickup"),
            createMockListingWithBodyStyle("sedan"),
            createMockListingWithBodyStyle("convertible"),
            createMockListingWithBodyStyle("sedan")
        );

        when(carListingRepository.findAll(anySpecification())).thenReturn(mockListings);

        // Act
        Map<String, Long> result = analyticsService.getCountsByBodyStyle(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        // LinkedHashMap should preserve the order of first encounter
        List<String> keys = new ArrayList<>(result.keySet());
        assertEquals("pickup", keys.get(0));
        assertEquals("sedan", keys.get(1));
        assertEquals("convertible", keys.get(2));
    }

    @Test
    void getCountsByYear_WithRepositoryException_ShouldReturnEmptyMap() {
        // Arrange
        when(carListingRepository.findDistinctYearsWithCounts()).thenThrow(new RuntimeException("Database error"));

        // Act
        Map<String, Long> result = analyticsService.getCountsByYear(filterRequest);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void getCountsByBrand_WithRepositoryException_ShouldReturnEmptyMap() {
        // Arrange
        when(carListingRepository.findDistinctBrandSlugsWithCounts()).thenThrow(new RuntimeException("Database error"));

        // Act
        Map<String, Long> result = analyticsService.getCountsByBrand(filterRequest);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // Helper methods for creating mock objects

    private CarListing createMockListing(int year) {
        CarListing listing = new CarListing();
        listing.setModelYear(year);
        return listing;
    }

    private CarListing createMockListingWithBrand(String brandSlug) {
        CarListing listing = new CarListing();
        CarModel model = new CarModel();
        CarBrand brand = new CarBrand();
        brand.setSlug(brandSlug);
        model.setBrand(brand);
        listing.setModel(model);
        return listing;
    }

    private CarListing createMockListingWithTransmission(String transmissionName) {
        CarListing listing = new CarListing();
        Transmission transmission = new Transmission();
        transmission.setName(transmissionName);
        listing.setTransmissionType(transmission);
        return listing;
    }

    private CarListing createMockListingWithBodyStyle(String bodyStyleSlug) {
        CarListing listing = new CarListing();
        if (bodyStyleSlug != null) {
            BodyStyle bodyStyle = new BodyStyle();
            bodyStyle.setSlug(bodyStyleSlug);
            listing.setBodyStyle(bodyStyle);
        }
        return listing;
    }
}
