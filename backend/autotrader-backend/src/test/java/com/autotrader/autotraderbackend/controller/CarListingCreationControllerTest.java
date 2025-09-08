package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Unit tests for CarListingCreationController.
 * Tests the creation endpoints that were extracted from CarListingController.
 *
 * This test class ensures the refactored creation endpoints work correctly
 * with proper authentication, validation, and error handling.
 */
@ExtendWith(MockitoExtension.class)
class CarListingCreationControllerTest {

    @Mock
    private CarListingService carListingService;

    private CarListingCreationController controller;

    @BeforeEach
    void setUp() {
        controller = new CarListingCreationController(carListingService);
    }

    @Test
    void createListing_ShouldCreateListing_WhenValidRequestAndVerifiedUser() {
        // Given
        CreateListingRequest request = createValidCreateListingRequest();
        CarListingResponse expectedResponse = createCarListingResponse();
        UserDetails userDetails = createMockUserDetails();

        when(carListingService.canUserCreateListings("testuser")).thenReturn(true);
        when(carListingService.createListingWithMedia(any(CreateListingRequest.class), any(), eq("testuser")))
                .thenReturn(expectedResponse);

        // When
        ResponseEntity<?> response = controller.createListing(request, userDetails);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(expectedResponse, response.getBody());

        verify(carListingService).canUserCreateListings("testuser");
        verify(carListingService).createListingWithMedia(any(CreateListingRequest.class), any(), eq("testuser"));
    }

    @Test
    void createListing_ShouldReturnForbidden_WhenUserNotVerified() {
        // Given
        CreateListingRequest request = createValidCreateListingRequest();
        UserDetails userDetails = createMockUserDetails();

        when(carListingService.canUserCreateListings("testuser")).thenReturn(false);

        // When
        ResponseEntity<?> response = controller.createListing(request, userDetails);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Email verification required"));

        verify(carListingService).canUserCreateListings("testuser");
        verify(carListingService, never()).createListingWithMedia(any(), any(), any());
    }

    @Test
    void createListingWithImage_ShouldCreateListing_WhenValidRequestAndImage() {
        // Given
        CreateListingRequest request = createValidCreateListingRequest();
        CarListingResponse expectedResponse = createCarListingResponse();
        UserDetails userDetails = createMockUserDetails();
        MockMultipartFile imageFile = new MockMultipartFile("image", "test.jpg", "image/jpeg", "test image content".getBytes());

        when(carListingService.canUserCreateListings("testuser")).thenReturn(true);
        when(carListingService.createListingWithMedia(any(CreateListingRequest.class), any(), eq("testuser")))
                .thenReturn(expectedResponse);

        // When
        ResponseEntity<?> response = controller.createListingWithImage(request, imageFile, userDetails);

        // Then
        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(expectedResponse, response.getBody());

        verify(carListingService).canUserCreateListings("testuser");
        verify(carListingService).createListingWithMedia(any(CreateListingRequest.class), any(), eq("testuser"));
    }

    // Helper methods
    private CreateListingRequest createValidCreateListingRequest() {
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setDescription("Test description");
        request.setModelId(1L);
        request.setModelYear(2020);
        request.setPrice(new BigDecimal("25000"));
        request.setMileage(50000);
        request.setFuelTypeId(1L);
        request.setBodyStyleId(1L);
        request.setTransmissionId(1L);
        request.setLocationId(1L);
        request.setContactName("Test Seller");
        request.setContactEmail("test@example.com");
        request.setContactPhone("123-456-7890");
        return request;
    }

    private CarListingResponse createCarListingResponse() {
        CarListingResponse response = new CarListingResponse();
        response.setId(1L);
        response.setTitle("Test Car");
        response.setDescription("Test description");
        response.setModelYear(2020);
        response.setPrice(new BigDecimal("25000"));
        response.setMileage(50000);
        response.setContactName("Test Seller");
        response.setContactEmail("test@example.com");
        response.setContactPhone("123-456-7890");
        response.setCreatedAt(LocalDateTime.now());
        response.setApproved(false);
        response.setIsSold(false);
        response.setIsArchived(false);
        response.setMedia(List.of());
        return response;
    }

    private UserDetails createMockUserDetails() {
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("testuser");
        return userDetails;
    }
}
