package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.payload.request.LocationRequest;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing locations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final LocationRepository locationRepository;
    private final GovernorateRepository governorateRepository;

    /**
     * Get all active locations
     * @return List of active locations
     */
    @Cacheable("locations")
    public List<LocationResponse> getAllActiveLocations() {
        log.debug("Fetching all active locations");
        return locationRepository.findAll().stream()
                .filter(loc -> loc.getIsActive() != null && loc.getIsActive())
                .map(LocationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get active locations by country code
     * @param countryCode ISO country code (e.g., "SY")
     * @return List of active locations for the given country
     */
    @Cacheable(value = "locationsByCountry", key = "#countryCode")
    public List<LocationResponse> getLocationsByCountry(String countryCode) {
        log.debug("Fetching locations for country: {}", countryCode);
        return locationRepository.findByCountryCodeAndIsActiveTrueOrIsActiveIsNull(countryCode).stream()
                .map(LocationResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Get active locations by governorate
     * @param governorateId The governorate ID
     * @return List of active locations for the given governorate
     */
    @Cacheable(value = "locationsByGovernorate", key = "#governorateId")
    public List<LocationResponse> getLocationsByGovernorate(Long governorateId) {
        log.debug("Fetching locations for governorate ID: {}", governorateId);
        return locationRepository.findByGovernorateIdAndIsActiveTrue(governorateId).stream()
                .map(LocationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a location by its ID
     * @param id The location ID
     * @return The location
     * @throws ResourceNotFoundException if location not found
     */
    public LocationResponse getLocationById(Long id) {
        log.debug("Fetching location with ID: {}", id);
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));
        return LocationResponse.fromEntity(location);
    }

    /**
     * Get a location by its slug
     * @param slug The location slug
     * @return The location
     * @throws ResourceNotFoundException if location not found
     */
    public LocationResponse getLocationBySlug(String slug) {
        log.debug("Fetching location with slug: {}", slug);
        Location location = locationRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "slug", slug));
        return LocationResponse.fromEntity(location);
    }

    /**
     * Search locations by name (in English or Arabic)
     * @param query Search query
     * @param pageable Pagination information
     * @return Page of matching locations
     */
    public Page<LocationResponse> searchLocations(String query, Pageable pageable) {
        log.debug("Searching locations with query: {}", query);
        return locationRepository.searchByName(query, pageable)
                .map(LocationResponse::fromEntity);
    }

    /**
     * Create a new location
     * @param request Location request data
     * @return The created location
     */
    @Transactional
    @CacheEvict(value = {"locations", "locationsByCountry"}, allEntries = true)
    public LocationResponse createLocation(LocationRequest request) {
        log.debug("Creating new location: {}", request);
        
        Location location = new Location();
        updateLocationFromRequest(location, request);
        
        // Generate slug from English name
        String slug = SlugUtils.slugify(request.getNameEn());
        
        // Ensure slug is unique
        String uniqueSlug = ensureUniqueSlug(slug);
        location.setSlug(uniqueSlug);
        
        location = locationRepository.save(location);
        log.info("Created new location with ID: {}", location.getId());
        
        return LocationResponse.fromEntity(location);
    }

    /**
     * Update an existing location
     * @param id Location ID
     * @param request Updated location data
     * @return The updated location
     * @throws ResourceNotFoundException if location not found
     */
    @Transactional
    @CacheEvict(value = {"locations", "locationsByCountry"}, allEntries = true)
    public LocationResponse updateLocation(Long id, LocationRequest request) {
        log.debug("Updating location with ID: {}", id);
        
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));
        
        String originalDisplayNameEn = location.getDisplayNameEn(); // Capture original name before update
        
        updateLocationFromRequest(location, request); // Update all fields from request
        
        // Only update slug if English name has actually changed
        if (request.getNameEn() != null && !request.getNameEn().equals(originalDisplayNameEn)) {
            String slug = SlugUtils.slugify(request.getNameEn());
            String uniqueSlug = ensureUniqueSlug(slug, id);
            location.setSlug(uniqueSlug);
        }
        
        location = locationRepository.save(location);
        log.info("Updated location with ID: {}", location.getId());
        
        return LocationResponse.fromEntity(location);
    }

    /**
     * Delete a location
     * @param id Location ID
     * @throws ResourceNotFoundException if location not found
     */
    @Transactional
    @CacheEvict(value = {"locations", "locationsByCountry"}, allEntries = true)
    public void deleteLocation(Long id) {
        log.debug("Deleting location with ID: {}", id);
        
        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Location", "id", id);
        }
        
        locationRepository.deleteById(id);
        log.info("Deleted location with ID: {}", id);
    }
    
    /**
     * Set a location's active status
     * @param id Location ID
     * @param active Whether the location should be active
     * @return The updated location
     * @throws ResourceNotFoundException if location not found
     */
    @Transactional
    @CacheEvict(value = {"locations", "locationsByCountry"}, allEntries = true)
    public LocationResponse setLocationActive(Long id, boolean active) {
        log.debug("Setting location {} active status to: {}", id, active);
        
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location", "id", id));
        
        location.setIsActive(active);
        location = locationRepository.save(location);
        
        log.info("Updated location {} active status to: {}", id, active);
        return LocationResponse.fromEntity(location);
    }

    /**
     * Update a location entity from a request DTO
     * @param location The location entity to update
     * @param request The request data
     */
    private void updateLocationFromRequest(Location location, LocationRequest request) {
        location.setDisplayNameEn(request.getNameEn());
        location.setDisplayNameAr(request.getNameAr());
        
        // Update to use governorateId instead of countryCode
        if (request.getGovernorateId() != null) {
            Governorate governorate = governorateRepository.findById(request.getGovernorateId())
                .orElseThrow(() -> new ResourceNotFoundException("Governorate", "id", request.getGovernorateId()));
            location.setGovernorate(governorate);
        }
        
        location.setRegion(request.getRegion());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setIsActive(request.getActive() != null ? request.getActive() : true);
    }
    
    /**
     * Ensure a slug is unique by appending a number if needed
     * @param baseSlug The base slug to make unique
     * @return A unique slug
     */
    private String ensureUniqueSlug(String baseSlug) {
        return ensureUniqueSlug(baseSlug, null);
    }
    
    /**
     * Ensure a slug is unique by appending a number if needed
     * @param baseSlug The base slug to make unique
     * @param excludeId ID to exclude from uniqueness check (for updates)
     * @return A unique slug
     */
    private String ensureUniqueSlug(String baseSlug, Long excludeId) {
        String slug = baseSlug;
        int counter = 1;
        boolean exists = true;
        
        while (exists) {
            // Check if the current slug exists for any location except the one being updated
            exists = locationRepository.findBySlug(slug)
                    .map(location -> excludeId == null || !location.getId().equals(excludeId))
                    .orElse(false);
            
            if (exists) {
                // If it exists, append a number and try again
                slug = baseSlug + "-" + counter++;
            }
        }
        
        return slug;
    }
}
