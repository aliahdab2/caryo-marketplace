package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.payload.response.ApiResponse;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.payload.response.PageResponse;
import com.caryo.marketplace.service.CarListingService;
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

    private CarListingController carListingController;
    private CarListingResponse carListingResponse;

    @BeforeEach
    void setUp() {
        carListingController = new CarListingController(carListingService);
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
        assertTrue(response.getBody() instanceof ApiResponse);

        ApiResponse<?> responseBody = (ApiResponse<?>) response.getBody();
        assertEquals("success", responseBody.getStatus());
        assertEquals("Listing approved successfully", responseBody.getMessage());
        assertEquals(carListingResponse, responseBody.getData());

        verify(carListingService).approveListingAsAdmin(1L);
    }

    @Test
    void approveListingAsAdmin_ShouldThrowException_WhenListingNotFound() {
        // Arrange
        when(carListingService.approveListingAsAdmin(1L))
                .thenThrow(new ResourceNotFoundException("Listing", "id", 1L));

        // Act & Assert — exception propagates to GlobalExceptionHandler
        assertThrows(ResourceNotFoundException.class, () ->
                carListingController.approveListingAsAdmin(1L));

        verify(carListingService).approveListingAsAdmin(1L);
    }

    @Test
    void approveListingAsAdmin_ShouldThrowException_WhenInvalidState() {
        // Arrange
        when(carListingService.approveListingAsAdmin(1L))
                .thenThrow(new IllegalStateException("Listing already approved"));

        // Act & Assert — exception propagates to GlobalExceptionHandler
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                carListingController.approveListingAsAdmin(1L));
        assertEquals("Listing already approved", ex.getMessage());

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
        assertTrue(response.getBody() instanceof ApiResponse);

        ApiResponse<?> responseBody = (ApiResponse<?>) response.getBody();
        assertEquals("success", responseBody.getStatus());
        assertEquals("Listing rejected and removed successfully", responseBody.getMessage());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) responseBody.getData();
        assertEquals(1L, data.get("listingId"));
        assertEquals("Rejected by admin", data.get("reason"));

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

        ApiResponse<?> responseBody = (ApiResponse<?>) response.getBody();
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) responseBody.getData();
        assertEquals("Inappropriate content", data.get("reason"));

        verify(carListingService).deleteListingAsAdmin(1L);
    }

    @Test
    void rejectListingAsAdmin_ShouldThrowException_WhenListingNotFound() {
        // Arrange
        doThrow(new ResourceNotFoundException("Listing", "id", 1L))
                .when(carListingService).deleteListingAsAdmin(1L);

        // Act & Assert — exception propagates to GlobalExceptionHandler
        assertThrows(ResourceNotFoundException.class, () ->
                carListingController.rejectListingAsAdmin(1L, null));

        verify(carListingService).deleteListingAsAdmin(1L);
    }
}