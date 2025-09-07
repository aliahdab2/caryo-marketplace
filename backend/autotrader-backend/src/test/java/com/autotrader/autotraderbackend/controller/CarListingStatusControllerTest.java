package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CarListingStatusController.
 * Tests the pause and resume functionality.
 */
@ExtendWith(MockitoExtension.class)
class CarListingStatusControllerTest {

    @Mock
    private CarListingStatusService carListingStatusService;

    @Mock
    private UserDetails userDetails;

    @InjectMocks
    private CarListingStatusController statusController;

    private CarListingResponse mockResponse;

    @BeforeEach
    void setUp() {
        mockResponse = new CarListingResponse();
        mockResponse.setId(1L);
        mockResponse.setTitle("Test Car");

        lenient().when(userDetails.getUsername()).thenReturn("testuser");
    }

    @Test
    void pauseListing_ShouldReturnSuccess() {
        // Arrange
        Long listingId = 1L;
        when(carListingStatusService.pauseListing(listingId, "testuser")).thenReturn(mockResponse);

        // Act
        ResponseEntity<?> response = statusController.pauseListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
        verify(carListingStatusService).pauseListing(listingId, "testuser");
        verify(userDetails).getUsername();
    }

    @Test
    void pauseListing_WithResourceNotFound_ShouldReturn404() {
        // Arrange
        Long listingId = 999L;
        when(carListingStatusService.pauseListing(listingId, "testuser"))
            .thenThrow(new ResourceNotFoundException("Listing", "id", listingId));

        // Act
        ResponseEntity<?> response = statusController.pauseListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Listing not found with id : '999'", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void pauseListing_WithSecurityException_ShouldReturn403() {
        // Arrange
        Long listingId = 1L;
        when(carListingStatusService.pauseListing(listingId, "testuser"))
            .thenThrow(new SecurityException("Access denied"));

        // Act
        ResponseEntity<?> response = statusController.pauseListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Access denied", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void pauseListing_WithAccessDeniedException_ShouldReturn403() {
        // Arrange
        Long listingId = 1L;
        when(carListingStatusService.pauseListing(listingId, "testuser"))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Access denied"));

        // Act
        ResponseEntity<?> response = statusController.pauseListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Access denied", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void pauseListing_WithIllegalStateException_ShouldReturn409() {
        // Arrange
        Long listingId = 1L;
        when(carListingStatusService.pauseListing(listingId, "testuser"))
            .thenThrow(new IllegalStateException("Listing cannot be paused"));

        // Act
        ResponseEntity<?> response = statusController.pauseListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Listing cannot be paused", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void resumeListing_ShouldReturnSuccess() {
        // Arrange
        Long listingId = 2L;
        when(carListingStatusService.resumeListing(listingId, "testuser")).thenReturn(mockResponse);

        // Act
        ResponseEntity<?> response = statusController.resumeListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
        verify(carListingStatusService).resumeListing(listingId, "testuser");
        verify(userDetails).getUsername();
    }

    @Test
    void resumeListing_WithResourceNotFound_ShouldReturn404() {
        // Arrange
        Long listingId = 999L;
        when(carListingStatusService.resumeListing(listingId, "testuser"))
            .thenThrow(new ResourceNotFoundException("Listing", "id", listingId));

        // Act
        ResponseEntity<?> response = statusController.resumeListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Listing not found with id : '999'", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void resumeListing_WithSecurityException_ShouldReturn403() {
        // Arrange
        Long listingId = 2L;
        when(carListingStatusService.resumeListing(listingId, "testuser"))
            .thenThrow(new SecurityException("Access denied"));

        // Act
        ResponseEntity<?> response = statusController.resumeListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Access denied", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void resumeListing_WithAccessDeniedException_ShouldReturn403() {
        // Arrange
        Long listingId = 2L;
        when(carListingStatusService.resumeListing(listingId, "testuser"))
            .thenThrow(new org.springframework.security.access.AccessDeniedException("Access denied"));

        // Act
        ResponseEntity<?> response = statusController.resumeListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Access denied", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void resumeListing_WithIllegalStateException_ShouldReturn409() {
        // Arrange
        Long listingId = 2L;
        when(carListingStatusService.resumeListing(listingId, "testuser"))
            .thenThrow(new IllegalStateException("Listing cannot be resumed"));

        // Act
        ResponseEntity<?> response = statusController.resumeListing(listingId, userDetails);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Listing cannot be resumed", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void pauseListing_WithNullUserDetails_ShouldReturn401() {
        // Arrange
        Long listingId = 1L;
        UserDetails nullUserDetails = null;

        // Act
        ResponseEntity<?> response = statusController.pauseListing(listingId, nullUserDetails);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("User must be authenticated", ((Map<?, ?>) response.getBody()).get("message"));
    }
}
