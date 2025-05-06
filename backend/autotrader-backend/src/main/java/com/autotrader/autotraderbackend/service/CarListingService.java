// SortableCarListingField enum moved to its own file (SortableCarListingField.java)
package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.specification.CarListingSpecification;
import com.autotrader.autotraderbackend.service.SortableCarListingField;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarListingService {

    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final StorageService storageService;
    private final CarListingMapper carListingMapper;

    /**
     * Create a new car listing.
     */
    @Transactional
    public CarListingResponse createListing(CreateListingRequest request, MultipartFile image, String username) {
        log.info("Attempting to create new listing for user: {}", username);
        User user = findUserByUsername(username);

        CarListing carListing = buildCarListingFromRequest(request, user);

        CarListing savedListing = carListingRepository.save(carListing);

        // Handle image upload if provided
        if (image != null && !image.isEmpty()) {
            try {
                String imageKey = generateImageKey(savedListing.getId(), image.getOriginalFilename());
                storageService.store(image, imageKey);
                savedListing.setImageKey(imageKey);
                savedListing = carListingRepository.save(savedListing); // Save again to update imageKey
                log.info("Successfully uploaded image for new listing ID: {}", savedListing.getId());
            } catch (StorageException e) {
                // If image upload/update fails, log it but proceed with listing creation response
                log.error("Failed to upload image or update listing with image key for listing ID {}: {}", savedListing.getId(), e.getMessage(), e);
            } catch (Exception e) {
                // Catch unexpected errors during image handling
                log.error("Unexpected error during image handling for listing ID {}: {}", savedListing.getId(), e.getMessage(), e);
            }
        }

        log.info("Successfully created new listing with ID: {} for user: {}", savedListing.getId(), username);
        return carListingMapper.toCarListingResponse(savedListing);
    }

    /**
     * Upload an image for a car listing.
     */
    @Transactional
    public String uploadListingImage(Long listingId, MultipartFile file, String username) {
        log.info("Attempting to upload image for listing ID: {} by user: {}", listingId, username);
        User user = findUserByUsername(username);

        validateFile(file, listingId);

        CarListing listing = findListingById(listingId);

        authorizeListingModification(listing, user, "upload image for");

        String imageKey = generateImageKey(listingId, file.getOriginalFilename());

        try {
            storageService.store(file, imageKey);
            listing.setImageKey(imageKey);
            carListingRepository.save(listing); // Save the updated listing
            log.info("Successfully uploaded image with key '{}' and updated listing ID: {}", imageKey, listingId);
            return imageKey;
        } catch (StorageException e) {
            log.error("Storage service failed to store image for listing ID {}: {}", listingId, e.getMessage(), e);
            throw new StorageException("Failed to store image file.", e);
        } catch (Exception e) {
            log.error("Unexpected error saving listing {} after image upload: {}", listingId, e.getMessage(), e);
            throw new RuntimeException("Failed to update listing after image upload.", e);
        }
    }

    /**
     * Get car listing details by ID. Only returns approved listings.
     */
    @Transactional(readOnly = true)
    public CarListingResponse getListingById(Long id) {
        log.debug("Fetching approved listing details for ID: {}", id);
        // Use findByIdAndApprovedTrue to ensure only approved listings are returned publicly
        CarListing carListing = carListingRepository.findByIdAndApprovedTrue(id)
                .orElseThrow(() -> {
                    log.warn("Approved CarListing lookup failed for ID: {}", id);
                    return new ResourceNotFoundException("CarListing", "id", id);
                });
        return carListingMapper.toCarListingResponse(carListing);
    }

    /**
     * Get all approved listings with pagination.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getAllApprovedListings(Pageable pageable) {
        log.debug("Fetching approved listings page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<CarListing> listingPage = carListingRepository.findByApprovedTrue(pageable);
        log.info("Found {} approved listings on page {}", listingPage.getNumberOfElements(), pageable.getPageNumber());
        return listingPage.map(carListingMapper::toCarListingResponse);
    }

    /**
     * Get filtered and approved listings based on criteria.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getFilteredListings(ListingFilterRequest filterRequest, Pageable pageable) {
        log.debug("Fetching filtered listings with filter: {}, page: {}, size: {}",
                  filterRequest, pageable.getPageNumber(), pageable.getPageSize());

        // --- SORT FIELD VALIDATION ---
        if (pageable.getSort() != null && pageable.getSort().isSorted()) {
            pageable.getSort().forEach(order -> {
                String property = order.getProperty();
                // If the property is a compound (e.g. "price,desc"), split and take the field
                String[] sortParts = property.split(",");
                String requestedField = sortParts[0];
                if (!SortableCarListingField.isAllowed(requestedField)) {
                    log.warn("Attempt to sort by non-whitelisted field: '{}'. Ignoring sort for this field.", requestedField);
                    throw new IllegalArgumentException("Sorting by field '" + requestedField + "' is not allowed.");
                }
            });
        }

        Specification<CarListing> spec;
        Location locationToFilterBy = null;
        boolean locationFilterAttempted = false;
        String locationFilterType = "none"; // For logging

        if (filterRequest.getLocationId() != null) {
            locationFilterAttempted = true;
            locationFilterType = "ID: " + filterRequest.getLocationId();
            Optional<Location> locationOpt = locationRepository.findById(filterRequest.getLocationId());
            if (locationOpt.isPresent()) {
                locationToFilterBy = locationOpt.get();
                log.info("Location found by ID: {}. Applying filter.", filterRequest.getLocationId());
            } else {
                log.warn("Location ID {} provided in filter but not found. No listings will match this location criterion.", filterRequest.getLocationId());
                // locationToFilterBy remains null, spec will be set to disjunction
            }
        } else if (StringUtils.hasText(filterRequest.getLocation())) {
            locationFilterAttempted = true;
            locationFilterType = "slug: '" + filterRequest.getLocation() + "'";
            Optional<Location> locationOpt = locationRepository.findBySlug(filterRequest.getLocation());
            if (locationOpt.isPresent()) {
                locationToFilterBy = locationOpt.get();
                log.info("Location found by slug: '{}'. Applying filter.", filterRequest.getLocation());
            } else {
                log.warn("Location slug '{}' provided in filter but not found. No listings will match this location criterion.", filterRequest.getLocation());
                // locationToFilterBy remains null, spec will be set to disjunction
            }
        }

        if (locationFilterAttempted && locationToFilterBy == null) {
            // A location filter was specified (ID or slug) but the location was not found.
            // We should return an empty page result directly rather than using JPA filtering
            log.info("Location filter ({}) resulted in no valid location. Returning empty page result.", locationFilterType);
            
            // Return empty page immediately
            Page<CarListing> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
            log.info("Empty page returned for invalid location filter");
            return emptyPage.map(carListingMapper::toCarListingResponse);
        } else {
            // Either no location filter was specified, or a valid location was found.
            // Pass locationToFilterBy (which is null if no filter applied, or a valid Location object if found)
            // CarListingSpecification.fromFilter handles a null locationToFilterBy gracefully (no location predicate added).
            spec = CarListingSpecification.fromFilter(filterRequest, locationToFilterBy);
            if (locationToFilterBy != null) {
                log.info("Applying location filter for {}.", locationFilterType);
            } else if (!locationFilterAttempted) {
                log.info("No location ID or slug provided in filter. Proceeding without specific location entity filter.");
            }
        }

        // Always combine with the 'approved' status filter
        // If spec is already criteriaBuilder.disjunction(), 'and(isApproved())' will still result in no matches.
        spec = spec.and(CarListingSpecification.isApproved());

        Page<CarListing> listingPage = carListingRepository.findAll(spec, pageable);
        log.info("Found {} filtered listings matching criteria on page {} (Location filter used: {})",
                 listingPage.getNumberOfElements(), pageable.getPageNumber(), locationFilterType);
        return listingPage.map(carListingMapper::toCarListingResponse);
    }

    /**
     * Get all listings (approved or not) for the specified user.
     */
    @Transactional(readOnly = true)
    public List<CarListingResponse> getMyListings(String username) {
        log.debug("Fetching all listings for user: {}", username);
        User user = findUserByUsername(username);
        List<CarListing> listings = carListingRepository.findBySeller(user);
        log.info("Found {} listings for user: {}", listings.size(), username);
        return listings.stream()
                .map(carListingMapper::toCarListingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Approve a car listing.
     */
    @Transactional
    public CarListingResponse approveListing(Long id) {
        log.info("Attempting to approve listing with ID: {}", id);
        CarListing carListing = findListingById(id); // Throws ResourceNotFoundException if not found

        if (Boolean.TRUE.equals(carListing.getApproved())) {
            log.warn("Listing ID {} is already approved. No action taken.", id);
            throw new IllegalStateException("Listing with ID " + id + " is already approved."); // Caught by Controller -> 409 Conflict
        }

        carListing.setApproved(true);

        CarListing approvedListing = carListingRepository.save(carListing);
        log.info("Successfully approved listing ID: {}", approvedListing.getId());

        return carListingMapper.toCarListingResponse(approvedListing);
    }

    /**
     * Update an existing car listing.
     *
     * @param id         The ID of the car listing to update
     * @param request    Updated listing details
     * @param username   The username of the user making the request
     * @return The updated CarListingResponse
     * @throws ResourceNotFoundException If the listing does not exist
     * @throws SecurityException If the user does not own the listing
     */
    @Transactional
    public CarListingResponse updateListing(Long id, UpdateListingRequest request, String username) {
        log.info("Attempting to update listing with ID: {} by user: {}", id, username);
        
        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", id));
        
        // Check if the user owns this listing
        if (!existingListing.getSeller().getUsername().equals(username)) {
            log.warn("User {} attempted to update listing {} owned by {}", 
                    username, id, existingListing.getSeller().getUsername());
            throw new SecurityException("You are not authorized to update this listing");
        }
        
        // Update only non-null fields
        if (request.getTitle() != null) {
            existingListing.setTitle(request.getTitle());
        }
        if (request.getBrand() != null) {
            existingListing.setBrand(request.getBrand());
        }
        if (request.getModel() != null) {
            existingListing.setModel(request.getModel());
        }
        if (request.getModelYear() != null) {
            existingListing.setModelYear(request.getModelYear());
        }
        if (request.getPrice() != null) {
            existingListing.setPrice(request.getPrice());
        }
        if (request.getMileage() != null) {
            existingListing.setMileage(request.getMileage());
        }
        
        // Handle location updates - only use locationId
        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> {
                    log.warn("Location lookup failed for ID: {}", request.getLocationId());
                    return new ResourceNotFoundException("Location", "id", request.getLocationId());
                });
            existingListing.setLocationEntity(location);
        } else {
            // If locationId is not provided in the request, it implies no change to the location.
            // If the intention is to remove the location, the request should explicitly indicate this,
            // for example, by sending a specific value like -1 or a dedicated flag.
            // Based on current structure, not providing locationId means "keep current locationEntity".
        }
        
        if (request.getDescription() != null) {
            existingListing.setDescription(request.getDescription());
        }
        if (request.getTransmission() != null) {
            existingListing.setTransmission(request.getTransmission());
        }
        
        CarListing updatedListing = carListingRepository.save(existingListing);
        log.info("Successfully updated listing ID: {} by user: {}", id, username);
        
        return carListingMapper.toCarListingResponse(updatedListing);
    }

    /**
     * Delete a car listing.
     *
     * @param id         The ID of the car listing to delete
     * @param username   The username of the user making the request
     * @throws ResourceNotFoundException If the listing does not exist
     * @throws SecurityException If the user does not own the listing
     */
    @Transactional
    public void deleteListing(Long id, String username) {
        log.info("Attempting to delete listing with ID: {} by user: {}", id, username);
        
        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", id));
        
        // Check if the user owns this listing
        if (!existingListing.getSeller().getUsername().equals(username)) {
            log.warn("User {} attempted to delete listing {} owned by {}", 
                    username, id, existingListing.getSeller().getUsername());
            throw new SecurityException("You are not authorized to delete this listing");
        }
        
        // If listing has an image, delete it from storage
        if (existingListing.getImageKey() != null) {
            try {
                storageService.delete(existingListing.getImageKey());
                log.info("Deleted image with key: {} for listing ID: {}", existingListing.getImageKey(), id);
            } catch (StorageException e) {
                // Log but continue with listing deletion
                log.error("Failed to delete image with key: {} for listing ID: {}", existingListing.getImageKey(), id, e);
            }
        }
        
        // Delete the listing
        carListingRepository.delete(existingListing);
        log.info("Successfully deleted listing with ID: {}", id);
    }
    
    /**
     * Admin-only method to delete any car listing.
     *
     * @param id The ID of the car listing to delete
     * @throws ResourceNotFoundException If the listing does not exist
     */
    @Transactional
    public void deleteListingAsAdmin(Long id) {
        log.info("Admin attempting to delete listing with ID: {}", id);
        
        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", id));
        
        // If listing has an image, delete it from storage
        if (existingListing.getImageKey() != null) {
            try {
                storageService.delete(existingListing.getImageKey());
                log.info("Admin deleted image with key: {} for listing ID: {}", existingListing.getImageKey(), id);
            } catch (StorageException e) {
                // Log but continue with listing deletion
                log.error("Admin failed to delete image with key: {} for listing ID: {}", existingListing.getImageKey(), id, e);
            }
        }
        
        // Delete the listing
        carListingRepository.delete(existingListing);
        log.info("Admin successfully deleted listing with ID: {}", id);
    }
    
    // --- Helper Methods ---

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User lookup failed for username: {}", username);
                    return new ResourceNotFoundException("User", "username", username);
                });
    }

    private CarListing findListingById(Long listingId) {
        return carListingRepository.findById(listingId)
                .orElseThrow(() -> {
                    log.warn("CarListing lookup failed for ID: {}", listingId);
                    return new ResourceNotFoundException("CarListing", "id", listingId);
                });
    }

    private void validateFile(MultipartFile file, Long listingId) {
        if (file == null || file.isEmpty()) {
            log.warn("Attempt to upload null or empty file for listing ID: {}", listingId);
            throw new StorageException("File provided for upload is null or empty.");
        }
        // Add other validations if needed (e.g., file type, size)
    }

    private void authorizeListingModification(CarListing listing, User user, String action) {
        if (listing.getSeller() == null || !listing.getSeller().getId().equals(user.getId())) {
            log.warn("Authorization failed: User '{}' (ID: {}) attempted to {} listing ID {} owned by '{}' (ID: {})",
                     user.getUsername(), user.getId(), action, listing.getId(),
                     listing.getSeller() != null ? listing.getSeller().getUsername() : "unknown",
                     listing.getSeller() != null ? listing.getSeller().getId() : "unknown");
            throw new SecurityException("User does not have permission to modify this listing.");
        }
    }

    private String generateImageKey(Long listingId, String originalFilename) {
        // Clean the original filename to prevent path traversal or invalid characters
        String safeFilename = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_") : "image";
        return String.format("listings/%d/%d_%s", listingId, System.currentTimeMillis(), safeFilename);
    }

    private CarListing buildCarListingFromRequest(CreateListingRequest request, User user) {
        CarListing carListing = new CarListing();
        carListing.setTitle(request.getTitle());
        carListing.setBrand(request.getBrand());
        carListing.setModel(request.getModel());
        carListing.setModelYear(request.getModelYear());
        carListing.setPrice(request.getPrice());
        carListing.setMileage(request.getMileage());
        carListing.setDescription(request.getDescription());
        
        // Handle location - only use locationId
        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> {
                    log.warn("Location lookup failed for ID: {}", request.getLocationId());
                    return new ResourceNotFoundException("Location", "id", request.getLocationId());
                });
            carListing.setLocationEntity(location);
        }
        // If request.getLocationId() is null, carListing.locationEntity will remain null.
        
        carListing.setSeller(user);
        carListing.setApproved(false); // Default to not approved
        return carListing;
    }
}