package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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
        ResponseEntity<CarListingResponse> response = carListingController.createListingWithImage(createRequest, mockImage, userDetails);

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
        
        // Create Page of listings
        Page<CarListingResponse> page = new PageImpl<>(listings);
        
        when(carListingService.getAllApprovedListings(any(Pageable.class))).thenReturn(page);

        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response = carListingController.getAllListings(0, 10, new String[]{"createdAt,desc"});

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
        
        // Create Page of listings
        Page<CarListingResponse> page = new PageImpl<>(listings);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrand("Toyota");
        
        when(carListingService.getFilteredListings(any(ListingFilterRequest.class), any(Pageable.class))).thenReturn(page);

        // Act
        // Call the filter endpoint with filter request, page, size and sort
        ResponseEntity<PageResponse<CarListingResponse>> response = carListingController.getFilteredListings(
            filterRequest, 0, 10, new String[]{"createdAt,desc"});

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(listings, Objects.requireNonNull(response.getBody()).getContent());
    }
}
