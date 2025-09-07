package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CarListingController.
 * Tests the admin endpoints that remained in CarListingController after extraction.
 */
@ExtendWith(MockitoExtension.class)
class CarListingControllerTest {

    @Mock
    private CarListingService carListingService;

    @Mock
    private CarListingStatusService carListingStatusService;

    private CarListingController carListingController;
    private CarListingResponse carListingResponse;

    @BeforeEach
    void setUp() {
        carListingController = new CarListingController(carListingService, carListingStatusService);
        carListingResponse = new CarListingResponse();
        carListingResponse.setId(1L);
        carListingResponse.setTitle("Test Car");
    }

    @Test
    void deleteListingAsAdmin_ShouldReturnNoContent_WhenValid() {
        // Arrange
        doNothing().when(carListingService).deleteListingAsAdmin(1L);

        // Act
        ResponseEntity<Void> response = carListingController.deleteListingAsAdmin(1L);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());

        verify(carListingService).deleteListingAsAdmin(1L);
    }

    @Test
    void deleteListingAsAdmin_ShouldThrowException_WhenListingNotFound() {
        // Arrange
        doThrow(new ResourceNotFoundException("Listing", "id", 1L))
                .when(carListingService).deleteListingAsAdmin(1L);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () ->
                carListingController.deleteListingAsAdmin(1L));

        verify(carListingService).deleteListingAsAdmin(1L);
    }

    @Test
    void getAllListingsAsAdmin_ShouldReturnListingsPage() {
        // Arrange
        List<CarListingResponse> listings = new ArrayList<>();
        listings.add(carListingResponse);
        Page<CarListingResponse> page = new PageImpl<>(listings);
        when(carListingService.getAllListingsAsAdmin(any(Pageable.class))).thenReturn(page);

        // Act
        ResponseEntity<PageResponse<CarListingResponse>> response =
                carListingController.getAllListingsAsAdmin(Pageable.unpaged());

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getContent().size());

        verify(carListingService).getAllListingsAsAdmin(any(Pageable.class));
    }

    @Test
    void approveListingAsAdmin_ShouldReturnSuccessResponse() {
        // Arrange
        when(carListingService.approveListingAsAdmin(1L)).thenReturn(carListingResponse);

        // Act
        ResponseEntity<?> response = carListingController.approveListingAsAdmin(1L);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);

        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Listing approved successfully", responseBody.get("message"));
        assertEquals(carListingResponse, responseBody.get("listing"));

        verify(carListingService).approveListingAsAdmin(1L);
    }

    @Test
    void approveListingAsAdmin_ShouldReturnNotFound_WhenListingNotFound() {
        // Arrange
        when(carListingService.approveListingAsAdmin(1L))
                .thenThrow(new ResourceNotFoundException("Listing", "id", 1L));

        // Act
        ResponseEntity<?> response = carListingController.approveListingAsAdmin(1L);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);

        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Listing not found", responseBody.get("error"));

        verify(carListingService).approveListingAsAdmin(1L);
    }

    @Test
    void approveListingAsAdmin_ShouldReturnConflict_WhenInvalidState() {
        // Arrange
        when(carListingService.approveListingAsAdmin(1L))
                .thenThrow(new IllegalStateException("Listing already approved"));

        // Act
        ResponseEntity<?> response = carListingController.approveListingAsAdmin(1L);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);

        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Conflict", responseBody.get("error"));
        assertEquals("Listing already approved", responseBody.get("message"));

        verify(carListingService).approveListingAsAdmin(1L);
    }

    @Test
    void rejectListingAsAdmin_ShouldReturnSuccessResponse() {
        // Arrange
        doNothing().when(carListingService).deleteListingAsAdmin(1L);

        // Act
        ResponseEntity<?> response = carListingController.rejectListingAsAdmin(1L, null);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);

        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Listing rejected and removed successfully", responseBody.get("message"));
        assertEquals(1L, responseBody.get("listingId"));
        assertEquals("Rejected by admin", responseBody.get("reason"));

        verify(carListingService).deleteListingAsAdmin(1L);
    }

    @Test
    void rejectListingAsAdmin_ShouldHandleCustomReason() {
        // Arrange
        doNothing().when(carListingService).deleteListingAsAdmin(1L);

        Map<String, String> rejectionData = Map.of("reason", "Inappropriate content");

        // Act
        ResponseEntity<?> response = carListingController.rejectListingAsAdmin(1L, rejectionData);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Inappropriate content", responseBody.get("reason"));

        verify(carListingService).deleteListingAsAdmin(1L);
    }

    @Test
    void rejectListingAsAdmin_ShouldReturnNotFound_WhenListingNotFound() {
        // Arrange
        doThrow(new ResourceNotFoundException("Listing", "id", 1L))
                .when(carListingService).deleteListingAsAdmin(1L);

        // Act
        ResponseEntity<?> response = carListingController.rejectListingAsAdmin(1L, null);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);

        @SuppressWarnings("unchecked")
        Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
        assertEquals("Listing not found", responseBody.get("error"));

        verify(carListingService).deleteListingAsAdmin(1L);
    }
}