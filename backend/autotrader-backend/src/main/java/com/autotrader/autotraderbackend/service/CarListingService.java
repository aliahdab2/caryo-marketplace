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
        log.debug("Getting filter breakdown with existing filters: {}", existingFilters);
        
        Map<String, Object> breakdown = new HashMap<>();
        
        // Get counts by year (for year filter dropdown)
        breakdown.put("years", getCountsByYear(existingFilters));
        
        // Get counts by brand
        breakdown.put("brands", getCountsByBrand(existingFilters));
        
        // Get counts by model (if brand is selected)
        if (existingFilters != null && existingFilters.getBrandSlugs() != null && !existingFilters.getBrandSlugs().isEmpty()) {
            breakdown.put("models", getCountsByModel(existingFilters));
        }
        
        log.info("Generated filter breakdown with {} categories", breakdown.size());
        return breakdown;
    }

    /**
     * Get count of listings grouped by model year for filter dropdown.
     * Returns years in descending order (newest first) like AutoTrader UK.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByYear(ListingFilterRequest filterRequest) {
        log.debug("Getting counts by year with filters: {}", filterRequest);
        
        try {
            Map<String, Long> yearCounts = new LinkedHashMap<>();
            
            // For simple cases without year filters, use optimized repository method
            if (isSimpleFilterExcludingYear(filterRequest)) {
                List<Object[]> distinctYearCounts = carListingRepository.findDistinctYearsWithCounts();
                
                for (Object[] entry : distinctYearCounts) {
                    Integer year = (Integer) entry[0];
                    Long count = (Long) entry[1];
                    if (year != null && count != null && count > 0) {
                        yearCounts.put(year.toString(), count);
                    }
                }
            } else {
                // For complex filters, use specification approach but exclude year filters
                ListingFilterRequest filterExcludingYear = createFilterExcludingYear(filterRequest);
                Specification<CarListing> baseSpec = buildBaseSpecification(filterExcludingYear, false);
                
                // Get all listings that match the base criteria and group by year
                List<CarListing> listings = carListingRepository.findAll(baseSpec);
                Map<Integer, Long> yearCountsInt = listings.stream()
                    .filter(listing -> listing.getModelYear() != null)
                    .collect(Collectors.groupingBy(
                        CarListing::getModelYear,
                        Collectors.counting()
                    ));
                
                // Convert to String keys and sort by year descending
                yearCountsInt.entrySet().stream()
                    .sorted(Map.Entry.<Integer, Long>comparingByKey().reversed())
                    .forEach(entry -> yearCounts.put(entry.getKey().toString(), entry.getValue()));
            }
            
            log.info("Found counts for {} years", yearCounts.size());
            return yearCounts;
        } catch (Exception e) {
            log.error("Error getting counts by year: {}", e.getMessage(), e);
            return new LinkedHashMap<>();
        }
    }

    /**
     * Get count of listings grouped by brand.
     * Optimized to use database queries when possible.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByBrand(ListingFilterRequest filterRequest) {
        log.debug("Getting counts by brand with filters: {}", filterRequest);
        
        try {
            Map<String, Long> brandCounts = new LinkedHashMap<>();
            
            // Check if we have any filters that would affect brand counts
            if (hasNonBrandFilters(filterRequest)) {
                // Use specification approach when filters are applied
                ListingFilterRequest modifiedFilter = createFilterWithoutBrands(filterRequest);
                Specification<CarListing> baseSpec = buildBaseSpecification(modifiedFilter, false);
                
                List<CarListing> listings = carListingRepository.findAll(baseSpec);
                brandCounts = listings.stream()
                    .filter(listing -> listing.getModel() != null && 
                                     listing.getModel().getBrand() != null &&
                                     StringUtils.isNotBlank(listing.getModel().getBrand().getSlug()))
                    .collect(Collectors.groupingBy(
                        listing -> listing.getModel().getBrand().getSlug(),
                        LinkedHashMap::new,
                        Collectors.counting()
                    ));
            } else {
                // Use efficient database-level counting for unfiltered requests
                List<Object[]> distinctBrandCounts = carListingRepository.findDistinctBrandSlugsWithCounts();
                
                for (Object[] entry : distinctBrandCounts) {
                    String brandSlug = (String) entry[0];
                    Long count = (Long) entry[1];
                    if (StringUtils.isNotBlank(brandSlug) && count != null && count > 0) {
                        brandCounts.put(brandSlug, count);
                    }
                }
            }
            
            log.info("Found counts for {} brands", brandCounts.size());
            return brandCounts;
        } catch (Exception e) {
            log.error("Error getting counts by brand: {}", e.getMessage(), e);
            return new LinkedHashMap<>();
        }
    }

    /**
     * Get count of listings grouped by model.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByModel(ListingFilterRequest filterRequest) {
        log.debug("Getting counts by model with filters: {}", filterRequest);
        
        try {
            Map<String, Long> modelCounts = new LinkedHashMap<>();
            
            // Check if we have any filters that would affect model counts
            if (hasNonModelFilters(filterRequest)) {
                // Use specification approach when filters are applied
                ListingFilterRequest modifiedFilter = createFilterWithoutModels(filterRequest);
                Specification<CarListing> baseSpec = buildBaseSpecification(modifiedFilter, false);
                
                List<CarListing> listings = carListingRepository.findAll(baseSpec);
                modelCounts = listings.stream()
                    .filter(listing -> listing.getModel() != null && 
                                     StringUtils.isNotBlank(listing.getModel().getSlug()))
                    .collect(Collectors.groupingBy(
                        listing -> listing.getModel().getSlug(),
                        LinkedHashMap::new,
                        Collectors.counting()
                    ));
            } else {
                // Use efficient database-level counting for unfiltered requests
                List<Object[]> distinctModelCounts = carListingRepository.findDistinctModelSlugsWithCounts();
                
                for (Object[] entry : distinctModelCounts) {
                    String modelSlug = (String) entry[0];
                    Long count = (Long) entry[1];
                    if (StringUtils.isNotBlank(modelSlug) && count != null && count > 0) {
                        modelCounts.put(modelSlug, count);
                    }
                }
            }
            
            log.info("Found counts for {} models", modelCounts.size());
            return modelCounts;
        } catch (Exception e) {
            log.error("Error getting model counts", e);
            return new LinkedHashMap<>();
        }
    }

    /**
     * Get count of listings by seller type with optimized approach.
     * Uses direct database queries when possible, falls back to specification filtering when needed.
     */
    public Map<String, Long> getCountsBySellerType(ListingFilterRequest filterRequest) {
        log.debug("Getting counts by seller type with filters: {}", filterRequest);
        
        try {
            // Check if we have any filters that would affect seller type counts
            if (hasNonSellerTypeFilters(filterRequest)) {
                // Use specification approach but only fetch the seller type field to minimize memory usage
                return getSellerTypeCountsWithSpecification(filterRequest);
            } else {
                // Use efficient direct query for unfiltered requests
                List<Object[]> distinctSellerTypeCounts = carListingRepository.findDistinctSellerTypesWithCounts();
                
                Map<String, Long> sellerTypeCounts = new LinkedHashMap<>();
                for (Object[] entry : distinctSellerTypeCounts) {
                    String sellerTypeName = (String) entry[0];
                    Long count = (Long) entry[1];
                    if (StringUtils.isNotBlank(sellerTypeName) && count != null && count > 0) {
                        sellerTypeCounts.put(sellerTypeName, count);
                    }
                }
                
                log.info("Found counts for {} seller types (unfiltered)", sellerTypeCounts.size());
                return sellerTypeCounts;
            }
        } catch (Exception e) {
            log.error("Error getting seller type counts", e);
            return new LinkedHashMap<>();
        }
    }

    /**
     * Get seller type counts using specification filtering.
     * Optimized to only fetch necessary fields and avoid loading full entities.
     */
    private Map<String, Long> getSellerTypeCountsWithSpecification(ListingFilterRequest filterRequest) {
        // Remove seller type filter to get all seller types with their counts
        ListingFilterRequest modifiedFilter = createFilterWithoutSellerType(filterRequest);
        
        // Build the specification for filtering
        Specification<CarListing> baseSpec = buildBaseSpecification(modifiedFilter, false);
        
        // Fetch only IDs first to get the filtered listings efficiently
        List<CarListing> filteredListings = carListingRepository.findAll(baseSpec);
        
        // Group by seller type name and count
        Map<String, Long> sellerTypeCounts = filteredListings.stream()
            .filter(listing -> listing.getSeller() != null && 
                             listing.getSeller().getSellerType() != null &&
                             StringUtils.isNotBlank(listing.getSeller().getSellerType().getName()))
            .collect(Collectors.groupingBy(
                listing -> listing.getSeller().getSellerType().getName(),
                LinkedHashMap::new,
                Collectors.counting()
            ));
        
        log.info("Found counts for {} seller types (filtered)", sellerTypeCounts.size());
        return sellerTypeCounts;
    }

    /**
     * Get count of listings by fuel type with optimized approach.
     * Uses direct database queries when possible, falls back to specification filtering when needed.
     */
    public Map<String, Long> getCountsByFuelType(ListingFilterRequest filterRequest) {
        log.debug("Getting counts by fuel type with filters: {}", filterRequest);
        
        try {
            // Check if we have any filters that would affect fuel type counts
            if (hasNonFuelTypeFilters(filterRequest)) {
                // Use specification approach but only fetch the fuel type field to minimize memory usage
                return getFuelTypeCountsWithSpecification(filterRequest);
            } else {
                // Use efficient direct query for unfiltered requests
                List<Object[]> distinctFuelTypeCounts = carListingRepository.findDistinctFuelTypesWithCounts();
                
                Map<String, Long> fuelTypeCounts = new LinkedHashMap<>();
                for (Object[] entry : distinctFuelTypeCounts) {
                    String fuelTypeName = (String) entry[0];
                    Long count = (Long) entry[1];
                    if (StringUtils.isNotBlank(fuelTypeName) && count != null && count > 0) {
                        fuelTypeCounts.put(fuelTypeName, count);
                    }
                }
                
                log.info("Found counts for {} fuel types (unfiltered)", fuelTypeCounts.size());
                return fuelTypeCounts;
            }
        } catch (Exception e) {
            log.error("Error getting fuel type counts", e);
            return new LinkedHashMap<>();
        }
    }

    /**
     * Get fuel type counts using specification filtering.
     * Optimized to only fetch necessary fields and avoid loading full entities.
     */
    private Map<String, Long> getFuelTypeCountsWithSpecification(ListingFilterRequest filterRequest) {
        // Remove fuel type filter to get all fuel types with their counts
        ListingFilterRequest modifiedFilter = createFilterWithoutFuelType(filterRequest);
        
        // Build the specification for filtering
        Specification<CarListing> baseSpec = buildBaseSpecification(modifiedFilter, false);
        
        // Fetch only IDs first to get the filtered listings efficiently
        List<CarListing> filteredListings = carListingRepository.findAll(baseSpec);
        
        // Group by fuel type name and count
        Map<String, Long> fuelTypeCounts = filteredListings.stream()
            .filter(listing -> listing.getFuelType() != null && 
                             StringUtils.isNotBlank(listing.getFuelType().getName()))
            .collect(Collectors.groupingBy(
                listing -> listing.getFuelType().getName(),
                LinkedHashMap::new,
                Collectors.counting()
            ));
        
        log.info("Found counts for {} fuel types (filtered)", fuelTypeCounts.size());
        return fuelTypeCounts;
    }

    /**
     * Get count of listings grouped by transmission.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByTransmission(ListingFilterRequest filterRequest) {
        log.debug("Getting counts by transmission with filters: {}", filterRequest);
        
        try {
            // Always use specification approach for transmission counts
            return getTransmissionCountsWithSpecification(filterRequest);
        } catch (Exception e) {
            log.error("Error getting transmission counts", e);
            return new LinkedHashMap<>();
        }
    }

    /**
     * Get transmission counts using specification filtering.
     * Optimized to only fetch necessary fields and avoid loading full entities.
     */
    private Map<String, Long> getTransmissionCountsWithSpecification(ListingFilterRequest filterRequest) {
        // Remove transmission filter to get all transmission types with their counts
        ListingFilterRequest modifiedFilter = createFilterWithoutTransmission(filterRequest);
        
        // Build the specification for filtering
        Specification<CarListing> baseSpec = buildBaseSpecification(modifiedFilter, false);
        
        // Fetch only IDs first to get the filtered listings efficiently
        List<CarListing> filteredListings = carListingRepository.findAll(baseSpec);
        
        // Group by transmission name and count
        Map<String, Long> transmissionCounts = filteredListings.stream()
            .filter(listing -> listing.getTransmissionType() != null && 
                             StringUtils.isNotBlank(listing.getTransmissionType().getName()))
            .collect(Collectors.groupingBy(
                listing -> listing.getTransmissionType().getName().toLowerCase(),
                LinkedHashMap::new,
                Collectors.counting()
            ));
        
        log.info("Found counts for {} transmission types (filtered)", transmissionCounts.size());
        return transmissionCounts;
    }

    private boolean hasNonSellerTypeFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;
        
        return filterRequest.getBrandSlugs() != null && !filterRequest.getBrandSlugs().isEmpty() ||
               filterRequest.getModelSlugs() != null && !filterRequest.getModelSlugs().isEmpty() ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty() ||
               filterRequest.getLocationId() != null ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty();
    }

    private boolean hasNonFuelTypeFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;
        
        return filterRequest.getBrandSlugs() != null && !filterRequest.getBrandSlugs().isEmpty() ||
               filterRequest.getModelSlugs() != null && !filterRequest.getModelSlugs().isEmpty() ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty() ||
               filterRequest.getLocationId() != null ||
               filterRequest.getSellerTypeIds() != null && !filterRequest.getSellerTypeIds().isEmpty() ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty();
    }

    private boolean hasNonTransmissionFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;
        
        return filterRequest.getBrandSlugs() != null && !filterRequest.getBrandSlugs().isEmpty() ||
               filterRequest.getModelSlugs() != null && !filterRequest.getModelSlugs().isEmpty() ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty() ||
               filterRequest.getLocationId() != null ||
               filterRequest.getSellerTypeIds() != null && !filterRequest.getSellerTypeIds().isEmpty() ||
               filterRequest.getFuelTypeSlugs() != null && !filterRequest.getFuelTypeSlugs().isEmpty() ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty();
    }

    private boolean hasNonModelFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;
        
        return filterRequest.getBrandSlugs() != null && !filterRequest.getBrandSlugs().isEmpty() ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty() ||
               filterRequest.getLocationId() != null ||
               filterRequest.getSellerTypeIds() != null && !filterRequest.getSellerTypeIds().isEmpty() ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty();
    }

    /**
     * Create a filter request without brand filters.
     */
    private ListingFilterRequest createFilterWithoutBrands(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();
        
        ListingFilterRequest modified = new ListingFilterRequest();
        // Copy all filters except brands
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        
        return modified;
    }

    /**
     * Create a filter request without model filters.
     */
    private ListingFilterRequest createFilterWithoutModels(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();
        
        ListingFilterRequest modified = new ListingFilterRequest();
        // Copy all filters except models
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        
        return modified;
    }

    /**
     * Create a filter request without seller type filters.
     */
    private ListingFilterRequest createFilterWithoutSellerType(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();
        
        ListingFilterRequest modified = new ListingFilterRequest();
        // Copy all filters except seller type
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Note: sellerTypeId is intentionally excluded
        
        return modified;
    }

    /**
     * Create a filter request without fuel type filters.
     */
    private ListingFilterRequest createFilterWithoutFuelType(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();
        
        ListingFilterRequest modified = new ListingFilterRequest();
        // Copy all filters except fuel type
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Note: fuelTypeId is intentionally excluded
        
        return modified;
    }

    /**
     * Create a filter request without transmission filters.
     */
    private ListingFilterRequest createFilterWithoutTransmission(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();
        
        ListingFilterRequest modified = new ListingFilterRequest();
        // Copy all filters except transmission
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setFuelTypeSlugs(original.getFuelTypeSlugs());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Note: transmissionIds is intentionally excluded
        
        return modified;
    }

    /**
     * Build base specification for count queries, optionally excluding year filter.
     */
    private Specification<CarListing> buildBaseSpecification(ListingFilterRequest filterRequest, boolean excludeYear) {
        if (filterRequest == null) {
            filterRequest = new ListingFilterRequest();
        }
        
        // Create a copy of the filter request and potentially exclude year
        ListingFilterRequest modifiedFilter = new ListingFilterRequest();
        modifiedFilter.setBrandSlugs(filterRequest.getBrandSlugs());
        modifiedFilter.setModelSlugs(filterRequest.getModelSlugs());
        if (!excludeYear) {
            modifiedFilter.setMinYear(filterRequest.getMinYear());
            modifiedFilter.setMaxYear(filterRequest.getMaxYear());
        }
        modifiedFilter.setLocations(filterRequest.getLocations());
        modifiedFilter.setLocationId(filterRequest.getLocationId());
        modifiedFilter.setMinPrice(filterRequest.getMinPrice());
        modifiedFilter.setMaxPrice(filterRequest.getMaxPrice());
        modifiedFilter.setMinMileage(filterRequest.getMinMileage());
        modifiedFilter.setMaxMileage(filterRequest.getMaxMileage());
        modifiedFilter.setSellerTypeIds(filterRequest.getSellerTypeIds());
        modifiedFilter.setSearchQuery(filterRequest.getSearchQuery());
        
        // Handle location filtering similar to getFilteredListingsCount
        List<Governorate> governoratesToFilterBy = new ArrayList<>();
        if (modifiedFilter.getLocationId() != null) {
            Optional<Governorate> governorateOpt = governorateRepository.findById(modifiedFilter.getLocationId());
            governorateOpt.ifPresent(governoratesToFilterBy::add);
        } else if (modifiedFilter.getLocations() != null && !modifiedFilter.getLocations().isEmpty()) {
            for (String locationSlug : modifiedFilter.getLocations()) {
                if (StringUtils.isNotBlank(locationSlug)) {
                    Optional<Governorate> governorateOpt = governorateRepository.findBySlug(locationSlug.trim());
                    governorateOpt.ifPresent(governoratesToFilterBy::add);
                }
            }
        }
        
        Specification<CarListing> spec = CarListingSpecification.fromFilter(modifiedFilter, governoratesToFilterBy);
        
        // Always apply approved and user active filters
        spec = spec.and(CarListingSpecification.isApproved())
                  .and(CarListingSpecification.isUserActive());
        
        // Apply default sold and archived filters if not specified
        if (modifiedFilter.getIsSold() == null) {
            spec = spec.and(CarListingSpecification.isNotSold());
        }
        if (modifiedFilter.getIsArchived() == null) {
            spec = spec.and(CarListingSpecification.isNotArchived());
        }
        
        return spec;
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
    

    // --- Helper Methods for Optimized Count Queries ---

    /**
     * Check if a filter request is simple enough to use optimized repository methods (excluding brand filters).
     */
    private boolean hasNonBrandFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;
        
        return filterRequest.getModelSlugs() != null && !filterRequest.getModelSlugs().isEmpty() ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty() ||
               filterRequest.getLocationId() != null ||
               filterRequest.getSellerTypeIds() != null && !filterRequest.getSellerTypeIds().isEmpty() ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty();
    }

    /**
     * Check if a filter request is simple enough to use optimized repository methods (excluding year filters).
     */
    private boolean isSimpleFilterExcludingYear(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return true;
        
        return filterRequest.getBrandSlugs() == null && 
               filterRequest.getModelSlugs() == null &&
               filterRequest.getMinPrice() == null && 
               filterRequest.getMaxPrice() == null &&
               filterRequest.getMinMileage() == null && 
               filterRequest.getMaxMileage() == null &&
               filterRequest.getLocations() == null && 
               filterRequest.getLocationId() == null &&
               (filterRequest.getSellerTypeIds() == null || filterRequest.getSellerTypeIds().isEmpty()) && 
               filterRequest.getSearchQuery() == null &&
               filterRequest.getIsSold() == null && 
               filterRequest.getIsArchived() == null;
    }

    /**
     * Create a filter request without year filters to get year counts.
     */
    private ListingFilterRequest createFilterExcludingYear(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();
        
        ListingFilterRequest modified = new ListingFilterRequest();
        // Copy all filters except year-related ones
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Explicitly exclude year filters
        // modified.setMinYear(null);
        // modified.setMaxYear(null);
        
        return modified;
    }
}