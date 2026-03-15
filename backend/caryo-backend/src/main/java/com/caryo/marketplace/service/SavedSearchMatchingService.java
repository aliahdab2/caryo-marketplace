package com.caryo.marketplace.service;

import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.SavedSearch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Service for matching car listings against saved search criteria
 */
@Service
@Slf4j
public class SavedSearchMatchingService {

    /**
     * Check if a car listing matches the criteria of a saved search
     * @param savedSearch The saved search with filter criteria
     * @param listing The car listing to check
     * @return true if the listing matches the search criteria
     */
    public boolean matches(SavedSearch savedSearch, CarListing listing) {
        if (savedSearch == null || listing == null || savedSearch.getFilters() == null) {
            return false;
        }

        Map<String, Object> filters = savedSearch.getFilters();

        try {
            // Brand filter
            if (!matchesBrands(filters, listing)) {
                return false;
            }

            // Model filter
            if (!matchesModels(filters, listing)) {
                return false;
            }

            // Price range filter
            if (!matchesPriceRange(filters, listing)) {
                return false;
            }

            // Year range filter
            if (!matchesYearRange(filters, listing)) {
                return false;
            }

            // Mileage range filter
            if (!matchesMileageRange(filters, listing)) {
                return false;
            }

            // Location/Governorate filter
            if (!matchesLocation(filters, listing)) {
                return false;
            }

            // Body type filter
            if (!matchesBodyTypes(filters, listing)) {
                return false;
            }

            // Fuel type filter
            if (!matchesFuelTypes(filters, listing)) {
                return false;
            }

            // Transmission filter
            if (!matchesTransmission(filters, listing)) {
                return false;
            }

            // Condition filter
            if (!matchesCondition(filters, listing)) {
                return false;
            }

            log.debug("Listing {} matches saved search {}", listing.getId(), savedSearch.getId());
            return true;

        } catch (Exception e) {
            log.error("Error matching listing {} against saved search {}: {}",
                     listing.getId(), savedSearch.getId(), e.getMessage(), e);
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    private boolean matchesBrands(Map<String, Object> filters, CarListing listing) {
        Object brands = filters.get("brandSlugs"); // Updated to match saved search field name
        if (brands == null) {
            return true; // No brand filter
        }

        if (brands instanceof List<?> brandList && !brandList.isEmpty()) {
            if (listing.getModel() == null || listing.getModel().getBrand() == null) {
                return false;
            }

            String listingBrandSlug = listing.getModel().getBrand().getSlug();
            return brandList.contains(listingBrandSlug);
        }

        return true;
    }

    @SuppressWarnings("unchecked")
    private boolean matchesModels(Map<String, Object> filters, CarListing listing) {
        Object models = filters.get("modelSlugs"); // Updated to match saved search field name
        if (models == null) {
            return true; // No model filter
        }

        if (models instanceof List<?> modelList && !modelList.isEmpty()) {
            if (listing.getModel() == null) {
                return false;
            }

            String listingModelSlug = listing.getModel().getSlug();
            return modelList.contains(listingModelSlug);
        }

        return true;
    }

    private boolean matchesPriceRange(Map<String, Object> filters, CarListing listing) {
        Object minPrice = filters.get("minPrice");
        Object maxPrice = filters.get("maxPrice");

        if (minPrice != null) {
            Number minPriceNum = (Number) minPrice;
            if (listing.getPrice().compareTo(BigDecimal.valueOf(minPriceNum.doubleValue())) < 0) {
                return false;
            }
        }

        if (maxPrice != null) {
            Number maxPriceNum = (Number) maxPrice;
            if (listing.getPrice().compareTo(BigDecimal.valueOf(maxPriceNum.doubleValue())) > 0) {
                return false;
            }
        }

        return true;
    }

    private boolean matchesYearRange(Map<String, Object> filters, CarListing listing) {
        Object minYear = filters.get("minYear");
        Object maxYear = filters.get("maxYear");

        if (minYear != null) {
            Number minYearNum = (Number) minYear;
            if (listing.getModelYear() < minYearNum.intValue()) {
                return false;
            }
        }

        if (maxYear != null) {
            Number maxYearNum = (Number) maxYear;
            if (listing.getModelYear() > maxYearNum.intValue()) {
                return false;
            }
        }

        return true;
    }

    private boolean matchesMileageRange(Map<String, Object> filters, CarListing listing) {
        Object minMileage = filters.get("minMileage");
        Object maxMileage = filters.get("maxMileage");

        if (minMileage != null) {
            Number minMileageNum = (Number) minMileage;
            if (listing.getMileage() < minMileageNum.intValue()) {
                return false;
            }
        }

        if (maxMileage != null) {
            Number maxMileageNum = (Number) maxMileage;
            if (listing.getMileage() > maxMileageNum.intValue()) {
                return false;
            }
        }

        return true;
    }

    @SuppressWarnings("unchecked")
    private boolean matchesLocation(Map<String, Object> filters, CarListing listing) {
        Object locations = filters.get("governorateIds"); // Updated from "governorateIds" to "locations"
        if (locations == null) {
            return true; // No location filter
        }

        if (locations instanceof List<?> locationList && !locationList.isEmpty()) {
            if (listing.getGovernorate() == null) {
                return false;
            }

            // The frontend sends location names, so we need to match against governorate names
            String listingGovernorateName = listing.getGovernorate().getDisplayNameEn();
            String listingGovernorateNameAr = listing.getGovernorate().getDisplayNameAr();

            return locationList.contains(listingGovernorateName) ||
                   locationList.contains(listingGovernorateNameAr);
        }

        return true;
    }

    @SuppressWarnings("unchecked")
    private boolean matchesBodyTypes(Map<String, Object> filters, CarListing listing) {
        Object bodyType = filters.get("bodyType"); // Updated from "bodyTypes" to "bodyType"
        if (bodyType == null) {
            return true; // No body type filter
        }

        if (bodyType instanceof List<?> bodyTypeList && !bodyTypeList.isEmpty()) {
            if (listing.getBodyStyle() == null) {
                return false;
            }

            String listingBodyType = listing.getBodyStyle().getSlug(); // Use slug for matching
            return bodyTypeList.contains(listingBodyType);
        }

        return true;
    }

    @SuppressWarnings("unchecked")
    private boolean matchesFuelTypes(Map<String, Object> filters, CarListing listing) {
        Object fuelTypeSlugs = filters.get("fuelTypeSlugs"); // Updated from "fuelTypes" to "fuelTypeSlugs"
        if (fuelTypeSlugs == null) {
            return true; // No fuel type filter
        }

        if (fuelTypeSlugs instanceof List<?> fuelTypeList && !fuelTypeList.isEmpty()) {
            if (listing.getFuelType() == null) {
                return false;
            }

            String listingFuelType = listing.getFuelType().getSlug(); // Use slug for matching
            return fuelTypeList.contains(listingFuelType);
        }

        return true;
    }

    private boolean matchesTransmission(Map<String, Object> filters, CarListing listing) {
        Object transmissionSlug = filters.get("transmissionSlug");
        if (transmissionSlug instanceof String transmissionSlugStr) {
            if (listing.getTransmissionType() == null) {
                return false;
            }
            String listingTransmissionSlug = listing.getTransmissionType().getSlug();
            return transmissionSlugStr.equals(listingTransmissionSlug);
        }
        return true; // No transmission filter
    }

    private boolean matchesCondition(Map<String, Object> filters, CarListing listing) {
        Object conditionSlug = filters.get("conditionSlug");
        if (conditionSlug instanceof String conditionSlugStr) {
            if (listing.getCondition() == null) {
                return false;
            }
            String listingConditionSlug = listing.getCondition().getSlug();
            return conditionSlugStr.equals(listingConditionSlug);
        }
        return true; // No condition filter
    }
}
