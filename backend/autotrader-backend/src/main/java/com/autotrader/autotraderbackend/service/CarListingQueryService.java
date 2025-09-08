package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import com.autotrader.autotraderbackend.repository.specification.CarListingSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Service responsible for querying and filtering car listings.
 * Handles complex filtering logic, sorting validation, and location-based queries.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarListingQueryService {

    private final CarListingRepository carListingRepository;
    private final GovernorateRepository governorateRepository;
    private final CarListingMapper carListingMapper;

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
                                                     .and(CarListingSpecification.isUserActive());

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
        validateSortFields(pageable);

        Specification<CarListing> spec;
        boolean locationFilterAttempted = false;
        String locationFilterType = "none"; // For logging
        List<Governorate> governoratesToFilterBy = new ArrayList<>();

        if (filterRequest != null && filterRequest.getLocationId() != null) {
            locationFilterAttempted = true;
            locationFilterType = "ID: " + filterRequest.getLocationId();
            Optional<Governorate> governorateOpt = governorateRepository.findById(filterRequest.getLocationId());
            if (governorateOpt.isPresent()) {
                governoratesToFilterBy.add(governorateOpt.get());
                log.info("Governorate found by ID: {}. Applying filter.", filterRequest.getLocationId());
            } else {
                log.warn("Governorate ID {} provided in filter but not found. No listings will match this location criterion.", filterRequest.getLocationId());
            }
        } else if (filterRequest != null && filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) {
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
            spec = CarListingSpecification.fromFilter(filterRequest != null ? filterRequest : new ListingFilterRequest(), governoratesToFilterBy);
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
        if (filterRequest == null || filterRequest.getIsSold() == null) {
            spec = spec.and(CarListingSpecification.isNotSold());
            log.debug("Defaulting filter to isSold=false as it was not specified.");
        }
        // If isSold IS specified, the CarListingSpecification.fromFilter will have already added it.

        if (filterRequest == null || filterRequest.getIsArchived() == null) {
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

        if (filterRequest != null && filterRequest.getLocationId() != null) {
            locationFilterAttempted = true;
            locationFilterType = "ID: " + filterRequest.getLocationId();
            Optional<Governorate> governorateOpt = governorateRepository.findById(filterRequest.getLocationId());
            if (governorateOpt.isPresent()) {
                governoratesToFilterBy.add(governorateOpt.get());
                log.info("Governorate found by ID: {}. Applying filter.", filterRequest.getLocationId());
            } else {
                log.warn("Governorate ID {} provided in filter but not found. No listings will match this location criterion.", filterRequest.getLocationId());
            }
        } else if (filterRequest != null && filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) {
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
            spec = CarListingSpecification.fromFilter(filterRequest != null ? filterRequest : new ListingFilterRequest(), governoratesToFilterBy);
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
        if (filterRequest == null || filterRequest.getIsSold() == null) {
            spec = spec.and(CarListingSpecification.isNotSold());
            log.debug("Defaulting filter to isSold=false as it was not specified.");
        }

        if (filterRequest == null || filterRequest.getIsArchived() == null) {
            spec = spec.and(CarListingSpecification.isNotArchived());
            log.debug("Defaulting filter to isArchived=false as it was not specified.");
        }

        long count = carListingRepository.count(spec);
        log.info("Found {} filtered listings matching criteria (Location filter used: {})",
                 count, locationFilterType);
        return count;
    }

    /**
     * Validate sort fields to ensure only allowed fields are used for sorting.
     */
    private void validateSortFields(Pageable pageable) {
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
    }
}
