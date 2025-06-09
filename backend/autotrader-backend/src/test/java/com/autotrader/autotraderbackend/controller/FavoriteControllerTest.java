package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.FavoriteResponse;
import com.autotrader.autotraderbackend.service.FavoriteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteControllerTest {

    @Mock
    private FavoriteService favoriteService;

    @InjectMocks
    private FavoriteController favoriteController;

    private UserDetails mockUserDetails;
    private FavoriteResponse testFavoriteResponse;
    private CarListingResponse testListingResponse;
    private final String testUsername = "testUser";
    private final Long testListingId = 1L;

    @BeforeEach
    void setUp() {
        mockUserDetails = User.builder()
                .username(testUsername)
                .password("password")
                .authorities(Collections.emptyList())
                .build();

        testListingResponse = new CarListingResponse();
        testListingResponse.setId(testListingId);
        testListingResponse.setTitle("Test Car");
        testListingResponse.setPrice(new BigDecimal("25000.00"));
        testListingResponse.setModelYear(2020);
        testListingResponse.setMileage(50000);
        testListingResponse.setBrandNameEn("Toyota");
        testListingResponse.setModelNameEn("Camry");

        testFavoriteResponse = new FavoriteResponse();
        testFavoriteResponse.setId(1L);
        testFavoriteResponse.setUserId(1L);
        testFavoriteResponse.setCarListingId(testListingId);
        testFavoriteResponse.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void addToFavorites_Success() {
        // Arrange
        when(favoriteService.addToFavorites(testUsername, testListingId)).thenReturn(testFavoriteResponse);

        // Act
        ResponseEntity<FavoriteResponse> response = favoriteController.addToFavorites(mockUserDetails, testListingId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(testFavoriteResponse, response.getBody());
        verify(favoriteService).addToFavorites(testUsername, testListingId);
    }

    @Test
    void addToFavorites_NotFound() {
        // Arrange
        when(favoriteService.addToFavorites(testUsername, testListingId))
                .thenThrow(new ResourceNotFoundException("CarListing", "id", testListingId));

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> favoriteController.addToFavorites(mockUserDetails, testListingId));
        verify(favoriteService).addToFavorites(testUsername, testListingId);
    }

    @Test
    void removeFromFavorites_Success() {
        // Arrange
        doNothing().when(favoriteService).removeFromFavorites(anyString(), anyLong());

        // Act
        ResponseEntity<Void> response = favoriteController.removeFromFavorites(mockUserDetails, testListingId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(favoriteService).removeFromFavorites(testUsername, testListingId);
    }

    @Test
    void removeFromFavorites_NotFound() {
        // Arrange
        doThrow(new ResourceNotFoundException("CarListing", "id", testListingId))
                .when(favoriteService).removeFromFavorites(testUsername, testListingId);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> favoriteController.removeFromFavorites(mockUserDetails, testListingId));
        verify(favoriteService).removeFromFavorites(testUsername, testListingId);
    }

    @Test
    void getUserFavorites_Success() {
        // Arrange
        List<CarListingResponse> favorites = Arrays.asList(testListingResponse);
        when(favoriteService.getUserFavoriteListingResponses(testUsername)).thenReturn(favorites);

        // Act
        ResponseEntity<List<CarListingResponse>> response = favoriteController.getUserFavorites(mockUserDetails);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals(testListingResponse, response.getBody().get(0));
        verify(favoriteService).getUserFavoriteListingResponses(testUsername);
    }

    @Test
    void getUserFavorites_Empty() {
        // Arrange
        when(favoriteService.getUserFavoriteListingResponses(testUsername)).thenReturn(Collections.emptyList());

        // Act
        ResponseEntity<List<CarListingResponse>> response = favoriteController.getUserFavorites(mockUserDetails);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
        verify(favoriteService).getUserFavoriteListingResponses(testUsername);
    }

    @Test
    void isFavorite_True() {
        // Arrange
        when(favoriteService.isFavorite(testUsername, testListingId)).thenReturn(true);

        // Act
        ResponseEntity<Boolean> response = favoriteController.isFavorite(mockUserDetails, testListingId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody());
        verify(favoriteService).isFavorite(testUsername, testListingId);
    }

    @Test
    void isFavorite_False() {
        // Arrange
        when(favoriteService.isFavorite(testUsername, testListingId)).thenReturn(false);

        // Act
        ResponseEntity<Boolean> response = favoriteController.isFavorite(mockUserDetails, testListingId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody());
        verify(favoriteService).isFavorite(testUsername, testListingId);
    }

    @Test
    void isFavorite_ListingNotFound() {
        // Arrange
        when(favoriteService.isFavorite(testUsername, testListingId)).thenReturn(false);

        // Act
        ResponseEntity<Boolean> response = favoriteController.isFavorite(mockUserDetails, testListingId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody());
        verify(favoriteService).isFavorite(testUsername, testListingId);
    }
}