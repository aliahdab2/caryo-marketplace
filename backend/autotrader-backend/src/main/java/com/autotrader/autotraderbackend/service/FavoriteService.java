package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.Favorite;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.repository.FavoriteRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final CarListingRepository carListingRepository;

    /**
     * Add a listing to user's favorites
     */
    @Transactional
    public Favorite addToFavorites(String username, Long listingId) {
        log.debug("Adding listing {} to favorites for user {}", listingId, username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        CarListing listing = carListingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", listingId));

        if (favoriteRepository.existsByUserAndCarListing(user, listing)) {
            log.debug("Listing {} is already in favorites for user {}", listingId, username);
            return favoriteRepository.findByUserAndCarListing(user, listing).get();
        }

        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setCarListing(listing);
        
        log.info("Successfully added listing {} to favorites for user {}", listingId, username);
        return favoriteRepository.save(favorite);
    }

    /**
     * Remove a listing from user's favorites
     */
    @Transactional
    public void removeFromFavorites(String username, Long listingId) {
        log.debug("Removing listing {} from favorites for user {}", listingId, username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        CarListing listing = carListingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", listingId));

        favoriteRepository.deleteByUserAndCarListing(user, listing);
        log.info("Successfully removed listing {} from favorites for user {}", listingId, username);
    }

    /**
     * Get all favorites for a user
     */
    @Transactional(readOnly = true)
    public List<CarListing> getUserFavorites(String username) {
        log.debug("Fetching favorites for user {}", username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        List<CarListing> favorites = favoriteRepository.findByUser(user)
            .stream()
            .map(Favorite::getCarListing)
            .collect(Collectors.toList());
        
        log.info("Found {} favorites for user {}", favorites.size(), username);
        return favorites;
    }

    /**
     * Check if a listing is in user's favorites
     */
    @Transactional(readOnly = true)
    public boolean isFavorite(String username, Long listingId) {
        log.debug("Checking if listing {} is favorite for user {}", listingId, username);
        
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        CarListing listing = carListingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", listingId));

        return favoriteRepository.existsByUserAndCarListing(user, listing);
    }
} 