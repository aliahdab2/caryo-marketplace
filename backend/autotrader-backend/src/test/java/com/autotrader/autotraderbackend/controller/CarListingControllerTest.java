package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.mock.web.MockMultipartFile;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
public class CarListingControllerTest {

    @Mock
    private CarListingService carListingService;

    @Mock
    private CarListingStatusService carListingStatusService;

    @InjectMocks
    private CarListingController carListingController;

    private CreateListingRequest createRequest;
    private CarListingResponse carListingResponse;
    private UserDetails userDetails;
    private MockMultipartFile mockImage;

    @BeforeEach
    void setUp() {
        // Setup test data
        createRequest = new CreateListingRequest();
        createRequest.setTitle("Test Car");
        createRequest.setModelId(1L); // Use modelId instead of brand and model
        createRequest.setModelYear(2022);
        createRequest.setMileage(5000);
        createRequest.setPrice(new BigDecimal("25000.00"));
        createRequest.setLocationId(1L);
        createRequest.setDescription("Test Description");

        // Create a LocationResponse for the response object
        LocationResponse locationResponse = new LocationResponse();
        locationResponse.setId(1L);
        locationResponse.setDisplayNameEn("Test Location");
        // Set other necessary fields for LocationResponse if needed

        carListingResponse = new CarListingResponse();
        carListingResponse.setId(1L);
        carListingResponse.setTitle("Test Car");
        // Set denormalized brand and model name fields instead of direct brand and model
        carListingResponse.setBrandNameEn("Toyota");
        carListingResponse.setBrandNameAr("تويوتا");
        carListingResponse.setModelNameEn("Camry");
        carListingResponse.setModelNameAr("كامري");
        carListingResponse.setModelYear(2022);
        carListingResponse.setMileage(5000);
        carListingResponse.setPrice(new BigDecimal("25000.00"));
        carListingResponse.setLocationDetails(locationResponse);
        carListingResponse.setDescription("Test Description");
        carListingResponse.setSellerId(1L);
        carListingResponse.setSellerUsername("testuser");
        carListingResponse.setApproved(false);
        carListingResponse.setIsUserActive(true);

        mockImage = new MockMultipartFile(
            "image",
            "test.jpg",
            "image/jpeg",
            "test image content".getBytes()
        );

        userDetails = mock(UserDetails.class);
        lenient().when(userDetails.getUsername()).thenReturn("testuser");
    }

    @Test
    void createListing_ShouldReturnCreatedResponse() {
        // Arrange
        when(carListingService.createListing(any(CreateListingRequest.class), isNull(), anyString()))
                .thenReturn(carListingResponse);

        // Act
        ResponseEntity<CarListingResponse> response = carListingController.createListing(createRequest, userDetails);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(carListingResponse, response.getBody());
    }

    @Test
    void createListingWithImage_ShouldReturnCreatedResponse() {
        // Arrange
        when(carListingService.createListing(any(CreateListingRequest.class), any(MultipartFile.class), anyString()))
                .thenReturn(carListingResponse);

        // Act
        ResponseEntity<?> response = carListingController.createListingWithImage(createRequest, mockImage, userDetails);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(carListingResponse, response.getBody());
    }

