package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
import com.autotrader.autotraderbackend.service.ListingModerationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminListingControllerTest {

    @Mock
    private CarListingService carListingService;

    @Mock
    private ListingModerationService listingModerationService;

    @Mock
    private CarListingStatusService carListingStatusService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AdminListingController adminListingController;

    private CarListing testListing;
    private CarListingResponse testResponse;

    @BeforeEach
    void setUp() {
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Test Car");
        testListing.setApproved(true);

        testResponse = new CarListingResponse();
        testResponse.setId(1L);
        testResponse.setTitle("Test Car");
        testResponse.setApproved(true);

        when(authentication.getName()).thenReturn("admin");
    }

    @Test
    void hideListingAdmin_WithValidRequest_ShouldReturnSuccess() {
        // Arrange
        doNothing().when(listingModerationService).hideListingAsAdmin(any(), any(), any());

        Map<String, String> hideData = new HashMap<>();
        hideData.put("reason", "Inappropriate content");

        // Act
        ResponseEntity<?> response = adminListingController.hideListingAdmin(1L, hideData, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(listingModerationService).hideListingAsAdmin(eq(1L), eq("Inappropriate content"), eq("admin"));
    }

    @Test
    void hideListingAdmin_WithoutReason_ShouldUseDefaultReason() {
        // Arrange
        doNothing().when(listingModerationService).hideListingAsAdmin(any(), any(), any());

        Map<String, String> hideData = new HashMap<>();

        // Act
        ResponseEntity<?> response = adminListingController.hideListingAdmin(1L, hideData, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(listingModerationService).hideListingAsAdmin(eq(1L), eq("Hidden by admin"), eq("admin"));
    }

    @Test
    void unhideListingAdmin_WithValidRequest_ShouldReturnSuccess() {
        // Arrange
        doNothing().when(listingModerationService).unhideListingAsAdmin(any(), any());

        // Act
        ResponseEntity<?> response = adminListingController.unhideListingAdmin(1L, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(listingModerationService).unhideListingAsAdmin(eq(1L), eq("admin"));
    }

    @Test
    void hideListingAdmin_WhenServiceThrowsException_ShouldReturnError() {
        // Arrange
        doThrow(new RuntimeException("Service error")).when(listingModerationService)
                .hideListingAsAdmin(any(), any(), any());

        Map<String, String> hideData = new HashMap<>();
        hideData.put("reason", "Test reason");

        // Act
        ResponseEntity<?> response = adminListingController.hideListingAdmin(1L, hideData, authentication);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void unhideListingAdmin_WhenListingNotFound_ShouldReturnNotFound() {
        // Arrange
        doThrow(new com.autotrader.autotraderbackend.exception.ResourceNotFoundException("CarListing", "id", 1L))
                .when(listingModerationService).unhideListingAsAdmin(any(), any());

        // Act
        ResponseEntity<?> response = adminListingController.unhideListingAdmin(1L, authentication);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}