package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
public class CarListingControllerTest {

    @Mock
    private CarListingService carListingService;

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
        createRequest.setBrand("Toyota");
        createRequest.setModel("Camry");
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
        carListingResponse.setBrand("Toyota");
        carListingResponse.setModel("Camry");
        carListingResponse.setModelYear(2022);
        carListingResponse.setMileage(5000);
        carListingResponse.setPrice(new BigDecimal("25000.00"));
        carListingResponse.setLocationDetails(locationResponse); // Use setLocationDetails instead of setLocation
        carListingResponse.setDescription("Test Description");
        carListingResponse.setSellerId(1L);
        carListingResponse.setSellerUsername("testuser");
        carListingResponse.setApproved(false);

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
        filterRequest.setBrand("Toyota");
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
        List<CarListingResponse> ascResult = ascResponse.getBody().getContent();
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
        List<CarListingResponse> descResult = descResponse.getBody().getContent();
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
        List<CarListingResponse> ascResult = ascResponse.getBody().getContent();
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
        List<CarListingResponse> descResult = descResponse.getBody().getContent();
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
                null, // brand
                null, // model
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

    @Test
    void approveListing_ShouldReturnApprovedListing() {
        // Arrange
        carListingResponse.setApproved(true);
        when(carListingService.approveListing(1L)).thenReturn(carListingResponse);

        // Act
        ResponseEntity<?> response = carListingController.approveListing(1L);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        // Check the response body is not null before accessing it
        assertNotNull(response.getBody());
        assertEquals(carListingResponse, response.getBody());
        
        // Get the response body and cast it
        CarListingResponse bodyResponse = (CarListingResponse) response.getBody();
        assertTrue(bodyResponse.getApproved());
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
        when(carListingService.markListingAsSold(eq(listingId), anyString()))
            .thenReturn(soldResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(soldResponse, response.getBody());
        
        verify(carListingService).markListingAsSold(eq(listingId), eq("testuser"));
    }
    
    @Test
    void markListingAsSold_ResourceNotFound() {
        // Arrange
        Long listingId = 999L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        when(carListingService.markListingAsSold(eq(listingId), anyString()))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, String> errorBody = (java.util.Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
    }
    
    @Test
    void markListingAsSold_Forbidden() {
        // Arrange
        Long listingId = 1L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        String errorMessage = "User does not have permission to modify this listing.";
        when(carListingService.markListingAsSold(eq(listingId), anyString()))
            .thenThrow(new SecurityException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, String> errorBody = (java.util.Map<String, String>) response.getBody();
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
        when(carListingService.markListingAsSold(eq(listingId), anyString()))
            .thenThrow(new IllegalStateException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.markListingAsSold(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, String> errorBody = (java.util.Map<String, String>) response.getBody();
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
        when(carListingService.archiveListing(eq(listingId), anyString()))
            .thenReturn(archivedResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(archivedResponse, response.getBody());
        
        verify(carListingService).archiveListing(eq(listingId), eq("testuser"));
    }
    
    @Test
    void archiveListing_ResourceNotFound() {
        // Arrange
        Long listingId = 999L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        when(carListingService.archiveListing(eq(listingId), anyString()))
            .thenThrow(new ResourceNotFoundException("CarListing", "id", listingId));
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertTrue(response.getBody() instanceof java.util.Map);
    }
    
    @Test
    void archiveListing_Forbidden() {
        // Arrange
        Long listingId = 1L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        String errorMessage = "User does not have permission to modify this listing.";
        when(carListingService.archiveListing(eq(listingId), anyString()))
            .thenThrow(new SecurityException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.archiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody() instanceof java.util.Map);
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
        when(carListingService.unarchiveListing(eq(listingId), anyString()))
            .thenReturn(unarchivedResponse);
        
        // Act
        ResponseEntity<?> response = carListingController.unarchiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(unarchivedResponse, response.getBody());
        
        verify(carListingService).unarchiveListing(eq(listingId), eq("testuser"));
    }
    
    @Test
    void unarchiveListing_Conflict() {
        // Arrange
        Long listingId = 1L;
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        
        String errorMessage = "Listing with ID 1 is not currently archived.";
        when(carListingService.unarchiveListing(eq(listingId), anyString()))
            .thenThrow(new IllegalStateException(errorMessage));
        
        // Act
        ResponseEntity<?> response = carListingController.unarchiveListing(listingId, userDetails);
        
        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody() instanceof java.util.Map);
        @SuppressWarnings("unchecked")
        java.util.Map<String, String> errorBody = (java.util.Map<String, String>) response.getBody();
        assertTrue(errorBody.containsKey("message"));
        assertEquals(errorMessage, errorBody.get("message"));
    }
}