    @Test
    void getAllListings_ShouldReturnListingsPage() {
        // Arrange
        List<CarListingResponse> listings = new ArrayList<>();
        listings.add(carListingResponse);
        Page<CarListingResponse> page = new PageImpl<>(listings);
        when(carListingService.getAllApprovedListings(any(Pageable.class))).thenReturn(page);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("createdAt").descending());
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = carListingController.getAllListings(pageable);
        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(listings, Objects.requireNonNull(response.getBody()).getContent());
    }

    @Test
    void filterListings_ShouldReturnFilteredListings() {
        // Arrange
        List<CarListingResponse> listings = new ArrayList<>();
        listings.add(carListingResponse);
        Page<CarListingResponse> page = new PageImpl<>(listings);
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota"));
        when(carListingService.getFilteredListings(any(ListingFilterRequest.class), any(Pageable.class))).thenReturn(page);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("createdAt").descending());
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = carListingController.getFilteredListings(filterRequest, pageable);
        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(listings, Objects.requireNonNull(response.getBody()).getContent());
    }

    @Test
    void filterListings_WithSellerTypeId_ShouldReturnFilteredListings() {
        // Arrange
        List<CarListingResponse> listings = new ArrayList<>();
        listings.add(carListingResponse);
        Page<CarListingResponse> page = new PageImpl<>(listings);
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setSellerTypeIds(Arrays.asList(1L)); // Filter by seller type
        when(carListingService.getFilteredListings(any(ListingFilterRequest.class), any(Pageable.class))).thenReturn(page);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("createdAt").descending());
        
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = carListingController.getFilteredListings(filterRequest, pageable);
        
        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(listings, Objects.requireNonNull(response.getBody()).getContent());
        
        // Verify that the service was called with the correct filter
        verify(carListingService).getFilteredListings(argThat(filter -> 
            filter.getSellerTypeIds() != null && filter.getSellerTypeIds().contains(1L)
        ), eq(pageable));
    }

    @Test
    void getAllListings_ShouldReturnListingsSortedByPriceAscAndDesc() {
        // Arrange: create listings with different prices
        CarListingResponse listing1 = new CarListingResponse();
        listing1.setId(1L);
        listing1.setPrice(new BigDecimal("10000.00"));
        CarListingResponse listing2 = new CarListingResponse();
        listing2.setId(2L);
        listing2.setPrice(new BigDecimal("20000.00"));
        CarListingResponse listing3 = new CarListingResponse();
        listing3.setId(3L);
        listing3.setPrice(new BigDecimal("15000.00"));

        // Ascending order
        List<CarListingResponse> ascList = List.of(listing1, listing3, listing2);
        Page<CarListingResponse> ascPage = new PageImpl<>(ascList);
        Pageable ascPageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("price").ascending());
        when(carListingService.getAllApprovedListings(ascPageable)).thenReturn(ascPage);
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> ascResponse = carListingController.getAllListings(ascPageable);
        // Assert
        assertNotNull(ascResponse.getBody());
        List<CarListingResponse> ascResult = Objects.requireNonNull(ascResponse.getBody()).getContent();
        assertEquals(3, ascResult.size());
        assertEquals(new BigDecimal("10000.00"), ascResult.get(0).getPrice());
        assertEquals(new BigDecimal("15000.00"), ascResult.get(1).getPrice());
        assertEquals(new BigDecimal("20000.00"), ascResult.get(2).getPrice());

        // Descending order
        List<CarListingResponse> descList = List.of(listing2, listing3, listing1);
        Page<CarListingResponse> descPage = new PageImpl<>(descList);
        Pageable descPageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("price").descending());
        when(carListingService.getAllApprovedListings(descPageable)).thenReturn(descPage);
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> descResponse = carListingController.getAllListings(descPageable);
        // Assert
        assertNotNull(descResponse.getBody());
        List<CarListingResponse> descResult = Objects.requireNonNull(descResponse.getBody()).getContent();
        assertEquals(3, descResult.size());
        assertEquals(new BigDecimal("20000.00"), descResult.get(0).getPrice());
        assertEquals(new BigDecimal("15000.00"), descResult.get(1).getPrice());
        assertEquals(new BigDecimal("10000.00"), descResult.get(2).getPrice());
    }

    @Test
    void getAllListings_ShouldReturnListingsSortedByCreatedAtAscAndDesc() {
        // Arrange: create listings with different createdAt timestamps
        CarListingResponse listing1 = new CarListingResponse();
        listing1.setId(1L);
        listing1.setCreatedAt(java.time.LocalDateTime.of(2023, 1, 1, 10, 0));
        CarListingResponse listing2 = new CarListingResponse();
        listing2.setId(2L);
        listing2.setCreatedAt(java.time.LocalDateTime.of(2023, 1, 2, 10, 0));
        CarListingResponse listing3 = new CarListingResponse();
        listing3.setId(3L);
        listing3.setCreatedAt(java.time.LocalDateTime.of(2023, 1, 3, 10, 0));

        // Ascending order
        List<CarListingResponse> ascList = List.of(listing1, listing2, listing3);
        Page<CarListingResponse> ascPage = new PageImpl<>(ascList);
        Pageable ascPageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("createdAt").ascending());
        when(carListingService.getAllApprovedListings(ascPageable)).thenReturn(ascPage);
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> ascResponse = carListingController.getAllListings(ascPageable);
        // Assert
        assertNotNull(ascResponse.getBody());
        List<CarListingResponse> ascResult = Objects.requireNonNull(ascResponse.getBody()).getContent();
        assertEquals(3, ascResult.size());
        assertEquals(listing1.getCreatedAt(), ascResult.get(0).getCreatedAt());
        assertEquals(listing2.getCreatedAt(), ascResult.get(1).getCreatedAt());
        assertEquals(listing3.getCreatedAt(), ascResult.get(2).getCreatedAt());

        // Descending order
        List<CarListingResponse> descList = List.of(listing3, listing2, listing1);
        Page<CarListingResponse> descPage = new PageImpl<>(descList);
        Pageable descPageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("createdAt").descending());
        when(carListingService.getAllApprovedListings(descPageable)).thenReturn(descPage);
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> descResponse = carListingController.getAllListings(descPageable);
        // Assert
        assertNotNull(descResponse.getBody());
        List<CarListingResponse> descResult = Objects.requireNonNull(descResponse.getBody()).getContent();
        assertEquals(3, descResult.size());
        assertEquals(listing3.getCreatedAt(), descResult.get(0).getCreatedAt());
        assertEquals(listing2.getCreatedAt(), descResult.get(1).getCreatedAt());
        assertEquals(listing1.getCreatedAt(), descResult.get(2).getCreatedAt());
    }

    @Test
    void getFilteredListingsByParams_ShouldThrowIllegalArgumentExceptionForNonWhitelistedSortField() {
        // Arrange
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("nonExistentField"));
        when(carListingService.getFilteredListings(any(ListingFilterRequest.class), eq(pageable)))
            .thenThrow(new IllegalArgumentException("Sorting by field 'nonExistentField' is not allowed."));

        // Act & Assert
        IllegalArgumentException ex = org.junit.jupiter.api.Assertions.assertThrows(
            IllegalArgumentException.class,
            () -> carListingController.getFilteredListingsByParams(
                null, // brandSlugs
                null, // modelSlugs
                null, // minYear
                null, // maxYear
                null, // location
                null, // locationId
                null, // minPrice
                null, // maxPrice
                null, // minMileage
                null, // maxMileage
                null, // isSold
                null, // isArchived
                null, // sellerTypeIds
                null, // transmissionId
                null, // fuelTypeId
                null, // bodyStyleIds
                null, // searchQuery
                pageable
            )
        );
        assertEquals("Sorting by field 'nonExistentField' is not allowed.", ex.getMessage());
    }
    
    @Test
    void getListingById_ShouldReturnListing() {
        // Arrange
        when(carListingService.getListingById(1L)).thenReturn(carListingResponse);

        // Act
        ResponseEntity<?> response = carListingController.getListingById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(carListingResponse, response.getBody());
    }
    
    @Test
    void getListingById_WithInvalidId_ShouldThrowException() {
        // Arrange
        when(carListingService.getListingById(999L))
            .thenThrow(new ResourceNotFoundException("Listing", "id", 999L));

        // Act & Assert
        org.junit.jupiter.api.Assertions.assertThrows(
            ResourceNotFoundException.class,
            () -> carListingController.getListingById(999L)
        );
    }

    @Test
    void updateListing_ShouldReturnUpdatedListing() {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Car");
        updateRequest.setDescription("Updated Description");
        
        carListingResponse.setTitle("Updated Car");
        carListingResponse.setDescription("Updated Description");
        
        when(carListingService.updateListing(eq(1L), any(UpdateListingRequest.class), anyString()))
            .thenReturn(carListingResponse);

        // Act
        ResponseEntity<?> response = carListingController.updateListing(1L, updateRequest, userDetails);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(carListingResponse, response.getBody());
    }
    
    @Test
    void deleteListing_ShouldReturnNoContent() {
        // Act
        ResponseEntity<?> response = carListingController.deleteListing(1L, userDetails);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        
        // Verify the service method was called with correct parameters
        verify(carListingService, times(1)).deleteListing(eq(1L), anyString());
    }



    // Tests for mark as sold endpoint
    @Test
    void markListingAsSold_Success() {
        // Arrange
        Long listingId = 1L;
        CarListingResponse soldResponse = new CarListingResponse();
        soldResponse.setId(listingId);
        soldResponse.setIsSold(true);
        
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.markListingAsSold(eq(listingId), anyString()))
            .thenReturn(soldResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(soldResponse, response.getBody());
        
        verify(carListingStatusService).markListingAsSold(eq(listingId), eq("testuser"));
    }
    
    @Test
    void markListingAsSold_ResourceNotFound() {
        Long listingId = 999L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        when(carListingStatusService.markListingAsSold(eq(listingId), anyString()))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody);
        assertTrue(errorBody.containsKey("message"));
    }
    
    @Test
    void markListingAsSold_Forbidden() {
        // Arrange
        Long listingId = 1L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        String errorMessage = "User does not have permission to modify this listing.";
        when(carListingStatusService.markListingAsSold(eq(listingId), anyString()))
            .thenThrow(new SecurityException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody);
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }
    
    @Test
    void markListingAsSold_Conflict() {
        // Arrange
        Long listingId = 1L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        String errorMessage = "Cannot mark an archived listing as sold. Please unarchive first.";
        when(carListingStatusService.markListingAsSold(eq(listingId), anyString()))
            .thenThrow(new IllegalStateException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody);
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }
    
    // Tests for archive listing endpoint
    @Test
    void archiveListing_Success() {
        // Arrange
        Long listingId = 1L;
        CarListingResponse archivedResponse = new CarListingResponse();
        archivedResponse.setId(listingId);
        archivedResponse.setIsArchived(true);
        
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.archiveListing(eq(listingId), anyString()))
            .thenReturn(archivedResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(archivedResponse, response.getBody());
        
        verify(carListingStatusService).archiveListing(eq(listingId), eq("testuser"));
    }
    
    @Test
    void archiveListing_ResourceNotFound() {
        // Arrange
        Long listingId = 999L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        when(carListingStatusService.archiveListing(eq(listingId), anyString()))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
    }
    
    @Test
    void archiveListing_Forbidden() {
        // Arrange
        Long listingId = 1L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        String errorMessage = "User does not have permission to modify this listing.";
        when(carListingStatusService.archiveListing(eq(listingId), anyString()))
            .thenThrow(new SecurityException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
    }
    
    // Tests for unarchive listing endpoint
    @Test
    void unarchiveListing_Success() {
        // Arrange
        Long listingId = 1L;
        CarListingResponse unarchivedResponse = new CarListingResponse();
        unarchivedResponse.setId(listingId);
        unarchivedResponse.setIsArchived(false);
        
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.unarchiveListing(eq(listingId), anyString()))
            .thenReturn(unarchivedResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.unarchiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(unarchivedResponse, response.getBody());
        
        verify(carListingStatusService).unarchiveListing(eq(listingId), eq("testuser"));
    }
    
    @Test
    void unarchiveListing_Conflict() {
        // Arrange
        Long listingId = 1L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        String errorMessage = "Listing with ID 1 is not currently archived.";
        when(carListingStatusService.unarchiveListing(eq(listingId), anyString()))
            .thenThrow(new IllegalStateException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.unarchiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody);
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }
    


    // --- Tests for pauseListing endpoint ---
    @Test
    void pauseListing_Success() {
        Long listingId = 1L;
        CarListingResponse pausedResponse = new CarListingResponse();
        pausedResponse.setId(listingId);
        pausedResponse.setIsUserActive(false);

        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.pauseListing(eq(listingId), eq("testuser")))
            .thenReturn(pausedResponse);

        ResponseEntity<?> response = carListingController.pauseListing(listingId, userDetails);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(pausedResponse, response.getBody());
        verify(carListingStatusService).pauseListing(listingId, "testuser");
    }

    @Test
    void pauseListing_NotFound() {
        Long listingId = 999L;
        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.pauseListing(eq(listingId), eq("testuser")))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));

        ResponseEntity<?> response = carListingController.pauseListing(listingId, userDetails);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals("CarListing not found with id : '" + listingId + "'", errorBody.get("message"));
    }

    @Test
    void pauseListing_Forbidden() {
        Long listingId = 1L;
        String errorMessage = "User does not have permission to modify this listing.";
        when(userDetails.getUsername()).thenReturn("otheruser");
        when(carListingStatusService.pauseListing(eq(listingId), eq("otheruser")))
            .thenThrow(new SecurityException(errorMessage));

        ResponseEntity<?> response = carListingController.pauseListing(listingId, userDetails);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    @Test
    void pauseListing_Conflict() {
        Long listingId = 1L;
        String errorMessage = "Listing with ID " + listingId + " is already paused.";
        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.pauseListing(eq(listingId), eq("testuser")))
            .thenThrow(new IllegalStateException(errorMessage));

        ResponseEntity<?> response = carListingController.pauseListing(listingId, userDetails);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    // --- Tests for resumeListing endpoint ---
    @Test
    void resumeListing_Success() {
        Long listingId = 1L;
        CarListingResponse resumedResponse = new CarListingResponse();
        resumedResponse.setId(listingId);
        resumedResponse.setIsUserActive(true);

        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.resumeListing(eq(listingId), eq("testuser")))
            .thenReturn(resumedResponse);

        ResponseEntity<?> response = carListingController.resumeListing(listingId, userDetails);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(resumedResponse, response.getBody());
        verify(carListingStatusService).resumeListing(listingId, "testuser");
    }

    @Test
    void resumeListing_NotFound() {
        Long listingId = 999L;
        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.resumeListing(eq(listingId), eq("testuser")))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));

        ResponseEntity<?> response = carListingController.resumeListing(listingId, userDetails);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals("CarListing not found with id : '" + listingId + "'", errorBody.get("message"));
    }

    @Test
    void resumeListing_Forbidden() {
        Long listingId = 1L;
        String errorMessage = "User does not have permission to modify this listing.";
        when(userDetails.getUsername()).thenReturn("otheruser");
        when(carListingStatusService.resumeListing(eq(listingId), eq("otheruser")))
            .thenThrow(new SecurityException(errorMessage));

        ResponseEntity<?> response = carListingController.resumeListing(listingId, userDetails);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    @Test
    void resumeListing_Conflict() {
        Long listingId = 1L;
        String errorMessage = "Listing with ID " + listingId + " is already active.";
        when(userDetails.getUsername()).thenReturn("testuser");
        when(carListingStatusService.resumeListing(eq(listingId), eq("testuser")))
            .thenThrow(new IllegalStateException(errorMessage));

        ResponseEntity<?> response = carListingController.resumeListing(listingId, userDetails);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    // --- Integration Tests for pauseListing endpoint (Copied and adapted from unit tests) ---
    @Test
    void pauseListing_Integration_Success() {
        // Arrange
        Long listingId = 1L;
        CarListingResponse pausedResponse = new CarListingResponse();
        pausedResponse.setId(listingId);
        pausedResponse.setIsUserActive(false); // Expected state after pause

        // Mock UserDetails
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");

        // Mock service layer
        when(carListingStatusService.pauseListing(eq(listingId), eq("testuser"))).thenReturn(pausedResponse);

        // Act
        ResponseEntity<?> response = carListingController.pauseListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(pausedResponse, response.getBody());
        verify(carListingStatusService).pauseListing(listingId, "testuser");
    }

    @Test
    void pauseListing_Integration_NotFound() {
        // Arrange
        Long listingId = 999L; // Non-existent ID
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");

        when(carListingStatusService.pauseListing(eq(listingId), eq("testuser")))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));

        // Act
        ResponseEntity<?> response = carListingController.pauseListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody); // Added null check
        assertTrue(errorBody.containsKey("message"));
        assertEquals("CarListing not found with id : '" + listingId + "'", errorBody.get("message"));
    }

    @Test
    void pauseListing_Integration_Forbidden() {
        // Arrange
        Long listingId = 1L;
        String errorMessage = "User does not have permission to modify this listing.";
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("otheruser"); // User who doesn't own the listing

        when(carListingStatusService.pauseListing(eq(listingId), eq("otheruser")))
            .thenThrow(new SecurityException(errorMessage));

        // Act
        ResponseEntity<?> response = carListingController.pauseListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody); // Added null check
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    @Test
    void pauseListing_Integration_Conflict_NotApproved() {
        // Arrange
        Long listingId = 1L;
        String errorMessage = "Cannot pause a listing that is not yet approved.";
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");

        when(carListingStatusService.pauseListing(eq(listingId), eq("testuser")))
            .thenThrow(new IllegalStateException(errorMessage));

        // Act
        ResponseEntity<?> response = carListingController.pauseListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody); // Added null check
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    @Test
    void pauseListing_Integration_Conflict_AlreadyPaused() {
        // Arrange
        Long listingId = 1L;
        String errorMessage = "Listing with ID " + listingId + " is already paused.";
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");

        when(carListingStatusService.pauseListing(eq(listingId), eq("testuser")))
            .thenThrow(new IllegalStateException(errorMessage));

        // Act
        ResponseEntity<?> response = carListingController.pauseListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody); // Added null check
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }


    // --- Integration Tests for resumeListing endpoint (Copied and adapted from unit tests) ---
    @Test
    void resumeListing_Integration_Success() {
        // Arrange
        Long listingId = 1L;
        CarListingResponse resumedResponse = new CarListingResponse();
        resumedResponse.setId(listingId);
        resumedResponse.setIsUserActive(true); // Expected state after resume

        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");

        when(carListingStatusService.resumeListing(eq(listingId), eq("testuser"))).thenReturn(resumedResponse);

        // Act
        ResponseEntity<?> response = carListingController.resumeListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(resumedResponse, response.getBody());
        verify(carListingStatusService).resumeListing(listingId, "testuser");
    }

    @Test
    void resumeListing_Integration_NotFound() {
        // Arrange
        Long listingId = 999L; // Non-existent ID
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");

        when(carListingStatusService.resumeListing(eq(listingId), eq("testuser")))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));

        // Act
        ResponseEntity<?> response = carListingController.resumeListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals("CarListing not found with id : '" + listingId + "'", errorBody.get("message"));
    }

    @Test
    void resumeListing_Integration_Forbidden() {
        // Arrange
        Long listingId = 1L;
        String errorMessage = "User does not have permission to modify this listing.";
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("otheruser"); // User who doesn't own the listing

        when(carListingStatusService.resumeListing(eq(listingId), eq("otheruser")))
            .thenThrow(new SecurityException(errorMessage));

        // Act
        ResponseEntity<?> response = carListingController.resumeListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    @Test
    void resumeListing_Integration_Conflict_Archived() {
        // Arrange
        Long listingId = 1L;
        String errorMessage = "Cannot resume a listing that has been archived. Please contact support or renew if applicable.";
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");

        when(carListingStatusService.resumeListing(eq(listingId), eq("testuser")))
            .thenThrow(new IllegalStateException(errorMessage));

        // Act
        ResponseEntity<?> response = carListingController.resumeListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody); // Added null check
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    @Test
    void resumeListing_Integration_Conflict_AlreadyActive() {
        // Arrange
        Long listingId = 1L;
        String errorMessage = "Listing with ID " + listingId + " is already active.";
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(mockUserDetails.getUsername()).thenReturn("testuser");

        when(carListingStatusService.resumeListing(eq(listingId), eq("testuser")))
            .thenThrow(new IllegalStateException(errorMessage));

        // Act
        ResponseEntity<?> response = carListingController.resumeListing(listingId, mockUserDetails);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Map);
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertNotNull(errorBody); // Added null check
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }

    // === COUNT ENDPOINTS TESTS ===

    @Test
    void getApprovedListingsCount_ShouldReturnCount() {
        // Arrange
        Long expectedCount = 42L;
        when(carListingService.getApprovedListingsCount()).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getApprovedListingsCount();

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getApprovedListingsCount();
    }

    @Test
    void getFilteredListingsCount_WithPostRequest_ShouldReturnCount() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota", "bmw"));
        filterRequest.setMinPrice(new BigDecimal("10000"));
        filterRequest.setMaxPrice(new BigDecimal("50000"));
        
        Long expectedCount = 15L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCount(filterRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getBrandSlugs() != null && 
            filter.getBrandSlugs().containsAll(Arrays.asList("toyota", "bmw")) &&
            filter.getMinPrice().equals(new BigDecimal("10000")) &&
            filter.getMaxPrice().equals(new BigDecimal("50000"))
        ));
    }

    @Test
    void getFilteredListingsCount_WithEmptyFilter_ShouldReturnTotalCount() {
        // Arrange
        ListingFilterRequest emptyFilter = new ListingFilterRequest();
        Long expectedCount = 100L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCount(emptyFilter);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(any(ListingFilterRequest.class));
    }

    @Test
    void getFilteredListingsCountByParams_ShouldReturnCount() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("toyota");
        List<String> modelSlugs = Arrays.asList("camry");
        Integer minYear = 2020;
        Integer maxYear = 2023;
        List<String> locations = Arrays.asList("damascus");
        BigDecimal minPrice = new BigDecimal("20000");
        BigDecimal maxPrice = new BigDecimal("40000");
        Integer minMileage = 0;
        Integer maxMileage = 50000;
        Boolean isSold = false;
        Boolean isArchived = false;
        List<Long> sellerTypeIds = Arrays.asList(1L);
        String searchQuery = "luxury";
        
        Long expectedCount = 25L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            brandSlugs, modelSlugs, minYear, maxYear, locations, null, minPrice, maxPrice,
            minMileage, maxMileage, isSold, isArchived, sellerTypeIds, null, null, null, searchQuery
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getBrandSlugs().equals(brandSlugs) &&
            filter.getModelSlugs().equals(modelSlugs) &&
            filter.getMinYear().equals(minYear) &&
            filter.getMaxYear().equals(maxYear) &&
            filter.getLocations().equals(locations) &&
            filter.getMinPrice().equals(minPrice) &&
            filter.getMaxPrice().equals(maxPrice) &&
            filter.getMinMileage().equals(minMileage) &&
            filter.getMaxMileage().equals(maxMileage) &&
            filter.getIsSold().equals(isSold) &&
            filter.getIsArchived().equals(isArchived) &&
            filter.getSellerTypeIds().equals(sellerTypeIds) &&
            filter.getSearchQuery().equals(searchQuery)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithNullParams_ShouldReturnCount() {
        // Arrange
        Long expectedCount = 75L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(any(ListingFilterRequest.class));
    }

    @Test
    void getFilteredListingsCountByParams_WithLocationId_ShouldReturnCount() {
        // Arrange
        Long locationId = 5L;
        Long expectedCount = 30L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            null, null, null, null, null, locationId, null, null,
            null, null, null, null, null, null, null, null, null
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getLocationId().equals(locationId)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithSoldFilter_ShouldReturnCount() {
        // Arrange
        Boolean isSold = true;
        Long expectedCount = 12L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, null, null,
            null, null, isSold, null, null, null, null, null, null
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getIsSold().equals(isSold)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithArchivedFilter_ShouldReturnCount() {
        // Arrange
        Boolean isArchived = true;
        Long expectedCount = 8L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, null, null,
            null, null, null, isArchived, null, null, null, null, null
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getIsArchived().equals(isArchived)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithComplexFilters_ShouldReturnCount() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("mercedes-benz", "audi");
        Integer minYear = 2018;
        Integer maxYear = 2023;
        BigDecimal minPrice = new BigDecimal("50000");
        BigDecimal maxPrice = new BigDecimal("150000");
        Boolean isSold = false;
        Boolean isArchived = false;
        List<Long> sellerTypeIds = Arrays.asList(2L); // Premium dealer
        String searchQuery = "AMG";
        
        Long expectedCount = 5L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            brandSlugs, null, minYear, maxYear, null, null, minPrice, maxPrice,
            null, null, isSold, isArchived, sellerTypeIds, null, null, null, searchQuery
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getBrandSlugs().equals(brandSlugs) &&
            filter.getMinYear().equals(minYear) &&
            filter.getMaxYear().equals(maxYear) &&
            filter.getMinPrice().equals(minPrice) &&
            filter.getMaxPrice().equals(maxPrice) &&
            filter.getIsSold().equals(isSold) &&
            filter.getIsArchived().equals(isArchived) &&
            filter.getSellerTypeIds().equals(sellerTypeIds) &&
            filter.getSearchQuery().equals(searchQuery)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithMileageRange_ShouldReturnCount() {
        // Arrange
        Integer minMileage = 10000;
        Integer maxMileage = 80000;
        Long expectedCount = 35L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, null, null,
            minMileage, maxMileage, null, null, null, null, null, null, null
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getMinMileage().equals(minMileage) &&
            filter.getMaxMileage().equals(maxMileage)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithModelSlugs_ShouldReturnCount() {
        // Arrange
        List<String> brandSlugs = Arrays.asList("bmw");
        List<String> modelSlugs = Arrays.asList("x5", "x3", "m3");
        Long expectedCount = 18L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            brandSlugs, modelSlugs, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getBrandSlugs().equals(brandSlugs) &&
            filter.getModelSlugs().equals(modelSlugs)
        ));
    }

    @Test
    void getFilteredListingsCountByParams_WithSearchQuery_ShouldReturnCount() {
        // Arrange
        String searchQuery = "sport package navigation";
        Long expectedCount = 22L;
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class))).thenReturn(expectedCount);

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getFilteredListingsCountByParams(
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, searchQuery
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedCount, response.getBody().get("count"));
        verify(carListingService).getFilteredListingsCount(argThat(filter -> 
            filter.getSearchQuery().equals(searchQuery)
        ));
    }

    @Test
    void countEndpoints_ShouldHandleServiceExceptions() {
        // Arrange
        when(carListingService.getApprovedListingsCount())
            .thenThrow(new RuntimeException("Database connection error"));

        // Act
        ResponseEntity<Map<String, Long>> response = carListingController.getApprovedListingsCount();

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(0L, response.getBody().get("count"));
        verify(carListingService).getApprovedListingsCount();
    }

    @Test
    void getFilteredListingsCount_ShouldHandleServiceExceptions() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class)))
            .thenThrow(new RuntimeException("Invalid filter criteria"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            carListingController.getFilteredListingsCount(filterRequest);
        });

        assertEquals("Invalid filter criteria", exception.getMessage());
        verify(carListingService).getFilteredListingsCount(any(ListingFilterRequest.class));
    }

    @Test
    void getFilteredListingsCountByParams_ShouldHandleServiceExceptions() {
        // Arrange
        when(carListingService.getFilteredListingsCount(any(ListingFilterRequest.class)))
            .thenThrow(new IllegalArgumentException("Invalid parameter values"));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            carListingController.getFilteredListingsCountByParams(
                Arrays.asList("invalid-brand"), null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null
            );
        });

        assertEquals("Invalid parameter values", exception.getMessage());
        verify(carListingService).getFilteredListingsCount(any(ListingFilterRequest.class));
    }

    // ==================== COUNT BREAKDOWN ENDPOINT TESTS ====================

    @Test
    void getCountsByYear_ShouldReturnYearCounts() {
        // Given
        Map<String, Long> yearCounts = Map.of("2023", 5L, "2022", 3L, "2021", 2L);
        when(carListingService.getCountsByYear(any(ListingFilterRequest.class))).thenReturn(yearCounts);

        List<String> brandSlugs = Arrays.asList("toyota");
        BigDecimal minPrice = new BigDecimal("10000");

        // When
        ResponseEntity<Map<String, Long>> response = carListingController.getCountsByYear(
            brandSlugs, null, null, minPrice, null, null, null
        );

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(5L, response.getBody().get("2023"));
        assertEquals(3L, response.getBody().get("2022"));
        assertEquals(2L, response.getBody().get("2021"));

        verify(carListingService).getCountsByYear(any(ListingFilterRequest.class));
    }

    @Test
    void getCountsByBrand_ShouldReturnBrandCounts() {
        // Given
        Map<String, Long> brandCounts = Map.of("toyota", 10L, "honda", 8L, "nissan", 6L);
        when(carListingService.getCountsByBrand(any(ListingFilterRequest.class))).thenReturn(brandCounts);

        // When
        ResponseEntity<Map<String, Long>> response = carListingController.getCountsByBrand(
            null, 2020, 2023, null, null, null
        );

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(10L, response.getBody().get("toyota"));
        assertEquals(8L, response.getBody().get("honda"));
        assertEquals(6L, response.getBody().get("nissan"));

        verify(carListingService).getCountsByBrand(any(ListingFilterRequest.class));
    }

    @Test
    void getCountsByModel_ShouldReturnModelCounts() {
        // Given
        Map<String, Long> modelCounts = Map.of("camry", 4L, "civic", 3L, "altima", 2L);
        when(carListingService.getCountsByModel(any(ListingFilterRequest.class))).thenReturn(modelCounts);

        List<String> brandSlugs = Arrays.asList("toyota");
        BigDecimal minPrice = new BigDecimal("15000");

        // When
        ResponseEntity<Map<String, Long>> response = carListingController.getCountsByModel(
            brandSlugs, null, null, null, minPrice, null
        );

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(4L, response.getBody().get("camry"));
        assertEquals(3L, response.getBody().get("civic"));
        assertEquals(2L, response.getBody().get("altima"));

        verify(carListingService).getCountsByModel(any(ListingFilterRequest.class));
    }

    @Test
    void getCountsBySellerType_ShouldReturnSellerTypeCounts() {
        // Given
        Map<String, Long> sellerTypeCounts = Map.of("BUSINESS", 118102L, "PRIVATE", 22771L);
        when(carListingService.getCountsBySellerType(any(ListingFilterRequest.class))).thenReturn(sellerTypeCounts);

        // When
        ResponseEntity<Map<String, Long>> response = carListingController.getCountsBySellerType(
            Arrays.asList("toyota"),
            Arrays.asList("camry"),
            2020,
            2023,
            Arrays.asList("damascus"),
            BigDecimal.valueOf(10000),
            BigDecimal.valueOf(50000),
            10000,
            100000
        );

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals(118102L, response.getBody().get("BUSINESS"));
        assertEquals(22771L, response.getBody().get("PRIVATE"));

        verify(carListingService).getCountsBySellerType(any(ListingFilterRequest.class));
    }

    @Test
    void getFilterBreakdown_ShouldReturnCompleteBreakdown() {
        // Given
        Map<String, Object> breakdown = Map.of(
            "years", Map.of("2023", 5L, "2022", 3L),
            "brands", Map.of("toyota", 8L, "honda", 6L),
            "models", Map.of("camry", 4L, "civic", 2L)
        );
        when(carListingService.getFilterBreakdown(any())).thenReturn(breakdown);

        // When
        ResponseEntity<Map<String, Object>> response = carListingController.getFilterBreakdown();

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("years"));
        assertTrue(response.getBody().containsKey("brands"));
        assertTrue(response.getBody().containsKey("models"));

        verify(carListingService).getFilterBreakdown(any());
    }

    @Test
    void getFilterBreakdown_WithFilters_ShouldPassFilters() {
        // Given
        Map<String, Object> breakdown = Map.of("years", Map.of("2023", 2L));
        when(carListingService.getFilterBreakdown(any(ListingFilterRequest.class))).thenReturn(breakdown);

        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(Arrays.asList("toyota", "honda"));
        filterRequest.setMinPrice(new BigDecimal("10000"));
        filterRequest.setMaxPrice(new BigDecimal("50000"));
        filterRequest.setMinYear(2020);

        // When
        ResponseEntity<Map<String, Object>> response = carListingController.getFilterBreakdownWithFilters(filterRequest);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("years"));

        verify(carListingService).getFilterBreakdown(argThat(filter -> 
            filter != null && 
            filter.getBrandSlugs() != null && 
            filter.getBrandSlugs().contains("toyota") &&
            filter.getMinPrice() != null
        ));
    }

    @Test
    void getCountsByYear_WithComplexFilters_ShouldWork() {
        // Given
        Map<String, Long> yearCounts = Map.of("2023", 1L, "2022", 2L);
        when(carListingService.getCountsByYear(any(ListingFilterRequest.class))).thenReturn(yearCounts);

        List<String> brandSlugs = Arrays.asList("toyota", "honda");
        List<String> location = Arrays.asList("damascus", "aleppo");
        BigDecimal minPrice = new BigDecimal("15000");
        BigDecimal maxPrice = new BigDecimal("45000");
        Integer minMileage = 0;
        Integer maxMileage = 100000;

        // When
        ResponseEntity<Map<String, Long>> response = carListingController.getCountsByYear(
            brandSlugs, null, location, minPrice, maxPrice, minMileage, maxMileage
        );

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1L, response.getBody().get("2023"));
        assertEquals(2L, response.getBody().get("2022"));

        verify(carListingService).getCountsByYear(argThat(filter ->
            filter.getBrandSlugs() != null &&
            filter.getBrandSlugs().size() == 2 &&
            filter.getLocations() != null &&
            filter.getLocations().size() == 2 &&
            filter.getMinPrice().compareTo(new BigDecimal("15000")) == 0
        ));
    }

    @Test
    void filterListings_WithTransmissionIds_ShouldReturnFilteredListings() {
        // Arrange
        List<CarListingResponse> listings = new ArrayList<>();
        listings.add(carListingResponse);
        Page<CarListingResponse> page = new PageImpl<>(listings);
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setTransmissionIds(Arrays.asList(5L, 4L)); // Filter by transmissions (e.g., Automatic, Manual)
        when(carListingService.getFilteredListings(any(ListingFilterRequest.class), any(Pageable.class))).thenReturn(page);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = carListingController.getFilteredListings(filterRequest, pageable);
        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(listings, Objects.requireNonNull(response.getBody()).getContent());
        verify(carListingService).getFilteredListings(argThat(filter ->
            filter.getTransmissionIds() != null && filter.getTransmissionIds().containsAll(Arrays.asList(5L, 4L))
        ), eq(pageable));
    }

    @Test
    void filterListings_WithFuelTypeIds_ShouldReturnFilteredListings() {
        // Arrange
        List<CarListingResponse> listings = new ArrayList<>();
        listings.add(carListingResponse);
        Page<CarListingResponse> page = new PageImpl<>(listings);
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setFuelTypeIds(Arrays.asList(1L, 2L)); // Filter by fuel types (e.g., Gasoline, Diesel)
        when(carListingService.getFilteredListings(any(ListingFilterRequest.class), any(Pageable.class))).thenReturn(page);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = carListingController.getFilteredListings(filterRequest, pageable);
        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(listings, Objects.requireNonNull(response.getBody()).getContent());
        verify(carListingService).getFilteredListings(argThat(filter ->
            filter.getFuelTypeIds() != null && filter.getFuelTypeIds().containsAll(Arrays.asList(1L, 2L))
        ), eq(pageable));
    }

    @Test
    void filterListings_WithBodyStyleIds_ShouldReturnFilteredListings() {
        // Arrange
        List<CarListingResponse> listings = new ArrayList<>();
        listings.add(carListingResponse);
        Page<CarListingResponse> page = new PageImpl<>(listings);
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBodyStyleIds(Arrays.asList(2L, 3L)); // Filter by body styles
        when(carListingService.getFilteredListings(any(ListingFilterRequest.class), any(Pageable.class))).thenReturn(page);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = carListingController.getFilteredListings(filterRequest, pageable);
        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(listings, Objects.requireNonNull(response.getBody()).getContent());
        verify(carListingService).getFilteredListings(argThat(filter ->
            filter.getBodyStyleIds() != null && filter.getBodyStyleIds().containsAll(Arrays.asList(2L, 3L))
        ), eq(pageable));
    }
}
