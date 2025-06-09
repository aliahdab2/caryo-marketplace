package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Favorite;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.response.FavoriteResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.FavoriteRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock
    private FavoriteRepository favoriteRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarListingRepository carListingRepository;

    @InjectMocks
    private FavoriteService favoriteService;

    private User testUser;
    private CarListing testListing;
    private Favorite testFavorite;
    private FavoriteResponse expectedResponse;
    private final String testUsername = "testUser";
    private final Long testListingId = 1L;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername(testUsername);

        testListing = new CarListing();
        testListing.setId(testListingId);
        testListing.setTitle("Test Car");

        testFavorite = new Favorite();
        testFavorite.setId(1L);
        testFavorite.setUser(testUser);
        testFavorite.setCarListing(testListing);
        testFavorite.setCreatedAt(LocalDateTime.now());

        expectedResponse = new FavoriteResponse();
        expectedResponse.setId(testFavorite.getId());
        expectedResponse.setUserId(testUser.getId());
        expectedResponse.setCarListingId(testListing.getId());
        expectedResponse.setCreatedAt(testFavorite.getCreatedAt());
    }

    @Test
    void addToFavorites_Success() {
        // Arrange
        when(userRepository.findByUsername(testUsername)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListingId)).thenReturn(Optional.of(testListing));
        when(favoriteRepository.findByUserAndCarListing(testUser, testListing)).thenReturn(Optional.empty());
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(testFavorite);

        // Act
        FavoriteResponse result = favoriteService.addToFavorites(testUsername, testListingId);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse.getId(), result.getId());
        assertEquals(expectedResponse.getUserId(), result.getUserId());
        assertEquals(expectedResponse.getCarListingId(), result.getCarListingId());
        verify(favoriteRepository).save(any(Favorite.class));
    }

    @Test
    void addToFavorites_AlreadyExists() {
        // Arrange
        when(userRepository.findByUsername(testUsername)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListingId)).thenReturn(Optional.of(testListing));
        when(favoriteRepository.findByUserAndCarListing(testUser, testListing)).thenReturn(Optional.of(testFavorite));

        // Act
        FavoriteResponse result = favoriteService.addToFavorites(testUsername, testListingId);

        // Assert
        assertNotNull(result);
        assertEquals(expectedResponse.getId(), result.getId());
        assertEquals(expectedResponse.getUserId(), result.getUserId());
        assertEquals(expectedResponse.getCarListingId(), result.getCarListingId());
        verify(favoriteRepository, never()).save(any(Favorite.class));
    }

    @Test
    void addToFavorites_UserNotFound() {
        // Arrange
        when(userRepository.findByUsername(testUsername)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> favoriteService.addToFavorites(testUsername, testListingId));
        verify(favoriteRepository, never()).save(any(Favorite.class));
    }

    @Test
    void addToFavorites_ListingNotFound() {
        // Arrange
        when(userRepository.findByUsername(testUsername)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListingId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> favoriteService.addToFavorites(testUsername, testListingId));
        verify(favoriteRepository, never()).save(any(Favorite.class));
    }

    @Test
    void removeFromFavorites_Success() {
        // Arrange
        when(userRepository.findByUsername(testUsername)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(testListingId)).thenReturn(Optional.of(testListing));

        // Act
        favoriteService.removeFromFavorites(testUsername, testListingId);

        // Assert
        verify(favoriteRepository).deleteByUserAndCarListing(testUser, testListing);
    }

    @Test
    void getUserFavorites_Success() {
        // Arrange
        List<Favorite> favorites = Arrays.asList(testFavorite);
        when(userRepository.findByUsername(testUsername)).thenReturn(Optional.of(testUser));
        when(favoriteRepository.findByUserOrderByCreatedAtDesc(testUser)).thenReturn(favorites);

        // Act
        List<FavoriteResponse> result = favoriteService.getUserFavorites(testUsername);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        FavoriteResponse response = result.get(0);
        assertEquals(expectedResponse.getId(), response.getId());
        assertEquals(expectedResponse.getUserId(), response.getUserId());
        assertEquals(expectedResponse.getCarListingId(), response.getCarListingId());
    }

    @Test
    void isFavorite_True() {
        // Arrange
        when(favoriteRepository.existsByUserUsernameAndCarListingId(testUsername, testListingId)).thenReturn(true);

        // Act
        boolean result = favoriteService.isFavorite(testUsername, testListingId);

        // Assert
        assertTrue(result);
    }

    @Test
    void isFavorite_False() {
        // Arrange
        when(favoriteRepository.existsByUserUsernameAndCarListingId(testUsername, testListingId)).thenReturn(false);

        // Act
        boolean result = favoriteService.isFavorite(testUsername, testListingId);

        // Assert
        assertFalse(result);
    }

    @Test
    void isFavorite_UserNotFound() {
        // Arrange
        when(favoriteRepository.existsByUserUsernameAndCarListingId(testUsername, testListingId)).thenReturn(false);

        // Act
        boolean result = favoriteService.isFavorite(testUsername, testListingId);

        // Assert
        assertFalse(result);
    }

    @Test
    void isFavorite_ListingNotFound() {
        // Arrange
        when(favoriteRepository.existsByUserUsernameAndCarListingId(testUsername, testListingId)).thenReturn(false);

        // Act
        boolean result = favoriteService.isFavorite(testUsername, testListingId);

        // Assert
        assertFalse(result);
    }
}