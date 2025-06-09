package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.Favorite;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.repository.FavoriteRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.FavoriteResponse;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final CarListingRepository carListingRepository;
    private final CarListingMapper carListingMapper;

    private FavoriteResponse toFavoriteResponse(Favorite favorite) {
        try {
            FavoriteResponse response = new FavoriteResponse();
            response.setId(favorite.getId());
            response.setUserId(favorite.getUser().getId());
            response.setCarListingId(favorite.getCarListing().getId());
            response.setCreatedAt(favorite.getCreatedAt());
            return response;
        } catch (Exception e) {
            log.error("Error converting Favorite to FavoriteResponse: {}", e.getMessage());
            throw new IllegalStateException("Error processing favorite response", e);
        }
    }

    /**
     * Add a listing to user's favorites
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    @CacheEvict(value = "favorites", key = "#username + '-' + #listingId")
    public FavoriteResponse addToFavorites(String username, Long listingId) {
        log.debug("Adding listing {} to favorites for user {}", listingId, username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        CarListing listing = carListingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", listingId));

        try {
            // Check if already favorited using repository method
            Optional<Favorite> existingFavorite = favoriteRepository.findByUserAndCarListing(user, listing);

            if (existingFavorite.isPresent()) {
                log.debug("Listing {} is already in favorites for user {}", listingId, username);
                return toFavoriteResponse(existingFavorite.get());
            }

            Favorite favorite = new Favorite();
            favorite.setUser(user);
            favorite.setCarListing(listing);
            
            favorite = favoriteRepository.save(favorite);
            
            log.info("Successfully added listing {} to favorites for user {}", listingId, username);
            
            return toFavoriteResponse(favorite);
        } catch (Exception e) {
            log.error("Error adding listing {} to favorites for user {}: {}", listingId, username, e.getMessage());
            throw new IllegalStateException("Error processing favorite", e);
        }
    }

    /**
     * Remove a listing from user's favorites
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    @CacheEvict(value = "favorites", key = "#username + '-' + #listingId")
    public void removeFromFavorites(String username, Long listingId) {
        log.debug("Removing listing {} from favorites for user {}", listingId, username);
        
        try {
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
            
            CarListing listing = carListingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", listingId));

            // Use repository method instead of direct EntityManager
            favoriteRepository.deleteByUserAndCarListing(user, listing);
            
            log.info("Successfully removed listing {} from favorites for user {}", listingId, username);
        } catch (Exception e) {
            log.error("Error removing listing {} from favorites for user {}: {}", listingId, username, e.getMessage());
            throw new IllegalStateException("Error removing favorite", e);
        }
    }

    /**
     * Get all favorites for a user
     */
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<FavoriteResponse> getUserFavorites(String username) {
        log.debug("Fetching favorites for user {}", username);
        
        try {
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

            // Use repository method for better performance
            List<FavoriteResponse> favorites = favoriteRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toFavoriteResponse)
                .collect(Collectors.toList());
            
            log.info("Found {} favorites for user {}", favorites.size(), username);
            return favorites;
        } catch (Exception e) {
            log.error("Error fetching favorites for user {}: {}", username, e.getMessage());
            throw new IllegalStateException("Error fetching favorites", e);
        }
    }

    /**
     * Get all favorite car listings for a user.
     * Returns the actual CarListing objects that are favorited by the user.
     */
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<CarListing> getUserFavoriteListings(String username) {
        log.debug("Fetching favorite car listings for user {}", username);
        
        try {
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

            // Get the actual CarListing objects
            List<CarListing> favoriteListings = favoriteRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(Favorite::getCarListing)
                .collect(Collectors.toList());
            
            log.info("Found {} favorite listings for user {}", favoriteListings.size(), username);
            return favoriteListings;
        } catch (Exception e) {
            log.error("Error fetching favorite listings for user {}: {}", username, e.getMessage());
            throw new IllegalStateException("Error fetching favorite listings", e);
        }
    }
    
    /**
     * Get all favorite car listings for a user as CarListingResponse DTOs.
     * This avoids serialization issues with Hibernate proxies.
     * 
     * @param username The username of the user
     * @return List of CarListingResponse DTOs
     */
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<CarListingResponse> getUserFavoriteListingResponses(String username) {
        log.debug("Fetching favorite car listing responses for user {}", username);
        
        try {
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

            // Get the listings and map them to DTOs using the mapper
            List<CarListingResponse> favoriteListingResponses = favoriteRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(favorite -> carListingMapper.toCarListingResponse(favorite.getCarListing()))
                .collect(Collectors.toList());
            
            log.info("Found {} favorite listing responses for user {}", favoriteListingResponses.size(), username);
            return favoriteListingResponses;
        } catch (Exception e) {
            log.error("Error fetching favorite listing responses for user {}: {}", username, e.getMessage());
            throw new IllegalStateException("Error fetching favorite listing responses", e);
        }
    }

    /**
     * Check if a listing is in user's favorites
     * @param username The username to check
     * @param listingId The listing ID to check
     * @return true if the listing is in the user's favorites, false if not or if any error occurs
     */
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    @Cacheable(value = "favorites", key = "#username + '-' + #listingId")
    public boolean isFavorite(String username, Long listingId) {
        log.debug("Checking if listing {} is favorite for user {}", listingId, username);
        
        try {
            // Use a count query for better performance
            boolean exists = favoriteRepository.existsByUserUsernameAndCarListingId(username, listingId);
            
            log.debug("Listing {} is {} favorite for user {}", listingId, exists ? "a" : "not a", username);
            return exists;
        } catch (Exception e) {
            log.error("Error checking favorite status for listing {} and user {}: {}", listingId, username, e.getMessage(), e);
            // Return false on any error to ensure frontend keeps working
            return false;
        }
    }
}