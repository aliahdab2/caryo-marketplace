package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.Governorate; // Added
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.Location;
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

    /**
     * Create a new car listing.
     */
    @Transactional
    public CarListingResponse createListing(CreateListingRequest request, MultipartFile image, String username) {
        Objects.requireNonNull(request, "CreateListingRequest cannot be null");
        if (StringUtils.isBlank(username)) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        log.info("Attempting to create new listing for user: {}", username);
        User user = findUserByUsername(username);

        CarListing carListing = buildCarListingFromRequest(request, user);
        // isSold and isArchived are set within buildCarListingFromRequest

        CarListing savedListing = carListingRepository.save(carListing);

        // Handle image upload if provided
        if (Objects.nonNull(image) && !image.isEmpty()) { // Changed from image != null
            try {
                String originalFilename = image.getOriginalFilename();
                if (StringUtils.isBlank(originalFilename)) {
                    log.warn("Image for listing ID {} has a blank original filename. Skipping image processing.", savedListing.getId());
                } else {
                    String imageKey = generateImageKey(savedListing.getId(), originalFilename);
                    storageService.store(image, imageKey);
                    
                    // Create and add ListingMedia for this image
                    ListingMedia media = new ListingMedia();
                    media.setCarListing(savedListing);
                    media.setFileKey(imageKey);
                    media.setFileName(originalFilename);
                    media.setContentType(image.getContentType());
                    media.setSize(image.getSize());
                    media.setSortOrder(0);
                    media.setIsPrimary(true);
                    media.setMediaType("image");
                    savedListing.addMedia(media);
                    
                    savedListing = carListingRepository.save(savedListing); // Save again to update with media
                    log.info("Successfully uploaded image for new listing ID: {}", savedListing.getId());
                }
            } catch (StorageException e) {
                // If image upload/update fails, log it but proceed with listing creation response
                log.error("Failed to upload image or update listing with image key for listing ID {}: {}. Error: {}", savedListing.getId(), e.getMessage(), e.getCause() != null ? e.getCause().getMessage() : "N/A", e);
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
        Objects.requireNonNull(listingId, "Listing ID cannot be null");
        Objects.requireNonNull(file, "File cannot be null");
        if (StringUtils.isBlank(username)) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        log.info("Attempting to upload image for listing ID: {} by user: {}", listingId, username);
        User user = findUserByUsername(username);

        validateFile(file, listingId);

        CarListing listing = findListingById(listingId);

        authorizeListingModification(listing, user, "upload image for");

        String imageKey = generateImageKey(listingId, file.getOriginalFilename());

        try {
            storageService.store(file, imageKey);
            
            // Create a new ListingMedia entity and link it to the car listing
            ListingMedia media = new ListingMedia();
            media.setCarListing(listing);
            media.setFileKey(imageKey);
            media.setFileName(file.getOriginalFilename());
            media.setContentType(file.getContentType());
            media.setSize(file.getSize());
            media.setSortOrder(0); // TODO: Determine sort order logic if multiple images
            media.setIsPrimary(listing.getMedia().isEmpty()); // First image is primary
            media.setMediaType("image"); // Assuming all uploads here are images
            
            // Add the media to the listing using helper method
            listing.addMedia(media);
            
            carListingRepository.save(listing); // Save the updated listing
            log.info("Successfully uploaded image with key '{}' and updated listing ID: {}", imageKey, listingId);
            return imageKey;
        } catch (StorageException e) {
            log.error("Storage service failed to store image for listing ID {}: {}. Error: {}", listingId, e.getMessage(), e.getCause() != null ? e.getCause().getMessage() : "N/A", e);
            // Re-throw the original StorageException to be handled by the controller or a global exception handler.
            // This preserves the specific details of the storage failure.
            throw e; 
        } catch (Exception e) {
            log.error("Unexpected error saving listing {} after image upload: {}", listingId, e.getMessage(), e);
            // Wrap other exceptions in a RuntimeException if they are not already.
            // Consider a more specific custom exception if appropriate for your error handling strategy.
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
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

    private boolean hasNonModelFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;
        
        return filterRequest.getBrandSlugs() != null && !filterRequest.getBrandSlugs().isEmpty() ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty() ||
               filterRequest.getLocationId() != null ||
               filterRequest.getSellerTypeId() != null ||
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
        modified.setSellerTypeId(original.getSellerTypeId());
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
        modified.setSellerTypeId(original.getSellerTypeId());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        
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
        modifiedFilter.setSellerTypeId(filterRequest.getSellerTypeId());
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
        log.debug("Fetching all listings for user: {}", username);
        User user = findUserByUsername(username);
        List<CarListing> listings = carListingRepository.findBySeller(user);
        log.info("Found {} listings for user: {}", listings.size(), username);
        return listings.stream()
                .map(carListingMapper::toCarListingResponse)
                .collect(Collectors.toList());
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
        if (request.getModelId() != null) {
            // Get the model from the repository
            CarModel carModel = carModelService.getModelById(request.getModelId());
            existingListing.setModel(carModel); // Set the CarModel entity
            
            // Update denormalized fields from the CarModel and CarBrand entities
            existingListing.setBrandNameEn(carModel.getBrand().getDisplayNameEn());
            existingListing.setBrandNameAr(carModel.getBrand().getDisplayNameAr());
            existingListing.setModelNameEn(carModel.getDisplayNameEn());
            existingListing.setModelNameAr(carModel.getDisplayNameAr());
        }
        if (request.getModelYear() != null) {
            existingListing.setModelYear(request.getModelYear());
        }
        if (request.getPrice() != null) {
            existingListing.setPrice(request.getPrice());
        }
        if (request.getCurrency() != null) {
            existingListing.setCurrency(request.getCurrency());
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
            existingListing.setLocation(location);

            Governorate governorate = location.getGovernorate();
            if (governorate != null) {
                existingListing.setGovernorate(governorate);
                existingListing.setGovernorateNameEn(governorate.getDisplayNameEn());
                existingListing.setGovernorateNameAr(governorate.getDisplayNameAr());
                // Country information is now derived via governorate.getCountry()
            } else {
                log.error("Location {} has no associated governorate during update.", location.getId());
                 throw new IllegalStateException("Location must have an associated governorate for listing update.");
            }
        }
        
        if (request.getDescription() != null) {
            existingListing.setDescription(request.getDescription());
        }
        if (request.getTransmission() != null) {
            existingListing.setTransmission(request.getTransmission());
        }

        // Update isSold and isArchived if provided in the request
        if (request.getIsSold() != null) {
            existingListing.setSold(request.getIsSold());
        }
        if (request.getIsArchived() != null) {
            existingListing.setArchived(request.getIsArchived());
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
        
        // If listing has media, delete all media files from storage
        if (existingListing.getMedia() != null && !existingListing.getMedia().isEmpty()) {
            for (ListingMedia media : existingListing.getMedia()) {
                try {
                    storageService.delete(media.getFileKey());
                    log.info("Deleted media with key: {} for listing ID: {}", media.getFileKey(), id);
                } catch (StorageException e) {
                    // Log but continue with listing deletion
                    log.error("Failed to delete media with key: {} for listing ID: {}", media.getFileKey(), id, e);
                }
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
        
        // If listing has media, delete all media files from storage
        if (existingListing.getMedia() != null && !existingListing.getMedia().isEmpty()) {
            for (ListingMedia media : existingListing.getMedia()) {
                try {
                    storageService.delete(media.getFileKey());
                    log.info("Admin deleted media with key: {} for listing ID: {}", media.getFileKey(), id);
                } catch (StorageException e) {
                    // Log but continue with listing deletion
                    log.error("Admin failed to delete media with key: {} for listing ID: {}", media.getFileKey(), id, e);
                }
            }
        }
        
        // Delete the listing
        carListingRepository.delete(existingListing);
        log.info("Admin successfully deleted listing with ID: {}", id);
    }

    /**
     * Admin-only method to approve any car listing.
     * @param id the ID of the listing to approve
     * @return the approved listing response
     * @throws ResourceNotFoundException if the listing is not found
     */
    public CarListingResponse approveListingAsAdmin(Long id) {
        log.info("Admin attempting to approve listing with ID: {}", id);
        
        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Admin approval failed - listing not found with ID: {}", id);
                    return new ResourceNotFoundException("CarListing", "id", id);
                });
        
        // Set the listing as approved
        existingListing.setApproved(true);
        
        // Save the updated listing
        CarListing approvedListing = carListingRepository.save(existingListing);
        log.info("Admin successfully approved listing with ID: {}", id);
        
        // Return the updated listing response
        return carListingMapper.toCarListingResponse(approvedListing);
    }

    /**
     * Admin-only method to get all car listings regardless of approval status.
     * @param pageable pagination information
     * @return paginated list of all car listings
     */
    public Page<CarListingResponse> getAllListingsAsAdmin(Pageable pageable) {
        log.info("Admin retrieving all listings with pagination: {}", pageable);
        
        // Get all listings regardless of approval status
        Page<CarListing> listings = carListingRepository.findAll(pageable);
        
        log.info("Found {} total listings for admin", listings.getTotalElements());
        
        // Convert to response DTOs
        return listings.map(carListingMapper::toCarListingResponse);
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
        return storageKeyGenerator.generateListingMediaKey(listingId, originalFilename);
    }

    private CarListing buildCarListingFromRequest(CreateListingRequest request, User user) {
        CarListing carListing = new CarListing();
        carListing.setTitle(request.getTitle());
        
        // Get the model from the repository
        CarModel carModel = carModelService.getModelById(request.getModelId());
        carListing.setModel(carModel); // Set the CarModel entity
        
        carListing.setModelYear(request.getModelYear());
        carListing.setPrice(request.getPrice());
        carListing.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
        carListing.setMileage(request.getMileage());
        carListing.setDescription(request.getDescription());
        
        // Set denormalized fields from the CarModel and CarBrand entities
        carListing.setBrandNameEn(carModel.getBrand().getDisplayNameEn());
        carListing.setBrandNameAr(carModel.getBrand().getDisplayNameAr());
        carListing.setModelNameEn(carModel.getDisplayNameEn());
        carListing.setModelNameAr(carModel.getDisplayNameAr());
        
        // Handle location and governorate
        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> {
                    log.warn("Location lookup failed for ID: {}", request.getLocationId());
                    return new ResourceNotFoundException("Location", "id", request.getLocationId());
                });
            carListing.setLocation(location);
            
            Governorate governorate = location.getGovernorate();
            if (governorate != null) {
                carListing.setGovernorate(governorate);
                carListing.setGovernorateNameEn(governorate.getDisplayNameEn());
                carListing.setGovernorateNameAr(governorate.getDisplayNameAr());
                // Country information is now derived via governorate.getCountry()
            } else {
                log.error("Location {} has no associated governorate", location.getId());
                throw new IllegalStateException("Location must have an associated governorate");
            }
        } else {
            log.error("LocationId is required to create a car listing");
            throw new IllegalArgumentException("LocationId is required");
        }
        
        carListing.setSeller(user);
        carListing.setApproved(false); // Default to not approved
        // Set isSold and isArchived from request, defaulting to false if null
        carListing.setSold(request.getIsSold() != null ? request.getIsSold() : false);
        carListing.setArchived(request.getIsArchived() != null ? request.getIsArchived() : false);
        return carListing;
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
               filterRequest.getSellerTypeId() != null ||
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
               filterRequest.getSellerTypeId() == null && 
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
        modified.setSellerTypeId(original.getSellerTypeId());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Explicitly exclude year filters
        // modified.setMinYear(null);
        // modified.setMaxYear(null);
        
        return modified;
    }
}