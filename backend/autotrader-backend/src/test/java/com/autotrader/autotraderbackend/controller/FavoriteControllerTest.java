package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Favorite;
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
    private Favorite testFavorite;
    private CarListing testListing;
    private final String testUsername = "testUser";
    private final Long testListingId = 1L;

    @BeforeEach
    void setUp() {
        mockUserDetails = User.builder()
                .username(testUsername)
                .password("password")
                .authorities(Collections.emptyList())
                .build();

        testListing = new CarListing();
        testListing.setId(testListingId);
        testListing.setTitle("Test Car");

        testFavorite = new Favorite();
        testFavorite.setId(1L);
        testFavorite.setCarListing(testListing);
    }

    @Test
    void addToFavorites_Success() {
        // Arrange
        when(favoriteService.addToFavorites(testUsername, testListingId)).thenReturn(testFavorite);

        // Act
        ResponseEntity<Favorite> response = favoriteController.addToFavorites(mockUserDetails, testListingId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(testFavorite, response.getBody());
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
        List<CarListing> favorites = Arrays.asList(testListing);
        when(favoriteService.getUserFavorites(testUsername)).thenReturn(favorites);

        // Act
        ResponseEntity<List<CarListing>> response = favoriteController.getUserFavorites(mockUserDetails);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals(testListing, response.getBody().get(0));
        verify(favoriteService).getUserFavorites(testUsername);
    }

    @Test
    void getUserFavorites_Empty() {
        // Arrange
        when(favoriteService.getUserFavorites(testUsername)).thenReturn(Collections.emptyList());

        // Act
        ResponseEntity<List<CarListing>> response = favoriteController.getUserFavorites(mockUserDetails);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
        verify(favoriteService).getUserFavorites(testUsername);
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
} 