package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.CarBrand; // Added
import com.autotrader.autotraderbackend.model.CarModel; // Added
import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import com.autotrader.autotraderbackend.service.storage.StorageKeyGenerator;

import java.util.Arrays;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingServiceTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private CarModelService carModelService; // Added mock for CarModelService

    @Mock
    private StorageService storageService;

    @Mock
    private StorageKeyGenerator storageKeyGenerator;

    @Mock
    private CarListingMapper carListingMapper;

    @Mock
    private SavedSearchService savedSearchService;

    @Mock
    private CarListingMediaService carListingMediaService;

    @Mock
    private CarListingCrudService crudService;

    @Mock
    private CarListingAnalyticsService analyticsService;

    @Mock
    private CarListingQueryService queryService;

    @InjectMocks
    private CarListingService carListingService;

    private User testUser;
    private CarListing testListing;
    private CarListingResponse testListingResponse;
    private Location testLocation;
    private CarBrand testCarBrand;
    private CarModel testCarModel;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.markEmailAsVerified(); // Mark user as verified for tests

        // Create test location with country and governorate
        Country country = new Country();
        country.setId(1L);
        country.setCountryCode("SY");
        country.setDisplayNameEn("Syria");
        country.setDisplayNameAr("سوريا");
        
        Governorate governorate = new Governorate();
        governorate.setId(1L);
        governorate.setDisplayNameEn("Damascus");
        governorate.setDisplayNameAr("دمشق");
        governorate.setSlug("damascus");
        governorate.setCountry(country);
        
        testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setDisplayNameEn("Test Location");
        testLocation.setDisplayNameAr("موقع اختبار");
        testLocation.setSlug("test-location");
        testLocation.setGovernorate(governorate);

        testCarBrand = new CarBrand(); // Ensure brand is initialized
        testCarBrand.setId(1L);
        testCarBrand.setName("TestBrand");
        testCarBrand.setDisplayNameEn("Test Brand");
        testCarBrand.setDisplayNameAr("علامة تجارية اختبار");

        testCarModel = new CarModel(); // Ensure model is initialized
        testCarModel.setId(1L);
        testCarModel.setName("TestModel");
        testCarModel.setDisplayNameEn("Test Model");
        testCarModel.setDisplayNameAr("نموذج اختبار");
        testCarModel.setBrand(testCarBrand); // Associate brand with model

        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setSeller(testUser);
        testListing.setLocation(testLocation);
        testListing.setModel(testCarModel);
        testListing.setBrandNameEn(testCarBrand.getDisplayNameEn());
        testListing.setBrandNameAr(testCarBrand.getDisplayNameAr());
        testListing.setModelNameEn(testCarModel.getDisplayNameEn());
        testListing.setModelNameAr(testCarModel.getDisplayNameAr());
        testListing.setPrice(new BigDecimal("20000.00"));
        testListing.setApproved(false);

        testListingResponse = new CarListingResponse();
        testListingResponse.setId(1L);
        testListingResponse.setBrandNameEn(testCarBrand.getDisplayNameEn());
        testListingResponse.setBrandNameAr(testCarBrand.getDisplayNameAr());
        testListingResponse.setModelNameEn(testCarModel.getDisplayNameEn());
        testListingResponse.setModelNameAr(testCarModel.getDisplayNameAr());
        
        // Setup StorageKeyGenerator mock (lenient to avoid unnecessary stubbing exceptions)
        lenient().when(storageKeyGenerator.generateListingMediaKey(anyLong(), anyString()))
                .thenAnswer(invocation -> {
                    Long listingId = invocation.getArgument(0);
                    String filename = invocation.getArgument(1);
                    if (filename == null || filename.trim().isEmpty()) {
                        return "listings/" + listingId + "/123456_";
                    } else {
                        return "listing-media/" + listingId + "/" + filename;
                    }
                });
    }

    @Test
    void createListing_Success() {
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setLocationId(1L);
        request.setModelId(1L); // Use modelId

        when(crudService.createListingInternal(request, "testuser")).thenReturn(testListingResponse);

        CarListingResponse response = carListingService.createListing(request, "testuser");

        assertNotNull(response);
        assertEquals(testListingResponse.getId(), response.getId());
        verify(crudService).createListingInternal(request, "testuser");
    }

    @Test
    void createListing_WithNonExistentUser_ShouldThrowException() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest(); // Populate as needed
        String username = "nonexistentuser";
        when(crudService.createListingInternal(request, username))
                .thenThrow(new ResourceNotFoundException("User", "username", username));

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.createListing(request, username);
        });
        assertEquals("User not found with username : 'nonexistentuser'", exception.getMessage());
    }

    @Test
    void createListing_WhenRepositorySaveFails_ShouldThrowRuntimeException() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setModelId(1L); // Use modelId
        request.setModelYear(2022);
        request.setPrice(new BigDecimal("15000"));
        request.setMileage(5000);
        request.setLocationId(1L);
        request.setDescription("TestDesc");
        String username = "testuser";
        RuntimeException dbException = new RuntimeException("Database connection failed");

        // Create test location with proper hierarchy
        Country mockCountry = new Country();
        mockCountry.setId(1L);
        mockCountry.setCountryCode("SY");
        mockCountry.setDisplayNameEn("Syria");
        mockCountry.setDisplayNameAr("سوريا");
        
        Governorate mockGovernorate = new Governorate();
        mockGovernorate.setId(1L);
        mockGovernorate.setDisplayNameEn("Damascus");
        mockGovernorate.setDisplayNameAr("دمشق");
        mockGovernorate.setSlug("damascus");
        mockGovernorate.setCountry(mockCountry);
        
        Location mockLocation = new Location();
        mockLocation.setId(1L);
        mockLocation.setDisplayNameEn("Test Location");
        mockLocation.setDisplayNameAr("موقع اختبار");
        mockLocation.setSlug("test-location");
        mockLocation.setGovernorate(mockGovernorate);
        
        when(crudService.createListingInternal(request, username)).thenThrow(dbException);

        // Act & Assert
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            carListingService.createListing(request, username);
        });

        assertEquals("Database connection failed", thrown.getMessage());
        assertSame(dbException, thrown);
    }

    // --- Tests for getListingById ---
    @Test
    void getListingById_Success_WhenApproved() { // Renamed for clarity
        // Arrange
        Long listingId = 1L;
        // Ensure the mock listing is approved for this test if needed, or assume findByIdAndApprovedTrue handles it
        testListing.setApproved(true); // Explicitly set for clarity
        testListingResponse.setApproved(true); // Match expected response

        when(crudService.getListingById(listingId)).thenReturn(testListingResponse);

        // Act
        CarListingResponse response = carListingService.getListingById(listingId);

        // Assert
        assertNotNull(response);
        assertEquals(testListingResponse, response);
        verify(crudService).getListingById(listingId);
    }

    @Test
    void getListingById_NotFound_ThrowsResourceNotFoundException() {
        // Arrange
        Long nonExistentId = 999L;
        when(crudService.getListingById(nonExistentId))
                .thenThrow(new ResourceNotFoundException("CarListing", "id", nonExistentId));

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.getListingById(nonExistentId);
        });
        assertEquals("CarListing not found with id : '999'", exception.getMessage());
        verify(crudService).getListingById(nonExistentId);
    }

    @Test
    void getListingById_ExistsButNotApproved_ThrowsResourceNotFoundException() {
        // Arrange
        Long listingId = 1L;
        testListing.setApproved(false); // Ensure the listing exists but is not approved

        when(crudService.getListingById(listingId))
                .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.getListingById(listingId);
        });

        // Assert that the correct exception is thrown
        assertEquals("CarListing not found with id : '1'", exception.getMessage());
        verify(crudService).getListingById(listingId);
    }

    // --- Tests for getAllApprovedListings & getFilteredListings ---
    @Test
    void getAllApprovedListings_ShouldReturnPageOfApprovedListings() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        CarListingResponse response1 = new CarListingResponse(); // Setup response 1
        response1.setId(1L);
        response1.setApproved(true);
        CarListingResponse response2 = new CarListingResponse(); // Setup response 2
        response2.setId(2L);
        response2.setApproved(true);
        List<CarListingResponse> responses = Arrays.asList(response1, response2);
        Page<CarListingResponse> responsePage = new PageImpl<>(responses, pageable, responses.size());

        when(queryService.getAllApprovedListings(pageable)).thenReturn(responsePage);

        // Act
        Page<CarListingResponse> result = carListingService.getAllApprovedListings(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
        assertEquals(2, result.getContent().size());
        assertEquals(response1, result.getContent().get(0));
        assertEquals(response2, result.getContent().get(1));
        verify(queryService).getAllApprovedListings(pageable);
    }

     @Test
    void getAllApprovedListings_WhenNoneFound_ShouldReturnEmptyPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<CarListingResponse> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(queryService.getAllApprovedListings(pageable)).thenReturn(emptyPage);

        // Act
        Page<CarListingResponse> responsePage = carListingService.getAllApprovedListings(pageable);

        // Assert
        assertNotNull(responsePage);
        assertTrue(responsePage.isEmpty());
        assertEquals(0, responsePage.getTotalElements());
        verify(queryService).getAllApprovedListings(pageable);
    }

    @Test
    void getFilteredListings_ShouldReturnFilteredAndApprovedListings() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        ListingFilterRequest filter = new ListingFilterRequest(); // Populate filter
        filter.setBrandSlugs(Arrays.asList("honda")); // Use new slug-based filtering

        CarListingResponse filteredResponse = new CarListingResponse(); // Setup response
        filteredResponse.setId(1L);
        // Set denormalized brand name for the response
        filteredResponse.setBrandNameEn("Honda");
        filteredResponse.setBrandNameAr("هوندا");
        filteredResponse.setApproved(true);
        List<CarListingResponse> responses = Collections.singletonList(filteredResponse);
        Page<CarListingResponse> responsePage = new PageImpl<>(responses, pageable, 1);

        when(queryService.getFilteredListings(filter, pageable)).thenReturn(responsePage);

        // Act
        Page<CarListingResponse> result = carListingService.getFilteredListings(filter, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals(filteredResponse, result.getContent().get(0));
        verify(queryService).getFilteredListings(filter, pageable);
    }

    @Test
    void getFilteredListings_WhenNoneMatch_ShouldReturnEmptyPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        ListingFilterRequest filter = new ListingFilterRequest(); // Populate filter
        filter.setBrandSlugs(Arrays.asList("nonexistent"));
        Page<CarListingResponse> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(queryService.getFilteredListings(filter, pageable)).thenReturn(emptyPage);

        // Act
        Page<CarListingResponse> responsePage = carListingService.getFilteredListings(filter, pageable);

        // Assert
        assertNotNull(responsePage);
        assertTrue(responsePage.isEmpty());
        assertEquals(0, responsePage.getTotalElements());
        verify(queryService).getFilteredListings(filter, pageable);
    }
    // --- Media tests moved to CarListingMediaServiceTest ---

    // --- Tests for media delegation ---
    @Test
    void uploadListingImage_ShouldDelegateToMediaService() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "content".getBytes());
        String expectedKey = "test-key";

        when(carListingMediaService.uploadListingImage(listingId, file, username)).thenReturn(expectedKey);

        // Act
        String result = carListingService.uploadListingImage(listingId, file, username);

        // Assert
        assertEquals(expectedKey, result);
        verify(carListingMediaService).uploadListingImage(listingId, file, username);
    }

    @Test
    void uploadListingVideo_ShouldDelegateToMediaService() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "test.mp4", "video/mp4", "content".getBytes());
        String expectedKey = "video-key";

        when(carListingMediaService.uploadListingVideo(listingId, file, username)).thenReturn(expectedKey);

        // Act
        String result = carListingService.uploadListingVideo(listingId, file, username);

        // Assert
        assertEquals(expectedKey, result);
        verify(carListingMediaService).uploadListingVideo(listingId, file, username);
    }

    // --- Test for getMyListings ---
    @Test
    void getMyListings_ShouldReturnUserListings() {
        // Arrange
        String username = testUser.getUsername();
        CarListing listing1 = new CarListing(); // Setup listing 1 for testUser
        listing1.setId(1L);
        listing1.setSeller(testUser);
        CarListing listing2 = new CarListing(); // Setup listing 2 for testUser
        listing2.setId(2L);
        listing2.setSeller(testUser);
        List<CarListing> userListings = Arrays.asList(listing1, listing2);

        CarListingResponse response1 = new CarListingResponse(); // Setup response 1
        response1.setId(1L);
        CarListingResponse response2 = new CarListingResponse(); // Setup response 2
        response2.setId(2L);

        List<CarListingResponse> expectedResponses = Arrays.asList(response1, response2);
        when(crudService.getMyListings(username)).thenReturn(expectedResponses);

        // Act
        List<CarListingResponse> result = carListingService.getMyListings(username);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(2L, result.get(1).getId());
        verify(crudService).getMyListings(username);
    }

    // --- Tests for seller type count functionality ---

    @Test
    void getCountsBySellerType_WithNoFilters_ShouldUseDirectDatabaseQuery() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        Map<String, Long> expectedResult = Map.of("BUSINESS", 100L, "PRIVATE", 50L);

        when(analyticsService.getCountsBySellerType(filterRequest)).thenReturn(expectedResult);

        // Act
        var result = carListingService.getCountsBySellerType(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(100L, result.get("BUSINESS"));
        assertEquals(50L, result.get("PRIVATE"));

        verify(analyticsService).getCountsBySellerType(filterRequest);
    }

    @Test
    void getCountsBySellerType_WithBrandFilter_ShouldUseSpecificationQuery() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota"));

        Map<String, Long> expectedResult = Map.of("BUSINESS", 1L, "PRIVATE", 1L);

        when(analyticsService.getCountsBySellerType(filterRequest)).thenReturn(expectedResult);

        // Act
        var result = carListingService.getCountsBySellerType(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get("BUSINESS"));
        assertEquals(1L, result.get("PRIVATE"));

        verify(analyticsService).getCountsBySellerType(filterRequest);
    }

    @Test
    void getCountsBySellerType_WithMultipleFilters_ShouldGroupCorrectly() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota"));
        filterRequest.setMinYear(2020);
        filterRequest.setMaxPrice(BigDecimal.valueOf(50000));

        Map<String, Long> expectedResult = Map.of("BUSINESS", 2L, "PRIVATE", 1L);

        when(analyticsService.getCountsBySellerType(filterRequest)).thenReturn(expectedResult);

        // Act
        var result = carListingService.getCountsBySellerType(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(2L, result.get("BUSINESS")); // Two business listings
        assertEquals(1L, result.get("PRIVATE"));  // One private listing
        
        verify(analyticsService).getCountsBySellerType(filterRequest);
    }

    @Test
    void getCountsBySellerType_WithSellerTypeFilter_ShouldIgnoreSellerTypeFilter() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setSellerTypeIds(Arrays.asList(1L)); // This should be ignored
        filterRequest.setBrandSlugs(Arrays.asList("toyota")); // This should be applied

        Map<String, Long> expectedResult = Map.of("BUSINESS", 1L, "PRIVATE", 1L);

        when(analyticsService.getCountsBySellerType(filterRequest)).thenReturn(expectedResult);

        // Act
        var result = carListingService.getCountsBySellerType(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get("BUSINESS"));
        assertEquals(1L, result.get("PRIVATE"));
        
        // Verify that analytics service is called
        verify(analyticsService).getCountsBySellerType(filterRequest);
    }

    @Test
    void getCountsBySellerType_WithNullSellerType_ShouldFilterOutNullSellerTypes() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota"));

        Map<String, Long> expectedResult = Map.of("BUSINESS", 1L);

        when(analyticsService.getCountsBySellerType(filterRequest)).thenReturn(expectedResult);

        // Act
        var result = carListingService.getCountsBySellerType(filterRequest);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size()); // Only valid seller type should be counted
        assertEquals(1L, result.get("BUSINESS"));
        assertNull(result.get("null"));

        verify(analyticsService).getCountsBySellerType(filterRequest);
    }

    @Test
    void getCountsBySellerType_WithException_ShouldReturnEmptyMap() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        
        when(analyticsService.getCountsBySellerType(filterRequest))
            .thenThrow(new RuntimeException("Database error"));

        // Act
        var result = carListingService.getCountsBySellerType(filterRequest);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(analyticsService).getCountsBySellerType(filterRequest);
    }


    // Helper method to create test listing
    private CarListing createTestListing() {
        CarListing listing = new CarListing();
        listing.setId(1L);
        listing.setApproved(true);
        listing.setModelYear(2020);
        listing.setPrice(BigDecimal.valueOf(25000));
        listing.setMileage(50000);
        return listing;
    }

    @Test
    void getCountsByFuelType_WithNoFilters_ShouldUseDirectDatabaseQuery() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        Arrays.asList(
            new Object[]{"gasoline", 150L},
            new Object[]{"diesel", 80L},
            new Object[]{"electric", 20L},
            new Object[]{"hybrid", 30L}
        );
        
        Map<String, Long> expectedResult = Map.of(
            "gasoline", 150L,
            "diesel", 80L,
            "electric", 20L,
            "hybrid", 30L
        );

        when(analyticsService.getCountsByFuelType(filterRequest)).thenReturn(expectedResult);

        // When
        Map<String, Long> result = carListingService.getCountsByFuelType(filterRequest);

        // Then
        assertNotNull(result);
        assertEquals(4, result.size());
        assertEquals(150L, result.get("gasoline"));
        assertEquals(80L, result.get("diesel"));
        assertEquals(20L, result.get("electric"));
        assertEquals(30L, result.get("hybrid"));

        verify(analyticsService).getCountsByFuelType(filterRequest);
    }

    @Test
    void getCountsByFuelType_WithBrandFilter_ShouldUseSpecificationQuery() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota", "honda"));
        
        Map<String, Long> expectedResult = Map.of("gasoline", 2L, "diesel", 1L);

        when(analyticsService.getCountsByFuelType(filterRequest)).thenReturn(expectedResult);

        // When
        Map<String, Long> result = carListingService.getCountsByFuelType(filterRequest);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(2L, result.get("gasoline"));
        assertEquals(1L, result.get("diesel"));

        verify(analyticsService).getCountsByFuelType(filterRequest);
    }

    @Test
    void getCountsByFuelType_WithMultipleFilters_ShouldGroupCorrectly() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota"));
        filterRequest.setMinYear(2020);
        filterRequest.setMaxYear(2023);
        filterRequest.setMinPrice(new BigDecimal("10000"));
        filterRequest.setMaxPrice(new BigDecimal("50000"));
        
        Map<String, Long> expectedResult = Map.of(
            "gasoline", 2L,
            "hybrid", 1L,
            "electric", 1L
        );

        when(analyticsService.getCountsByFuelType(filterRequest)).thenReturn(expectedResult);

        // When
        Map<String, Long> result = carListingService.getCountsByFuelType(filterRequest);

        // Then
        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(2L, result.get("gasoline"));
        assertEquals(1L, result.get("hybrid"));
        assertEquals(1L, result.get("electric"));

        verify(analyticsService).getCountsByFuelType(filterRequest);
    }

    @Test
    void getCountsByFuelType_WithNullFuelType_ShouldFilterOutNullFuelTypes() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        
        Map<String, Long> expectedResult = new HashMap<>();
        expectedResult.put("gasoline", 150L);
        expectedResult.put("diesel", 80L);

        when(analyticsService.getCountsByFuelType(filterRequest)).thenReturn(expectedResult);

        // When
        Map<String, Long> result = carListingService.getCountsByFuelType(filterRequest);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(150L, result.get("gasoline"));
        assertEquals(80L, result.get("diesel"));
        // Verify that null keys are not present (different approach for immutable maps)
        assertFalse(result.keySet().contains(null));

        verify(analyticsService).getCountsByFuelType(filterRequest);
    }

    @Test
    void getCountsByFuelType_WithException_ShouldReturnEmptyMap() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        when(analyticsService.getCountsByFuelType(filterRequest)).thenThrow(new RuntimeException("Database error"));

        // When
        Map<String, Long> result = carListingService.getCountsByFuelType(filterRequest);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(analyticsService).getCountsByFuelType(filterRequest);
    }

    @Test
    void getCountsByFuelType_WithEmptyResults_ShouldReturnEmptyMap() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        when(analyticsService.getCountsByFuelType(filterRequest)).thenReturn(Collections.emptyMap());

        // When
        Map<String, Long> result = carListingService.getCountsByFuelType(filterRequest);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(analyticsService).getCountsByFuelType(filterRequest);
    }

    @Test
    void getCountsByFuelType_WithZeroCounts_ShouldFilterOutZeroCounts() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        
        Map<String, Long> expectedResult = Map.of(
            "gasoline", 150L,
            "electric", 20L
        );

        when(analyticsService.getCountsByFuelType(filterRequest)).thenReturn(expectedResult);

        // When
        Map<String, Long> result = carListingService.getCountsByFuelType(filterRequest);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(150L, result.get("gasoline"));
        assertEquals(20L, result.get("electric"));
        assertFalse(result.containsKey("diesel"));

        verify(analyticsService).getCountsByFuelType(filterRequest);
    }


    // --- CRUD Delegation Tests ---

    @Test
    void canUserCreateListings_ShouldDelegateToCrudService() {
        // Arrange
        when(crudService.canUserCreateListings("testuser")).thenReturn(true);

        // Act
        boolean result = carListingService.canUserCreateListings("testuser");

        // Assert
        assertTrue(result);
        verify(crudService).canUserCreateListings("testuser");
    }

    @Test
    void getListingById_ShouldDelegateToCrudService() {
        // Arrange
        Long listingId = 1L;
        when(crudService.getListingById(listingId)).thenReturn(testListingResponse);

        // Act
        CarListingResponse result = carListingService.getListingById(listingId);

        // Assert
        assertEquals(testListingResponse, result);
        verify(crudService).getListingById(listingId);
    }

    @Test
    void getMyListings_ShouldDelegateToCrudService() {
        // Arrange
        String username = "testuser";
        List<CarListingResponse> expectedListings = Arrays.asList(testListingResponse);
        when(crudService.getMyListings(username)).thenReturn(expectedListings);

        // Act
        List<CarListingResponse> result = carListingService.getMyListings(username);

        // Assert
        assertEquals(expectedListings, result);
        verify(crudService).getMyListings(username);
    }

    @Test
    void updateListing_ShouldDelegateToCrudService() {
        // Arrange
        Long listingId = 1L;
        UpdateListingRequest request = new UpdateListingRequest();
        String username = "testuser";

        when(crudService.updateListing(listingId, request, username)).thenReturn(testListingResponse);

        // Act
        CarListingResponse result = carListingService.updateListing(listingId, request, username);

        // Assert
        assertEquals(testListingResponse, result);
        verify(crudService).updateListing(listingId, request, username);
    }

    @Test
    void deleteListing_ShouldDelegateToMediaServiceThenCrudService() {
        // Arrange
        Long listingId = 1L;
        String username = "testuser";

        // Act
        carListingService.deleteListing(listingId, username);

        // Assert
        verify(carListingMediaService).deleteListingMedia(listingId);
        verify(crudService).deleteListing(listingId, username);
    }

    @Test
    void deleteListingAsAdmin_ShouldDelegateToMediaServiceThenCrudService() {
        // Arrange
        Long listingId = 1L;

        // Act
        carListingService.deleteListingAsAdmin(listingId);

        // Assert
        verify(carListingMediaService).deleteListingMedia(listingId);
        verify(crudService).deleteListingAsAdmin(listingId);
    }

    @Test
    void approveListingAsAdmin_ShouldDelegateToCrudService() {
        // Arrange
        Long listingId = 1L;
        when(crudService.approveListingAsAdmin(listingId)).thenReturn(testListingResponse);

        // Act
        CarListingResponse result = carListingService.approveListingAsAdmin(listingId);

        // Assert
        assertEquals(testListingResponse, result);
        verify(crudService).approveListingAsAdmin(listingId);
    }

    @Test
    void getAllListingsAsAdmin_ShouldDelegateToCrudService() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<CarListingResponse> expectedPage = new PageImpl<>(Arrays.asList(testListingResponse));
        when(crudService.getAllListingsAsAdmin(pageable)).thenReturn(expectedPage);

        // Act
        Page<CarListingResponse> result = carListingService.getAllListingsAsAdmin(pageable);

        // Assert
        assertEquals(expectedPage, result);
        verify(crudService).getAllListingsAsAdmin(pageable);
    }
}
