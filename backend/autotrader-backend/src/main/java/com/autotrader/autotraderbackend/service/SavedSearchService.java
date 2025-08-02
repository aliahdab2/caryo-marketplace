package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.payload.request.SavedSearchRequest;
import com.autotrader.autotraderbackend.payload.response.SavedSearchResponse;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.SavedSearch;
import com.autotrader.autotraderbackend.model.SavedSearchNotification;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.SavedSearchRepository;
import com.autotrader.autotraderbackend.repository.SavedSearchNotificationRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
    private final SavedSearchNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SavedSearchMatchingService matchingService;
    private final JavaMailSender mailSender;

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
            
            // Process each matching search
            for (SavedSearch savedSearch : immediateNotificationSearches) {
                processNotificationForSearch(savedSearch, newListing);
            }
            
        } catch (Exception e) {
            log.error("Error processing new listing {} for notifications: {}", 
                     newListing.getId(), e.getMessage(), e);
            // Don't throw the exception to avoid breaking listing creation
        }
    }
    
    /**
     * Process notification for a specific saved search and listing
     */
    private void processNotificationForSearch(SavedSearch savedSearch, CarListing listing) {
        try {
            // Check if listing matches the search criteria
            if (!matchingService.matches(savedSearch, listing)) {
                log.debug("Listing {} does not match saved search {}", listing.getId(), savedSearch.getId());
                return;
            }
            
            // Check if notification already exists for this combination
            if (notificationRepository.existsBySavedSearchAndListing(savedSearch, listing)) {
                log.debug("Notification already exists for search {} and listing {}", 
                         savedSearch.getId(), listing.getId());
                return;
            }
            
            // Create notification record
            SavedSearchNotification notification = new SavedSearchNotification();
            notification.setSavedSearch(savedSearch);
            notification.setListing(listing);
            notification.setNotifiedAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            // Send email notification
            sendEmailNotification(savedSearch, listing);
            
            // Update last notified timestamp
            savedSearch.setLastNotifiedAt(LocalDateTime.now());
            savedSearchRepository.save(savedSearch);
            
            log.info("Sent notification for saved search {} and listing {}", 
                    savedSearch.getId(), listing.getId());
            
        } catch (Exception e) {
            log.error("Error processing notification for search {} and listing {}: {}", 
                     savedSearch.getId(), listing.getId(), e.getMessage(), e);
        }
    }
    
    /**
     * Send email notification for a matching listing
     */
    private void sendEmailNotification(SavedSearch savedSearch, CarListing listing) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(savedSearch.getUser().getEmail());
            message.setSubject("New Car Listing Matches Your Saved Search");
            message.setText(String.format(
                "A new car listing has been found that matches your saved search '%s':\n\n" +
                "Car: %s\n" +
                "Price: $%s\n" +
                "Year: %d\n" +
                "Mileage: %,d miles\n\n" +
                "View the listing for more details.",
                savedSearch.getNameEn(),
                listing.getTitle(),
                listing.getPrice(),
                listing.getModelYear(),
                listing.getMileage()
            ));
            
            mailSender.send(message);
            log.debug("Email sent to {} for saved search {}", 
                     savedSearch.getUser().getEmail(), savedSearch.getId());
            
        } catch (Exception e) {
            log.error("Failed to send email notification for search {} to {}: {}", 
                     savedSearch.getId(), savedSearch.getUser().getEmail(), e.getMessage(), e);
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