package com.caryo.marketplace.service;

import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.payload.request.ListingFilterRequest;
import com.caryo.marketplace.repository.CarListingRepository;
import com.caryo.marketplace.repository.specification.CarListingSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service responsible for analytics and statistics operations on car listings.
 * Handles filter breakdowns, counts, and statistical data for UI components.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarListingAnalyticsService {

    private final CarListingRepository carListingRepository;

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
     * Get count of listings grouped by body style.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByBodyStyle(ListingFilterRequest filterRequest) {
        log.debug("Getting counts by body style with filters: {}", filterRequest);

        try {
            // Always use specification approach for body style counts
            return getBodyStyleCountsWithSpecification(filterRequest);
        } catch (Exception e) {
            log.error("Error getting body style counts", e);
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

    /**
     * Get body style counts using specification filtering.
     * Optimized to only fetch necessary fields and avoid loading full entities.
     */
    private Map<String, Long> getBodyStyleCountsWithSpecification(ListingFilterRequest filterRequest) {
        // Remove body style filter to get all body styles with their counts
        ListingFilterRequest modifiedFilter = createFilterWithoutBodyStyle(filterRequest);

        // Build the specification for filtering
        Specification<CarListing> baseSpec = buildBaseSpecification(modifiedFilter, false);

        // Fetch filtered listings
        List<CarListing> filteredListings = carListingRepository.findAll(baseSpec);

        // Group by body style slug and count
        Map<String, Long> bodyStyleCounts = filteredListings.stream()
            .filter(listing -> listing.getBodyStyle() != null &&
                             StringUtils.isNotBlank(listing.getBodyStyle().getSlug()))
            .collect(Collectors.groupingBy(
                listing -> listing.getBodyStyle().getSlug(),
                LinkedHashMap::new,
                Collectors.counting()
            ));

        log.info("Found counts for {} body styles (filtered)", bodyStyleCounts.size());
        return bodyStyleCounts;
    }

    // Helper methods for filter processing

    private boolean isSimpleFilterExcludingYear(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return true;

        return (filterRequest.getBrandSlugs() == null || filterRequest.getBrandSlugs().isEmpty()) &&
               (filterRequest.getModelSlugs() == null || filterRequest.getModelSlugs().isEmpty()) &&
               filterRequest.getMinYear() == null && filterRequest.getMaxYear() == null &&
               filterRequest.getMinPrice() == null && filterRequest.getMaxPrice() == null &&
               filterRequest.getMinMileage() == null && filterRequest.getMaxMileage() == null &&
               (filterRequest.getLocations() == null || filterRequest.getLocations().isEmpty()) &&
               filterRequest.getLocationId() == null &&
               (filterRequest.getSellerTypeIds() == null || filterRequest.getSellerTypeIds().isEmpty()) &&
               (filterRequest.getFuelTypeSlugs() == null || filterRequest.getFuelTypeSlugs().isEmpty()) &&
               (filterRequest.getTransmissionIds() == null || filterRequest.getTransmissionIds().isEmpty()) &&
               filterRequest.getIsSold() == null &&
               filterRequest.getIsArchived() == null &&
               (filterRequest.getSearchQuery() == null || filterRequest.getSearchQuery().trim().isEmpty());
    }

    private boolean hasNonBrandFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;

        return filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               (filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) ||
               filterRequest.getLocationId() != null ||
               (filterRequest.getModelSlugs() != null && !filterRequest.getModelSlugs().isEmpty()) ||
               (filterRequest.getSellerTypeIds() != null && !filterRequest.getSellerTypeIds().isEmpty()) ||
               (filterRequest.getFuelTypeSlugs() != null && !filterRequest.getFuelTypeSlugs().isEmpty()) ||
               (filterRequest.getTransmissionIds() != null && !filterRequest.getTransmissionIds().isEmpty()) ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               (filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty());
    }

    private boolean hasNonModelFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;

        return (filterRequest.getBrandSlugs() != null && !filterRequest.getBrandSlugs().isEmpty()) ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               (filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) ||
               filterRequest.getLocationId() != null ||
               (filterRequest.getSellerTypeIds() != null && !filterRequest.getSellerTypeIds().isEmpty()) ||
               (filterRequest.getFuelTypeSlugs() != null && !filterRequest.getFuelTypeSlugs().isEmpty()) ||
               (filterRequest.getTransmissionIds() != null && !filterRequest.getTransmissionIds().isEmpty()) ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               (filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty());
    }

    private boolean hasNonSellerTypeFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;

        return (filterRequest.getBrandSlugs() != null && !filterRequest.getBrandSlugs().isEmpty()) ||
               (filterRequest.getModelSlugs() != null && !filterRequest.getModelSlugs().isEmpty()) ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               (filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) ||
               filterRequest.getLocationId() != null ||
               (filterRequest.getFuelTypeSlugs() != null && !filterRequest.getFuelTypeSlugs().isEmpty()) ||
               (filterRequest.getTransmissionIds() != null && !filterRequest.getTransmissionIds().isEmpty()) ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               (filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty());
    }

    private boolean hasNonFuelTypeFilters(ListingFilterRequest filterRequest) {
        if (filterRequest == null) return false;

        return (filterRequest.getBrandSlugs() != null && !filterRequest.getBrandSlugs().isEmpty()) ||
               (filterRequest.getModelSlugs() != null && !filterRequest.getModelSlugs().isEmpty()) ||
               filterRequest.getMinYear() != null || filterRequest.getMaxYear() != null ||
               filterRequest.getMinPrice() != null || filterRequest.getMaxPrice() != null ||
               filterRequest.getMinMileage() != null || filterRequest.getMaxMileage() != null ||
               (filterRequest.getLocations() != null && !filterRequest.getLocations().isEmpty()) ||
               filterRequest.getLocationId() != null ||
               (filterRequest.getSellerTypeIds() != null && !filterRequest.getSellerTypeIds().isEmpty()) ||
               (filterRequest.getTransmissionIds() != null && !filterRequest.getTransmissionIds().isEmpty()) ||
               filterRequest.getIsSold() != null ||
               filterRequest.getIsArchived() != null ||
               (filterRequest.getSearchQuery() != null && !filterRequest.getSearchQuery().trim().isEmpty());
    }


    private ListingFilterRequest createFilterExcludingYear(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();

        ListingFilterRequest modified = new ListingFilterRequest();
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        // Must travel with the price bounds — they are meaningless unscoped
        modified.setCurrency(original.getCurrency());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setFuelTypeSlugs(original.getFuelTypeSlugs());
        modified.setTransmissionIds(original.getTransmissionIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Note: minYear and maxYear are intentionally excluded

        return modified;
    }

    private ListingFilterRequest createFilterWithoutBrands(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();

        ListingFilterRequest modified = new ListingFilterRequest();
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        // Must travel with the price bounds — they are meaningless unscoped
        modified.setCurrency(original.getCurrency());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setFuelTypeSlugs(original.getFuelTypeSlugs());
        modified.setTransmissionIds(original.getTransmissionIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());

        return modified;
    }

    private ListingFilterRequest createFilterWithoutModels(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();

        ListingFilterRequest modified = new ListingFilterRequest();
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        // Must travel with the price bounds — they are meaningless unscoped
        modified.setCurrency(original.getCurrency());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setFuelTypeSlugs(original.getFuelTypeSlugs());
        modified.setTransmissionIds(original.getTransmissionIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());

        return modified;
    }

    private ListingFilterRequest createFilterWithoutSellerType(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();

        ListingFilterRequest modified = new ListingFilterRequest();
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        // Must travel with the price bounds — they are meaningless unscoped
        modified.setCurrency(original.getCurrency());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setFuelTypeSlugs(original.getFuelTypeSlugs());
        modified.setTransmissionIds(original.getTransmissionIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Note: sellerTypeId is intentionally excluded

        return modified;
    }

    private ListingFilterRequest createFilterWithoutFuelType(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();

        ListingFilterRequest modified = new ListingFilterRequest();
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        // Must travel with the price bounds — they are meaningless unscoped
        modified.setCurrency(original.getCurrency());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setTransmissionIds(original.getTransmissionIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Note: fuelTypeId is intentionally excluded

        return modified;
    }

    private ListingFilterRequest createFilterWithoutTransmission(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();

        ListingFilterRequest modified = new ListingFilterRequest();
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        // Must travel with the price bounds — they are meaningless unscoped
        modified.setCurrency(original.getCurrency());
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

    private ListingFilterRequest createFilterWithoutBodyStyle(ListingFilterRequest original) {
        if (original == null) return new ListingFilterRequest();

        ListingFilterRequest modified = new ListingFilterRequest();
        modified.setBrandSlugs(original.getBrandSlugs());
        modified.setModelSlugs(original.getModelSlugs());
        modified.setMinYear(original.getMinYear());
        modified.setMaxYear(original.getMaxYear());
        modified.setLocations(original.getLocations());
        modified.setLocationId(original.getLocationId());
        modified.setMinPrice(original.getMinPrice());
        modified.setMaxPrice(original.getMaxPrice());
        // Must travel with the price bounds — they are meaningless unscoped
        modified.setCurrency(original.getCurrency());
        modified.setMinMileage(original.getMinMileage());
        modified.setMaxMileage(original.getMaxMileage());
        modified.setSellerTypeIds(original.getSellerTypeIds());
        modified.setFuelTypeSlugs(original.getFuelTypeSlugs());
        modified.setTransmissionIds(original.getTransmissionIds());
        modified.setSearchQuery(original.getSearchQuery());
        modified.setIsSold(original.getIsSold());
        modified.setIsArchived(original.getIsArchived());
        // Note: bodyStyleSlugs is intentionally excluded

        return modified;
    }

    /**
     * Build base specification for filtering listings using the comprehensive filtering logic
     * from CarListingSpecification. This ensures consistency with the main query service.
     */
    private Specification<CarListing> buildBaseSpecification(ListingFilterRequest filterRequest, boolean includeDefaults) {
        // Use the comprehensive filtering logic from CarListingSpecification
        Specification<CarListing> spec = CarListingSpecification.fromFilter(
                filterRequest != null ? filterRequest : new ListingFilterRequest(),
                Collections.emptyList()); // No location filtering for analytics

        // Always include approved status for analytics
        spec = spec.and(CarListingSpecification.isApproved());

        if (includeDefaults) {
            spec = spec.and(CarListingSpecification.isNotSold())
                      .and(CarListingSpecification.isNotArchived())
                      .and(CarListingSpecification.isUserActive());
        }

        return spec;
    }
}
