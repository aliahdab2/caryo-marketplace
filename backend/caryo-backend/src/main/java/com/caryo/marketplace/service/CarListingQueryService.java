package com.caryo.marketplace.service;

import com.caryo.marketplace.mapper.CarListingMapper;
import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.Governorate;
import com.caryo.marketplace.payload.request.ListingFilterRequest;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.repository.CarListingRepository;
import com.caryo.marketplace.repository.GovernorateRepository;
import com.caryo.marketplace.repository.specification.CarListingSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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

    @Value("${app.search.fulltext.enabled:false}")
    private boolean fullTextSearchEnabled;

    @Value("${app.search.fulltext.max-results:1000}")
    private int fullTextSearchMaxResults;

    /** Maximum IDs per IN clause chunk to avoid query planner degradation */
    private static final int IN_CLAUSE_BATCH_SIZE = 1000;

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

        // Full-text search pre-filtering (PostgreSQL only, skipped on H2)
        FullTextSearchResult ftsResult = applyFullTextSearch(filterRequest);
        if (ftsResult.wasApplied && ftsResult.matchIds.isEmpty()) {
            log.info("Full-text search returned no matches. Returning empty page.");
            return Page.<CarListing>empty(pageable).map(carListingMapper::toCarListingResponse);
        }

        // Build specification using the FTS-adjusted filter (searchQuery cleared when FTS is used)
        Specification<CarListing> spec = buildFilteredListingsSpec(ftsResult.adjustedFilter, locationResult);

        // Restrict to FTS matches using batched IN clauses
        if (ftsResult.wasApplied) {
            spec = spec.and(buildBatchedIdSpec(ftsResult.matchIds));
        }

        // Execute query and return mapped results
        Page<CarListing> listingPage = carListingRepository.findAll(spec, pageable);
        log.info("Found {} filtered listings matching criteria on page {}{}",
                 listingPage.getNumberOfElements(), pageable.getPageNumber(),
                 ftsResult.wasApplied ? " (FTS-filtered)" : "");

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

        // Full-text search pre-filtering (PostgreSQL only, skipped on H2)
        FullTextSearchResult ftsResult = applyFullTextSearch(filterRequest);
        if (ftsResult.wasApplied && ftsResult.matchIds.isEmpty()) {
            log.info("Full-text search returned no matches. Returning count of 0.");
            return 0L;
        }

        // Use the same optimized specification building logic
        Specification<CarListing> countSpec = buildFilteredListingsSpec(ftsResult.adjustedFilter, locationResult);

        // Restrict to FTS matches using batched IN clauses
        if (ftsResult.wasApplied) {
            countSpec = countSpec.and(buildBatchedIdSpec(ftsResult.matchIds));
        }

        long count = carListingRepository.count(countSpec);
        log.info("Found {} filtered listings matching criteria{}", count,
                 ftsResult.wasApplied ? " (FTS-filtered)" : "");

        return count;
    }

    /**
     * Result of full-text search pre-filtering.
     */
    private static class FullTextSearchResult {
        final Set<Long> matchIds;
        final boolean wasApplied;
        final ListingFilterRequest adjustedFilter;

        /** FTS was not applicable — pass through the original filter unchanged. */
        static FullTextSearchResult notApplied(ListingFilterRequest original) {
            return new FullTextSearchResult(Collections.emptySet(), false, original);
        }

        /** FTS was applied — provides match IDs and a filter copy with searchQuery cleared. */
        static FullTextSearchResult applied(Set<Long> ids, ListingFilterRequest adjusted) {
            return new FullTextSearchResult(ids, true, adjusted);
        }

        private FullTextSearchResult(Set<Long> matchIds, boolean wasApplied, ListingFilterRequest adjustedFilter) {
            this.matchIds = matchIds;
            this.wasApplied = wasApplied;
            this.adjustedFilter = adjustedFilter;
        }
    }

    /**
     * Apply full-text search pre-filtering if enabled and searchQuery is present.
     * Returns a result containing match IDs and a filter copy with searchQuery cleared
     * (so the LIKE-based search in CarListingSpecification is skipped).
     * Does NOT mutate the original filterRequest.
     */
    private FullTextSearchResult applyFullTextSearch(ListingFilterRequest filterRequest) {
        if (!fullTextSearchEnabled
                || filterRequest == null
                || filterRequest.getSearchQuery() == null
                || filterRequest.getSearchQuery().trim().isEmpty()) {
            return FullTextSearchResult.notApplied(filterRequest);
        }

        String query = filterRequest.getSearchQuery().trim();
        List<Long> ids = carListingRepository.findIdsByFullTextSearch(query, fullTextSearchMaxResults);
        log.info("Full-text search for '{}' matched {} listings", query, ids.size());

        // Create a copy with searchQuery cleared so LIKE-based search is skipped.
        // The original filterRequest is NOT mutated.
        ListingFilterRequest adjusted = copyFilterWithoutSearchQuery(filterRequest);

        return FullTextSearchResult.applied(new HashSet<>(ids), adjusted);
    }

    /**
     * Create a shallow copy of the filter with searchQuery set to null.
     */
    private ListingFilterRequest copyFilterWithoutSearchQuery(ListingFilterRequest original) {
        ListingFilterRequest copy = new ListingFilterRequest();
        copy.setBrandSlugs(original.getBrandSlugs());
        copy.setModelSlugs(original.getModelSlugs());
        copy.setMinYear(original.getMinYear());
        copy.setMaxYear(original.getMaxYear());
        copy.setLocations(original.getLocations());
        copy.setLocationId(original.getLocationId());
        copy.setMinPrice(original.getMinPrice());
        copy.setMaxPrice(original.getMaxPrice());
        // Must travel with the price bounds — they are meaningless unscoped
        copy.setCurrency(original.getCurrency());
        copy.setMinMileage(original.getMinMileage());
        copy.setMaxMileage(original.getMaxMileage());
        copy.setIsSold(original.getIsSold());
        copy.setIsArchived(original.getIsArchived());
        copy.setSellerTypeIds(original.getSellerTypeIds());
        copy.setTransmissionIds(original.getTransmissionIds());
        copy.setFuelTypeSlugs(original.getFuelTypeSlugs());
        copy.setBodyStyleIds(original.getBodyStyleIds());
        copy.setBodyStyleSlugs(original.getBodyStyleSlugs());
        // searchQuery intentionally NOT copied — FTS replaces LIKE-based search
        return copy;
    }

    /**
     * Build a Specification that restricts results to the given IDs,
     * batching into chunks of IN_CLAUSE_BATCH_SIZE to avoid query planner degradation.
     */
    private Specification<CarListing> buildBatchedIdSpec(Set<Long> ids) {
        if (ids.size() <= IN_CLAUSE_BATCH_SIZE) {
            // Small enough for a single IN clause
            return (root, query, cb) -> root.get("id").in(ids);
        }

        // Split into chunks and OR them together
        List<List<Long>> chunks = new ArrayList<>(ids).stream()
                .collect(Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> {
                            List<List<Long>> result = new ArrayList<>();
                            for (int i = 0; i < list.size(); i += IN_CLAUSE_BATCH_SIZE) {
                                result.add(list.subList(i, Math.min(i + IN_CLAUSE_BATCH_SIZE, list.size())));
                            }
                            return result;
                        }
                ));

        return (root, query, cb) -> {
            var predicates = chunks.stream()
                    .map(chunk -> root.get("id").in(chunk))
                    .toArray(jakarta.persistence.criteria.Predicate[]::new);
            return cb.or(predicates);
        };
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

