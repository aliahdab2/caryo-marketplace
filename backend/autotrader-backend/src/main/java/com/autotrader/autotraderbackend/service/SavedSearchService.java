package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.payload.request.SavedSearchRequest;
import com.autotrader.autotraderbackend.payload.response.SavedSearchResponse;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.SavedSearch;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.SavedSearchRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedSearchService {

    private final SavedSearchRepository savedSearchRepository;
    private final UserRepository userRepository;

    /**
     * Create a new saved search for the user
     */
    @Transactional
    public SavedSearchResponse createSavedSearch(SavedSearchRequest request, String username) {
        log.info("Creating saved search for user: {}", username);
        
        if (request == null) {
            throw new IllegalArgumentException("SavedSearchRequest cannot be null");
        }
        if (request.getFilters() == null || request.getFilters().isEmpty()) {
            throw new IllegalArgumentException("Search filters cannot be null or empty");
        }
        
        User user = findUserByUsername(username);
        
        SavedSearch savedSearch = new SavedSearch(
            user,
            request.getNameEn(),
            request.getNameAr(),
            request.getFilters(),
            request.getNotificationPreferences()
        );
        
        SavedSearch saved = savedSearchRepository.save(savedSearch);
        log.info("Created saved search with ID: {} for user: {}", saved.getId(), username);
        
        return mapToResponse(saved);
    }

    /**
     * Get all saved searches for a user
     */
    @Transactional(readOnly = true)
    public List<SavedSearchResponse> getUserSavedSearches(String username) {
        log.debug("Fetching saved searches for user: {}", username);
        
        User user = findUserByUsername(username);
        List<SavedSearch> searches = savedSearchRepository.findByUserAndIsActiveTrueOrderByCreatedAtDesc(user);
        
        log.info("Found {} active saved searches for user: {}", searches.size(), username);
        return searches.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific saved search by ID for the user
     */
    @Transactional(readOnly = true)
    public SavedSearchResponse getSavedSearchById(UUID id, String username) {
        log.debug("Fetching saved search {} for user: {}", id, username);
        
        User user = findUserByUsername(username);
        SavedSearch savedSearch = savedSearchRepository.findByIdAndUser(id, user);
        
        if (savedSearch == null) {
            throw new ResourceNotFoundException("SavedSearch", "id", id);
        }
        
        return mapToResponse(savedSearch);
    }

    /**
     * Update an existing saved search
     */
    @Transactional
    public SavedSearchResponse updateSavedSearch(UUID id, SavedSearchRequest request, String username) {
        log.info("Updating saved search {} for user: {}", id, username);
        
        if (request == null) {
            throw new IllegalArgumentException("SavedSearchRequest cannot be null");
        }
        
        User user = findUserByUsername(username);
        SavedSearch savedSearch = savedSearchRepository.findByIdAndUser(id, user);
        
        if (savedSearch == null) {
            throw new ResourceNotFoundException("SavedSearch", "id", id);
        }
        
        // Update fields if provided
        if (request.getNameEn() != null && !request.getNameEn().trim().isEmpty()) {
            savedSearch.setNameEn(request.getNameEn().trim());
        }
        if (request.getNameAr() != null) {
            savedSearch.setNameAr(request.getNameAr().trim());
        }
        if (request.getFilters() != null && !request.getFilters().isEmpty()) {
            savedSearch.setFilters(request.getFilters());
        }
        if (request.getNotificationPreferences() != null) {
            savedSearch.setNotificationPreferences(request.getNotificationPreferences());
        }
        
        SavedSearch updated = savedSearchRepository.save(savedSearch);
        log.info("Updated saved search {} for user: {}", id, username);
        
        return mapToResponse(updated);
    }

    /**
     * Delete a saved search (soft delete by setting isActive to false)
     */
    @Transactional
    public void deleteSavedSearch(UUID id, String username) {
        log.info("Deleting saved search {} for user: {}", id, username);
        
        User user = findUserByUsername(username);
        SavedSearch savedSearch = savedSearchRepository.findByIdAndUser(id, user);
        
        if (savedSearch == null) {
            throw new ResourceNotFoundException("SavedSearch", "id", id);
        }
        
        savedSearch.setIsActive(false);
        savedSearchRepository.save(savedSearch);
        
        log.info("Deleted saved search {} for user: {}", id, username);
    }

    /**
     * Process a new listing for saved search notifications
     * This method should be called when a new car listing is created
     */
    @Transactional
    public void processNewListingForNotifications(CarListing newListing) {
        if (newListing == null) {
            log.warn("Cannot process null listing for notifications");
            return;
        }
        
        log.debug("Processing new listing {} for saved search notifications", newListing.getId());
        
        try {
            // Get all active searches
            List<SavedSearch> allActiveSearches = 
                savedSearchRepository.findActiveSearchesForImmediateNotification();
            
            // Filter for immediate notifications in service layer
            List<SavedSearch> immediateNotificationSearches = allActiveSearches.stream()
                .filter(SavedSearch::isEmailNotificationEnabled)
                .filter(search -> "immediate".equals(search.getNotificationFrequency()))
                .toList();
            
            log.info("Found {} searches for immediate notification processing", 
                    immediateNotificationSearches.size());
            
            // Note: Notification implementation would involve:
            // 1. Check if new listing matches each saved search criteria (use SavedSearchMatchingService)
            // 2. Send notifications for matching searches  
            // 3. Record notification in saved_search_notifications table
            // 4. Update lastNotifiedAt timestamp
            
        } catch (Exception e) {
            log.error("Error processing new listing {} for notifications: {}", 
                     newListing.getId(), e.getMessage(), e);
            // Don't throw the exception to avoid breaking listing creation
        }
    }

    /**
     * Get count of active saved searches for a user
     */
    @Transactional(readOnly = true)
    public long getUserSavedSearchCount(String username) {
        User user = findUserByUsername(username);
        return savedSearchRepository.countByUserAndIsActiveTrue(user);
    }

    // --- Helper Methods ---

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User lookup failed for username: {}", username);
                    return new ResourceNotFoundException("User", "username", username);
                });
    }

    private SavedSearchResponse mapToResponse(SavedSearch savedSearch) {
        SavedSearchResponse response = new SavedSearchResponse();
        response.setId(savedSearch.getId());
        response.setNameEn(savedSearch.getNameEn());
        response.setNameAr(savedSearch.getNameAr());
        response.setFilters(savedSearch.getFilters());
        response.setNotificationPreferences(savedSearch.getNotificationPreferences());
        response.setLastNotifiedAt(savedSearch.getLastNotifiedAt());
        response.setIsActive(savedSearch.getIsActive());
        response.setCreatedAt(savedSearch.getCreatedAt());
        response.setUpdatedAt(savedSearch.getUpdatedAt());
        return response;
    }
}