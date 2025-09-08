package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.Governorate; // Added
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.Transmission;
import com.autotrader.autotraderbackend.model.FuelType;
import com.autotrader.autotraderbackend.model.BodyStyle;
import java.util.ArrayList;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.specification.CarListingSpecification;
import com.autotrader.autotraderbackend.service.storage.StorageKeyGenerator;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import com.autotrader.autotraderbackend.service.TransmissionService;
import com.autotrader.autotraderbackend.service.FuelTypeService;
import com.autotrader.autotraderbackend.service.BodyStyleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarListingService {

    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final GovernorateRepository governorateRepository;
    private final StorageService storageService;
    private final StorageKeyGenerator storageKeyGenerator;
    private final CarListingMapper carListingMapper;
    private final CarModelService carModelService;
    private final TransmissionService transmissionService;
    private final FuelTypeService fuelTypeService;
    private final BodyStyleService bodyStyleService;
    private final SavedSearchService savedSearchService;
    private final CarListingMediaService carListingMediaService;
    private final CarListingCrudService crudService;
    private final CarListingAnalyticsService analyticsService;

    /**
     * Check if user can create listings (email verified and account active).
     */
    public boolean canUserCreateListings(String username) {
        return crudService.canUserCreateListings(username);
    }

    /**
     * Create a new car listing without media.
     */
    @Transactional
    public CarListingResponse createListing(CreateListingRequest request, String username) {
        Objects.requireNonNull(request, "CreateListingRequest cannot be null");
        if (StringUtils.isBlank(username)) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        log.info("Attempting to create new listing for user: {}", username);

        return crudService.createListingInternal(request, username);
    }

    /**
     * Create a new car listing with optional media upload.
     */
    @Transactional
    public CarListingResponse createListingWithMedia(CreateListingRequest request, MultipartFile image, String username) {
        Objects.requireNonNull(request, "CreateListingRequest cannot be null");
        if (StringUtils.isBlank(username)) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        log.info("Attempting to create new listing with media for user: {}", username);

        // Create the listing first
        CarListingResponse listingResponse = crudService.createListingInternal(request, username);

        // Get the actual entity for notifications and media handling
        CarListing savedListing = carListingRepository.findById(listingResponse.getId())
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", listingResponse.getId()));

        // Handle media upload if provided
        if (Objects.nonNull(image) && !image.isEmpty()) {
            uploadInitialMediaForListing(listingResponse.getId(), image, username);
        }

        // Process the new listing for saved search notifications
        processSavedSearchNotifications(savedListing);

        return listingResponse;
    }

    /**
     * Process saved search notifications for a new listing.
     */
    private void processSavedSearchNotifications(CarListing listing) {
        try {
            savedSearchService.processNewListingForNotifications(listing);
            log.debug("Successfully processed saved search notifications for listing ID: {}", listing.getId());
        } catch (Exception e) {
            log.error("Failed to process saved search notifications for new listing {}: {}",
                     listing.getId(), e.getMessage(), e);
            // Don't fail the listing creation if notification processing fails
        }
    }

    /**
     * Upload initial media for a newly created listing.
     */
    private void uploadInitialMediaForListing(Long listingId, MultipartFile image, String username) {
        try {
            String originalFilename = image.getOriginalFilename();
            if (StringUtils.isBlank(originalFilename)) {
                log.warn("Image for listing ID {} has a blank original filename. Skipping image processing.", listingId);
                return;
            }

            // Delegate media upload to media service
            String imageKey = carListingMediaService.uploadListingImage(listingId, image, username);
            log.info("Successfully uploaded initial image for new listing ID: {}", listingId);

        } catch (StorageException e) {
            log.error("Failed to upload image for listing ID {}: {}. Error: {}",
                     listingId, e.getMessage(), e.getCause() != null ? e.getCause().getMessage() : "N/A", e);
        } catch (Exception e) {
            log.error("Unexpected error during image handling for listing ID {}: {}", listingId, e.getMessage(), e);
        }
    }

    /**
     * Legacy method for backward compatibility - now delegates to createListingWithMedia.
     * @deprecated Use createListingWithMedia for new code
     */
    @Transactional
    @Deprecated
    public CarListingResponse createListing(CreateListingRequest request, MultipartFile image, String username) {
        return createListingWithMedia(request, image, username);
    }

    /**
     * Upload an image for a car listing.
     */
    @Transactional
    public String uploadListingImage(Long listingId, MultipartFile file, String username) {
        return carListingMediaService.uploadListingImage(listingId, file, username);
    }

    /**
     * Upload video file to a car listing following AutoTrader patterns
     */
    @Transactional
    public String uploadListingVideo(Long listingId, MultipartFile file, String username) {
        return carListingMediaService.uploadListingVideo(listingId, file, username);
    }

    /**
     * Generic method for uploading media (images or videos) to car listings
     */
    @Transactional
    public String uploadListingMedia(Long listingId, MultipartFile file, String username, String mediaType) {
        return carListingMediaService.uploadListingMedia(listingId, file, username, mediaType);
    }

    /**
     * Get car listing details by ID. Only returns approved listings.
     */
    @Transactional(readOnly = true)
    public CarListingResponse getListingById(Long id) {
        return crudService.getListingById(id);
    }

    /**
     * Get all approved listings with pagination.
     * By default, this excludes listings that are sold or archived.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getAllApprovedListings(Pageable pageable) {
        log.debug("Fetching approved, not sold, and not archived listings page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        Specification<CarListing> spec = Specification.where(CarListingSpecification.isApproved())
                                                     .and(CarListingSpecification.isNotSold())
                                                     .and(CarListingSpecification.isNotArchived())
                                                     .and(CarListingSpecification.isUserActive()); // Added isUserActive
                                                     
        Page<CarListing> listingPage = carListingRepository.findAll(spec, pageable);
        log.info("Found {} approved, not sold, not archived listings on page {}", listingPage.getNumberOfElements(), pageable.getPageNumber());
        return listingPage.map(carListingMapper::toCarListingResponse);
    }

    /**
     * Get the count of all approved listings.
     * By default, this excludes listings that are sold or archived.
     */
    @Transactional(readOnly = true)
    public long getApprovedListingsCount() {
        log.debug("Counting approved, not sold, and not archived listings");
        
        Specification<CarListing> spec = Specification.where(CarListingSpecification.isApproved())
                                                     .and(CarListingSpecification.isNotSold())
                                                     .and(CarListingSpecification.isNotArchived())
                                                     .and(CarListingSpecification.isUserActive());
                                                     
        long count = carListingRepository.count(spec);
        log.info("Found {} approved, not sold, not archived listings", count);
        return count;
    }

    /**
     * Get filtered and approved listings based on criteria.
     * If isSold is not specified in filterRequest, defaults to false (not sold).
     * If isArchived is not specified in filterRequest, defaults to false (not archived).
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
        boolean locationFilterAttempted = false;
        String locationFilterType = "none"; // For logging
        List<Governorate> governoratesToFilterBy = new ArrayList<>();

        if (filterRequest.getLocationId() != null) {
            locationFilterAttempted = true;
            locationFilterType = "ID: " + filterRequest.getLocationId();
            Optional<Governorate> governorateOpt = governorateRepository.findById(filterRequest.getLocationId());
            if (governorateOpt.isPresent()) {
                governoratesToFilterBy.add(governorateOpt.get());
                log.info("Governorate found by ID: {}. Applying filter.", filterRequest.getLocationId());
            } else {
                log.warn("Governorate ID {} provided in filter but not found. No listings will match this location criterion.", filterRequest.getLocationId());
            }
        } else if (filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) {
            locationFilterAttempted = true;
            locationFilterType = "slugs: " + filterRequest.getLocations();
            
            for (String locationSlug : filterRequest.getLocations()) {
                if (StringUtils.isNotBlank(locationSlug)) {
                    Optional<Governorate> governorateOpt = governorateRepository.findBySlug(locationSlug.trim());
                    if (governorateOpt.isPresent()) {
                        governoratesToFilterBy.add(governorateOpt.get());
                        log.info("Governorate found by slug: '{}'. Adding to filter.", locationSlug);
                    } else {
                        log.warn("Governorate slug '{}' provided in filter but not found. Ignoring this location.", locationSlug);
                    }
                }
            }
        }

        if (locationFilterAttempted && governoratesToFilterBy.isEmpty()) {
            // Location filters were specified but no valid governorates were found.
            // Return an empty page result directly rather than using JPA filtering
            log.info("Location filter ({}) resulted in no valid governorates. Returning empty page result.", locationFilterType);
            
            // Return empty page immediately
            Page<CarListing> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);
            log.info("Empty page returned for invalid location filter");
            return emptyPage.map(carListingMapper::toCarListingResponse);
        } else {
            // Either no location filter was specified, or valid governorates were found.
            // Pass governoratesToFilterBy (which is null/empty if no filter applied, or a list of valid Governorate objects if found)
            // CarListingSpecification.fromFilter handles a null/empty governoratesToFilterBy gracefully (no governorate predicate added).
            spec = CarListingSpecification.fromFilter(filterRequest, governoratesToFilterBy);
            if (governoratesToFilterBy != null && !governoratesToFilterBy.isEmpty()) {
                log.info("Applying governorate filter for {} locations.", governoratesToFilterBy.size());
            } else if (!locationFilterAttempted) {
                log.info("No location IDs or slugs provided in filter. Proceeding without specific governorate filter.");
            }
        }

        // Always combine with the 'approved' status filter
        spec = spec.and(CarListingSpecification.isApproved());
        // Also filter by user active status
        spec = spec.and(CarListingSpecification.isUserActive());

        // Apply isSold and isArchived filters
        // If not specified in the request, default to showing NOT sold and NOT archived listings.
        if (filterRequest.getIsSold() == null) {
            spec = spec.and(CarListingSpecification.isNotSold());
            log.debug("Defaulting filter to isSold=false as it was not specified.");
        }
        // If isSold IS specified, the CarListingSpecification.fromFilter will have already added it.

        if (filterRequest.getIsArchived() == null) {
            spec = spec.and(CarListingSpecification.isNotArchived());
            log.debug("Defaulting filter to isArchived=false as it was not specified.");
        }
        // If isArchived IS specified, the CarListingSpecification.fromFilter will have already added it.


        Page<CarListing> listingPage = carListingRepository.findAll(spec, pageable);
        log.info("Found {} filtered listings matching criteria on page {} (Location filter used: {})",
                 listingPage.getNumberOfElements(), pageable.getPageNumber(), locationFilterType);
        return listingPage.map(carListingMapper::toCarListingResponse);
    }

    /**
     * Get the count of filtered and approved listings based on criteria.
     * If isSold is not specified in filterRequest, defaults to false (not sold).
     * If isArchived is not specified in filterRequest, defaults to false (not archived).
     */
    @Transactional(readOnly = true)
    public long getFilteredListingsCount(ListingFilterRequest filterRequest) {
        log.debug("Counting filtered listings with filter: {}", filterRequest);

        Specification<CarListing> spec;
        boolean locationFilterAttempted = false;
        String locationFilterType = "none"; // For logging
        List<Governorate> governoratesToFilterBy = new ArrayList<>();

        if (filterRequest.getLocationId() != null) {
            locationFilterAttempted = true;
            locationFilterType = "ID: " + filterRequest.getLocationId();
            Optional<Governorate> governorateOpt = governorateRepository.findById(filterRequest.getLocationId());
            if (governorateOpt.isPresent()) {
                governoratesToFilterBy.add(governorateOpt.get());
                log.info("Governorate found by ID: {}. Applying filter.", filterRequest.getLocationId());
            } else {
                log.warn("Governorate ID {} provided in filter but not found. No listings will match this location criterion.", filterRequest.getLocationId());
            }
        } else if (filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) {
            locationFilterAttempted = true;
            locationFilterType = "slugs: " + filterRequest.getLocations();
            
            for (String locationSlug : filterRequest.getLocations()) {
                if (StringUtils.isNotBlank(locationSlug)) {
                    Optional<Governorate> governorateOpt = governorateRepository.findBySlug(locationSlug.trim());
                    if (governorateOpt.isPresent()) {
                        governoratesToFilterBy.add(governorateOpt.get());
                        log.info("Governorate found by slug: '{}'. Adding to filter.", locationSlug);
                    } else {
                        log.warn("Governorate slug '{}' provided in filter but not found. Ignoring this location.", locationSlug);
                    }
                }
            }
        }

        if (locationFilterAttempted && governoratesToFilterBy.isEmpty()) {
            // Location filters were specified but no valid governorates were found.
            // Return 0 count directly
            log.info("Location filter ({}) resulted in no valid governorates. Returning count of 0.", locationFilterType);
            return 0;
        } else {
            // Either no location filter was specified, or valid governorates were found.
            spec = CarListingSpecification.fromFilter(filterRequest, governoratesToFilterBy);
            if (governoratesToFilterBy != null && !governoratesToFilterBy.isEmpty()) {
                log.info("Applying governorate filter for {} locations.", governoratesToFilterBy.size());
            } else if (!locationFilterAttempted) {
                log.info("No location IDs or slugs provided in filter. Proceeding without specific governorate filter.");
            }
        }

        // Always combine with the 'approved' status filter
        spec = spec.and(CarListingSpecification.isApproved());
        // Also filter by user active status
        spec = spec.and(CarListingSpecification.isUserActive());

        // Apply isSold and isArchived filters
        // If not specified in the request, default to showing NOT sold and NOT archived listings.
        if (filterRequest.getIsSold() == null) {
            spec = spec.and(CarListingSpecification.isNotSold());
            log.debug("Defaulting filter to isSold=false as it was not specified.");
        }

        if (filterRequest.getIsArchived() == null) {
            spec = spec.and(CarListingSpecification.isNotArchived());
            log.debug("Defaulting filter to isArchived=false as it was not specified.");
        }

        long count = carListingRepository.count(spec);
        log.info("Found {} filtered listings matching criteria (Location filter used: {})",
                 count, locationFilterType);
        return count;
    }

    /**
     * Get filter breakdown showing counts for each filter option.
     * This is useful for displaying counts next to filter options in the UI.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFilterBreakdown(ListingFilterRequest existingFilters) {
        return analyticsService.getFilterBreakdown(existingFilters);
    }

    /**
     * Get count of listings grouped by model year for filter dropdown.
     * Returns years in descending order (newest first) like AutoTrader UK.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByYear(ListingFilterRequest filterRequest) {
        return analyticsService.getCountsByYear(filterRequest);
    }

    /**
     * Get count of listings grouped by brand.
     * Optimized to use database queries when possible.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByBrand(ListingFilterRequest filterRequest) {
        return analyticsService.getCountsByBrand(filterRequest);
    }

    /**
     * Get count of listings grouped by model.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByModel(ListingFilterRequest filterRequest) {
        return analyticsService.getCountsByModel(filterRequest);
    }

    /**
     * Get count of listings by seller type with optimized approach.
     * Uses direct database queries when possible, falls back to specification filtering when needed.
     */
    public Map<String, Long> getCountsBySellerType(ListingFilterRequest filterRequest) {
        try {
            return analyticsService.getCountsBySellerType(filterRequest);
        } catch (Exception e) {
            log.error("Error getting seller type counts: {}", e.getMessage(), e);
            return Collections.emptyMap();
        }
    }


    /**
     * Get count of listings by fuel type with optimized approach.
     * Uses direct database queries when possible, falls back to specification filtering when needed.
     */
    public Map<String, Long> getCountsByFuelType(ListingFilterRequest filterRequest) {
        try {
            return analyticsService.getCountsByFuelType(filterRequest);
        } catch (Exception e) {
            log.error("Error getting fuel type counts: {}", e.getMessage(), e);
            return Collections.emptyMap();
        }
    }


    /**
     * Get count of listings grouped by transmission.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByTransmission(ListingFilterRequest filterRequest) {
        return analyticsService.getCountsByTransmission(filterRequest);
    }





    /**
     * Get all listings (approved or not) for the specified user.
     * This method does NOT automatically filter by isSold or isArchived,
     * allowing users to see all their listings regardless of state.
     */
    @Transactional(readOnly = true)
    public List<CarListingResponse> getMyListings(String username) {
        return crudService.getMyListings(username);
    }

    /**
     * Update an existing car listing.
     *
     * @param id         The ID of the car listing to update
     * @param request    Updated listing details
     * @param username   The username of the user making the request
     * @return The updated CarListingResponse
     * @throws ResourceNotFoundException If the listing does not exist
     * @throws SecurityException If the user does not own the listing and is not an admin
     */
    @Transactional
    public CarListingResponse updateListing(Long id, UpdateListingRequest request, String username) {
        return crudService.updateListing(id, request, username);
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
        // If listing has media, delete all media files from storage first
        carListingMediaService.deleteListingMedia(id);

        // Then delete the listing itself
        crudService.deleteListing(id, username);
    }
    
    /**
     * Admin-only method to delete any car listing.
     *
     * @param id The ID of the car listing to delete
     * @throws ResourceNotFoundException If the listing does not exist
     */
    @Transactional
    public void deleteListingAsAdmin(Long id) {
        // If listing has media, delete all media files from storage first
        carListingMediaService.deleteListingMedia(id);

        // Then delete the listing itself
        crudService.deleteListingAsAdmin(id);
    }

    /**
     * Admin-only method to approve any car listing.
     * @param id the ID of the listing to approve
     * @return the approved listing response
     * @throws ResourceNotFoundException if the listing is not found
     */
    public CarListingResponse approveListingAsAdmin(Long id) {
        return crudService.approveListingAsAdmin(id);
    }

    /**
     * Admin-only method to get all car listings regardless of approval status.
     * @param pageable pagination information
     * @return paginated list of all car listings
     */
    public Page<CarListingResponse> getAllListingsAsAdmin(Pageable pageable) {
        return crudService.getAllListingsAsAdmin(pageable);
    }
}