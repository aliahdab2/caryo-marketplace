package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.SavedSearch;
import com.autotrader.autotraderbackend.model.SavedSearchNotification;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.SavedSearchRequest;
import com.autotrader.autotraderbackend.payload.response.SavedSearchResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.SavedSearchNotificationRepository;
import com.autotrader.autotraderbackend.repository.SavedSearchRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.specification.CarListingSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedSearchService {

    private final SavedSearchRepository savedSearchRepository;
    private final SavedSearchNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SavedSearchMatchingService matchingService;
    private final CarListingRepository carListingRepository;
    private final JavaMailSender mailSender;

    /**
     * Create a new saved search or update existing one with same criteria
     * 
     * Logic:
     * - If criteria already exist for this user → Update existing search (name can change)
     * - If criteria are new for this user → Create new search (name can be duplicate)
     * 
     * We only care about search criteria, not names. Users can have multiple searches
     * with the same name as long as the criteria are different.
     */
    @Transactional
    public SavedSearchResponse createSavedSearch(SavedSearchRequest request, String username) {
        log.info("Creating/updating saved search for user: {}", username);
        
        if (request == null) {
            throw new IllegalArgumentException("SavedSearchRequest cannot be null");
        }
        if (request.getFilters() == null || request.getFilters().isEmpty()) {
            throw new IllegalArgumentException("Search filters cannot be null or empty");
        }
        if (request.getNameEn() == null || request.getNameEn().trim().isEmpty()) {
            throw new IllegalArgumentException("Search name cannot be null or empty");
        }
        if (request.getNameEn().trim().length() > 100) {
            throw new IllegalArgumentException("Search name cannot exceed 100 characters");
        }
        
        User user = findUserByUsername(username);
        String queryHash = generateSearchQueryHash(request.getFilters());
        
        // Validate query hash is not empty
        if (queryHash.isEmpty()) {
            throw new IllegalArgumentException("Invalid search criteria - no meaningful filters provided");
        }
        
        String trimmedName = request.getNameEn().trim();
        
        // Check if user already has a search with same criteria
        SavedSearch existingSearch = savedSearchRepository.findByUserAndSearchQueryHashAndIsActiveTrue(user, queryHash);
        
        if (existingSearch != null) {
            // Update existing search with same criteria (name can be anything)
            log.info("Found existing search with same criteria, updating search ID: {} for user: {}", existingSearch.getId(), username);
            
            existingSearch.setNameEn(trimmedName);
            existingSearch.setNameAr(request.getNameAr() != null ? request.getNameAr().trim() : null);
            existingSearch.setNotificationPreferences(request.getNotificationPreferences());
            
            SavedSearch updated = savedSearchRepository.save(existingSearch);
            return mapToResponse(updated, true); // wasUpdated = true
        }
        
        // Different criteria = create new search (names can be duplicated)
        
        // Check user limits for new searches (max 20 saved searches per user)
        long userSearchCount = savedSearchRepository.countByUserAndIsActiveTrue(user);
        if (userSearchCount >= 20) {
            throw new IllegalArgumentException("You have reached the maximum limit of 20 saved searches. Please delete some existing searches before creating new ones.");
        }
        
        // Create new search
        SavedSearch savedSearch = new SavedSearch(
            user,
            request.getNameEn().trim(),
            request.getNameAr() != null ? request.getNameAr().trim() : null,
            request.getFilters(),
            request.getNotificationPreferences()
        );
        
        savedSearch.setSearchQueryHash(queryHash);
        SavedSearch saved = savedSearchRepository.save(savedSearch);
        
        log.info("Created new saved search with ID: {} for user: {}", saved.getId(), username);
        return mapToResponse(saved, false); // wasUpdated = false
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

    /**
     * Calculate the number of current listings that match a saved search criteria
     */
    @Transactional(readOnly = true)
    public int calculateMatchCount(SavedSearch savedSearch) {
        try {
            // Create a specification for the saved search filters
            Specification<CarListing> spec = createSpecificationFromSavedSearch(savedSearch);
            
            // Add the standard filters for approved, not sold, not archived listings
            spec = spec.and(CarListingSpecification.isApproved())
                      .and(CarListingSpecification.isNotSold())
                      .and(CarListingSpecification.isNotArchived())
                      .and(CarListingSpecification.isUserActive());
            
            // Count using the specification (database-level filtering)
            long count = carListingRepository.count(spec);
            
            log.debug("Calculated match count {} for saved search {}", count, savedSearch.getId());
            return (int) count;

        } catch (Exception e) {
            log.error("Error calculating match count for saved search {}: {}", 
                     savedSearch.getId(), e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Create a specification from saved search filters
     */
    private Specification<CarListing> createSpecificationFromSavedSearch(SavedSearch savedSearch) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            Map<String, Object> filters = savedSearch.getFilters();

            try {
                // Brand filter
                if (filters.get("brandSlugs") instanceof List<?> && !((List<?>) filters.get("brandSlugs")).isEmpty()) {
                    List<String> brands = ((List<?>) filters.get("brandSlugs")).stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
                    predicates.add(root.get("model").get("brand").get("slug").in(brands));
                }

                // Model filter
                if (filters.get("modelSlugs") instanceof List<?> && !((List<?>) filters.get("modelSlugs")).isEmpty()) {
                    List<String> models = ((List<?>) filters.get("modelSlugs")).stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
                    predicates.add(root.get("model").get("slug").in(models));
                }

                // Price range filter
                if (filters.get("minPrice") instanceof Number) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), 
                        BigDecimal.valueOf(((Number) filters.get("minPrice")).doubleValue())));
                }
                if (filters.get("maxPrice") instanceof Number) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), 
                        BigDecimal.valueOf(((Number) filters.get("maxPrice")).doubleValue())));
                }

                // Year range filter
                if (filters.get("minYear") instanceof Number) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("modelYear"), 
                        ((Number) filters.get("minYear")).intValue()));
                }
                if (filters.get("maxYear") instanceof Number) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("modelYear"), 
                        ((Number) filters.get("maxYear")).intValue()));
                }

                // Mileage range filter
                if (filters.get("minMileage") instanceof Number) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("mileage"), 
                        ((Number) filters.get("minMileage")).intValue()));
                }
                if (filters.get("maxMileage") instanceof Number) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("mileage"), 
                        ((Number) filters.get("maxMileage")).intValue()));
                }

                // Transmission filter
                if (filters.get("transmissionSlug") instanceof String transmissionSlug) {
                    predicates.add(criteriaBuilder.equal(root.get("transmissionType").get("slug"), transmissionSlug));
                }

                // Fuel type filter
                if (filters.get("fuelTypeSlugs") instanceof List<?> && !((List<?>) filters.get("fuelTypeSlugs")).isEmpty()) {
                    List<String> fuelTypes = ((List<?>) filters.get("fuelTypeSlugs")).stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
                    predicates.add(root.get("fuelType").get("slug").in(fuelTypes));
                }

                // Body type filter
                if (filters.get("bodyType") instanceof List<?> && !((List<?>) filters.get("bodyType")).isEmpty()) {
                    List<String> bodyTypeSlugs = ((List<?>) filters.get("bodyType")).stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
                    predicates.add(root.get("bodyStyle").get("slug").in(bodyTypeSlugs));
                }

                // Condition filter
                if (filters.get("conditionSlug") instanceof String conditionSlug) {
                    predicates.add(criteriaBuilder.equal(root.get("condition").get("slug"), conditionSlug));
                }

                // Location filter (governorate)
                if (filters.get("location") instanceof List<?> && !((List<?>) filters.get("location")).isEmpty()) {
                    List<String> locationNames = ((List<?>) filters.get("location")).stream()
                        .map(Object::toString)
                        .collect(Collectors.toList());
                    predicates.add(criteriaBuilder.or(
                        root.get("governorate").get("displayNameEn").in(locationNames),
                        root.get("governorate").get("displayNameAr").in(locationNames)
                    ));
                }

                return criteriaBuilder.and(predicates.toArray(new Predicate[0]));

            } catch (Exception e) {
                log.error("Error creating specification from saved search filters: {}", e.getMessage(), e);
                return criteriaBuilder.conjunction(); // Return true (no filtering) on error
            }
        };
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
        return mapToResponse(savedSearch, false);
    }

    private SavedSearchResponse mapToResponse(SavedSearch savedSearch, boolean wasUpdated) {
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
        response.setWasUpdated(wasUpdated);
        
        // Calculate and set match count
        response.setMatchCount(calculateMatchCount(savedSearch));
        
        return response;
    }



    /**
     * Generate a normalized query hash from search filters for duplicate detection
     * Example output: "brand=toyota&model=camry&minPrice=10000&maxPrice=50000"
     */
    private String generateSearchQueryHash(Map<String, Object> filters) {
        if (filters == null || filters.isEmpty()) {
            return "";
        }
        
        Map<String, String> queryParams = new TreeMap<>(); // TreeMap for sorted keys
        
        try {
            for (Map.Entry<String, Object> entry : filters.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();
                
                // Skip null, empty, or meaningless values
                if (value == null) continue;
                if (value instanceof String && ((String) value).trim().isEmpty()) continue;
                if (value instanceof List && ((List<?>) value).isEmpty()) continue;
                if (value instanceof Number && ((Number) value).doubleValue() == 0 && isMinFilter(key)) continue;
                
                // Handle different value types with better null safety
                if (value instanceof List) {
                    List<?> list = (List<?>) value;
                    String sortedValues = list.stream()
                        .filter(Objects::nonNull) // Filter out null values
                        .map(Object::toString)
                        .filter(s -> !s.trim().isEmpty()) // Filter out empty strings
                        .sorted()
                        .collect(Collectors.joining(","));
                    if (!sortedValues.isEmpty()) {
                        queryParams.put(key, sortedValues);
                    }
                } else {
                    String stringValue = value.toString().trim();
                    if (!stringValue.isEmpty()) {
                        queryParams.put(key, stringValue);
                    }
                }
            }
            
            // Build query string with sorted parameters
            return queryParams.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"));
                
        } catch (Exception e) {
            log.warn("Error generating search query hash for filters: {}", filters, e);
            // Fallback to a simple hash based on filter map structure
            return "fallback_" + filters.hashCode();
        }
    }
    
    /**
     * Check if a filter key represents a minimum value filter
     */
    private boolean isMinFilter(String key) {
        return key.startsWith("min") || key.equals("year") || key.equals("mileage");
    }
}