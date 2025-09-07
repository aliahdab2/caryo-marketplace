package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CarListingCrudController.
 * Tests the CRUD operations that were extracted from CarListingController.
 *
 * This test class ensures the refactored CRUD endpoints work correctly
 * with proper authentication, validation, and error handling.
 */
@ExtendWith(MockitoExtension.class)
class CarListingCrudControllerTest {

    @Mock
    private CarListingService carListingService;

    @Mock
    private CarListingStatusService carListingStatusService;

    @Mock
    private UserDetails userDetails;

    private CarListingCrudController controller;
    private CarListingResponse mockListing;
    private UpdateListingRequest updateRequest;

    @BeforeEach
    void setUp() {
        controller = new CarListingCrudController(carListingService, carListingStatusService);
        mockListing = createMockListing();
        updateRequest = createUpdateRequest();

        lenient().when(userDetails.getUsername()).thenReturn("testuser");
    }

    @Test
    void getAllListings_ShouldReturnListingsPage() {
        // Given
        List<CarListingResponse> listings = List.of(mockListing);
        Page<CarListingResponse> page = new PageImpl<>(listings);
        when(carListingService.getAllApprovedListings(any(Pageable.class))).thenReturn(page);

        // When
        ResponseEntity<PageResponse<CarListingResponse>> response = controller.getAllListings(Pageable.unpaged());

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());

        verify(carListingService).getAllApprovedListings(any(Pageable.class));
    }

    @Test
    void getListingById_ShouldReturnListing_WhenExists() {
        // Given
        when(carListingService.getListingById(1L)).thenReturn(mockListing);

        // When
        ResponseEntity<CarListingResponse> response = controller.getListingById(1L);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockListing, response.getBody());

        verify(carListingService).getListingById(1L);
    }

    @Test
    void updateListing_ShouldUpdateAndReturnListing() {
        // Given
        when(carListingService.updateListing(eq(1L), any(UpdateListingRequest.class), eq("testuser")))
                .thenReturn(mockListing);

        // When
        ResponseEntity<CarListingResponse> response = controller.updateListing(1L, updateRequest, userDetails);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockListing, response.getBody());

        verify(carListingService).updateListing(eq(1L), any(UpdateListingRequest.class), eq("testuser"));
    }

    @Test
    void updateListing_ShouldThrowException_WhenListingNotFound() {
        // Given
        when(carListingService.updateListing(eq(1L), any(UpdateListingRequest.class), eq("testuser")))
                .thenThrow(new ResourceNotFoundException("Listing", "id", 1L));

        // When & Then
        assertThrows(ResourceNotFoundException.class, () ->
                controller.updateListing(1L, updateRequest, userDetails));

        verify(carListingService).updateListing(eq(1L), any(UpdateListingRequest.class), eq("testuser"));
    }

    @Test
    void deleteListing_ShouldReturnNoContent() {
        // Given
        doNothing().when(carListingService).deleteListing(1L, "testuser");

        // When
        ResponseEntity<Void> response = controller.deleteListing(1L, userDetails);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());

        verify(carListingService).deleteListing(1L, "testuser");
    }

    @Test
    void markListingAsSold_ShouldReturnUpdatedListing() {
        // Given
        when(carListingStatusService.markListingAsSold(1L, "testuser")).thenReturn(mockListing);

        // When
        ResponseEntity<?> response = controller.markListingAsSold(1L, userDetails);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockListing, response.getBody());

        verify(carListingStatusService).markListingAsSold(1L, "testuser");
    }

    @Test
    void archiveListing_ShouldReturnUpdatedListing() {
        // Given
        when(carListingStatusService.archiveListing(1L, "testuser")).thenReturn(mockListing);

        // When
        ResponseEntity<?> response = controller.archiveListing(1L, userDetails);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockListing, response.getBody());

        verify(carListingStatusService).archiveListing(1L, "testuser");
    }

    // Helper methods
    private CarListingResponse createMockListing() {
        CarListingResponse response = new CarListingResponse();
        response.setId(1L);
        response.setTitle("Test Car");
        response.setModelYear(2020);
        response.setPrice(new BigDecimal("25000"));
        response.setMileage(50000);
        response.setApproved(true);
        response.setIsSold(false);
        response.setIsArchived(false);
        response.setMedia(new ArrayList<>());
        return response;
    }

    private UpdateListingRequest createUpdateRequest() {
        UpdateListingRequest request = new UpdateListingRequest();
        request.setTitle("Updated Test Car");
        request.setPrice(new BigDecimal("26000"));
        return request;
    }
}
