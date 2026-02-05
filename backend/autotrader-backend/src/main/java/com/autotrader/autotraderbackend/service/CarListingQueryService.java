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
     * Get the base specification for approved, active listings.
     * This is the common specification used across multiple query methods.
     *
     * @return Specification for approved, not sold, not archived, and user active listings
     */
    private Specification<CarListing> getBaseApprovedListingsSpec() {
        // Use direct specification chaining instead of deprecated Specification.where()
        return CarListingSpecification.isApproved()
                           .and(CarListingSpecification.isNotSold())
                           .and(CarListingSpecification.isNotArchived())
                           .and(CarListingSpecification.isUserActive());
    }

    /**
     * Get all approved listings with pagination.
     * By default, this excludes listings that are sold or archived.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getAllApprovedListings(Pageable pageable) {
        log.debug("Fetching approved, not sold, and not archived listings page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        Specification<CarListing> spec = getBaseApprovedListingsSpec();
        Page<CarListing> listingPage = carListingRepository.findAll(spec, pageable);

        log.info("Found {} approved, not sold, not archived listings on page {}",
                listingPage.getNumberOfElements(), pageable.getPageNumber());

        return listingPage.map(carListingMapper::toCarListingResponse);
    }

    /**
     * Get the count of all approved listings.
     * By default, this excludes listings that are sold or archived.
     */
    @Transactional(readOnly = true)
    public long getApprovedListingsCount() {
        log.debug("Counting approved, not sold, and not archived listings");

        Specification<CarListing> spec = getBaseApprovedListingsSpec();
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

        // Validate sort fields first
        validateSortFields(pageable);

        // Handle location filtering separately for listings operations
        LocationFilterResult locationResult = processLocationFilters(filterRequest);

        // If location filters were specified but no valid governorates found, return empty page
        if (locationResult.wasAttempted && locationResult.governorates.isEmpty()) {
            log.info("Location filter ({}) resulted in no valid governorates. Returning empty page.",
                    locationResult.filterType);
            Page<CarListing> emptyPage = new PageImpl<>(Collections.<CarListing>emptyList(), pageable, 0);
            return emptyPage.map(carListingMapper::toCarListingResponse);
        }

        // Build the complete specification
        Specification<CarListing> spec = buildFilteredListingsSpec(filterRequest, locationResult);

        // Execute query and return mapped results
        Page<CarListing> listingPage = carListingRepository.findAll(spec, pageable);
        log.info("Found {} filtered listings matching criteria on page {}",
                 listingPage.getNumberOfElements(), pageable.getPageNumber());

        return listingPage.map(carListingMapper::toCarListingResponse);
    }

    /**
     * Build the complete specification for filtered listings including location filtering.
     */
    private Specification<CarListing> buildFilteredListingsSpec(ListingFilterRequest filterRequest, LocationFilterResult locationResult) {
        // Build base specification from filter request
        Specification<CarListing> spec = CarListingSpecification.fromFilter(
                filterRequest != null ? filterRequest : new ListingFilterRequest(),
                locationResult.governorates);

        // Add mandatory filters
        spec = spec.and(CarListingSpecification.isApproved())
                  .and(CarListingSpecification.isUserActive());

        // Apply default filters for unspecified boolean fields
        spec = applyDefaultBooleanFilters(spec, filterRequest);

        // Log location filter application
        if (!locationResult.governorates.isEmpty()) {
            log.info("Applying governorate filter for {} locations.", locationResult.governorates.size());
        }

        return spec;
    }

    /**
     * Apply default boolean filters when not specified in the request.
     */
    private Specification<CarListing> applyDefaultBooleanFilters(Specification<CarListing> spec,
                                                               ListingFilterRequest filterRequest) {
        // Default to NOT sold if not specified
        if (filterRequest == null || filterRequest.getIsSold() == null) {
            spec = spec.and(CarListingSpecification.isNotSold());
            log.debug("Defaulting filter to isSold=false as it was not specified.");
        }

        // Default to NOT archived if not specified
        if (filterRequest == null || filterRequest.getIsArchived() == null) {
            spec = spec.and(CarListingSpecification.isNotArchived());
            log.debug("Defaulting filter to isArchived=false as it was not specified.");
        }

        return spec;
    }

    /**
     * Process location filters and return the result.
     */
    private LocationFilterResult processLocationFilters(ListingFilterRequest filterRequest) {
        List<Governorate> governorates = new ArrayList<>();
        boolean locationFilterAttempted = false;
        String locationFilterType = "none";

        if (filterRequest != null && filterRequest.getLocationId() != null) {
            locationFilterAttempted = true;
            locationFilterType = "ID: " + filterRequest.getLocationId();

            Optional<Governorate> governorateOpt = governorateRepository.findById(filterRequest.getLocationId());
            if (governorateOpt.isPresent()) {
                governorates.add(governorateOpt.get());
                log.info("Governorate found by ID: {}. Applying filter.", filterRequest.getLocationId());
            } else {
                log.warn("Governorate ID {} provided in filter but not found.", filterRequest.getLocationId());
            }
        } else if (filterRequest != null && filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) {
            locationFilterAttempted = true;
            locationFilterType = "slugs: " + filterRequest.getLocations();

            for (String locationSlug : filterRequest.getLocations()) {
                if (StringUtils.isNotBlank(locationSlug)) {
                    Optional<Governorate> governorateOpt = governorateRepository.findBySlug(locationSlug.trim());
                    if (governorateOpt.isPresent()) {
                        governorates.add(governorateOpt.get());
                        log.info("Governorate found by slug: '{}'. Adding to filter.", locationSlug);
                    } else {
                        log.warn("Governorate slug '{}' provided in filter but not found.", locationSlug);
                    }
                }
            }
        }

        return new LocationFilterResult(governorates, locationFilterAttempted, locationFilterType);
    }

    /**
     * Result of processing location filters.
     */
    private static class LocationFilterResult {
        final List<Governorate> governorates;
        final boolean wasAttempted;
        final String filterType;

        LocationFilterResult(List<Governorate> governorates, boolean wasAttempted, String filterType) {
            this.governorates = governorates;
            this.wasAttempted = wasAttempted;
            this.filterType = filterType;
        }
    }

    /**
     * Check if a specification represents an impossible condition (always false).
     * This is used to detect when location filters were specified but no valid locations were found.
     */
    private boolean isImpossibleSpecification(Specification<CarListing> spec) {
        // This is a simple heuristic - in a real implementation, you might want to
        // implement a more sophisticated check or modify the specification building
        // to return a known impossible specification
        return false; // For now, assume all specifications are possible
    }

    /**
     * Get the count of filtered and approved listings based on criteria.
     * If isSold is not specified in filterRequest, defaults to false (not sold).
     * If isArchived is not specified in filterRequest, defaults to false (not archived).
     */
    @Transactional(readOnly = true)
    public long getFilteredListingsCount(ListingFilterRequest filterRequest) {
        log.debug("Counting filtered listings with filter: {}", filterRequest);

        // Handle location filtering separately for count operations
        // This ensures we return 0 immediately when location filters are invalid
        LocationFilterResult locationResult = processLocationFilters(filterRequest);

        // If location filters were specified but no valid governorates found, return 0
        if (locationResult.wasAttempted && locationResult.governorates.isEmpty()) {
            log.info("Location filter ({}) resulted in no valid governorates. Returning count of 0.",
                    locationResult.filterType);
            return 0L;
        }

        // Use the same optimized specification building logic
        Specification<CarListing> countSpec = buildFilteredListingsSpec(filterRequest, locationResult);

        long count = carListingRepository.count(countSpec);
        log.info("Found {} filtered listings matching criteria", count);

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

