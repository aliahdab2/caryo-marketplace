package com.autotrader.autotraderbackend.payload.request;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Request object for filtering car listings with slug-based filtering support.
 * All fields are optional; only provided fields will be used as filters.
 * Pagination and sorting are handled separately via @RequestParam in the controller.
 */
@Getter
@Setter
public class ListingFilterRequest {

    // NEW: Slug-based fields for multiple brands/models (AutoTrader UK pattern)
    @Schema(description = "Brand slugs for filtering (can be repeated)", example = "toyota")
    private List<String> brandSlugs;
    
    @Schema(description = "Model slugs for filtering (can be repeated)", example = "camry")
    private List<String> modelSlugs;

    /**
     * Minimum model year for filtering. Optional. Must be a 4-digit integer and not earlier than 1920.
     */
    @Min(value = 1920, message = "Minimum year filter must be 1920 or later")
    @Digits(integer = 4, fraction = 0, message = "Minimum year filter must be a 4-digit number")
    private Integer minYear;

    /**
     * Maximum model year for filtering. Optional. Must be a 4-digit integer and not later than the current year.
     */
    @CurrentYearOrEarlier(message = "Maximum year filter must not be later than the current year")
    @Digits(integer = 4, fraction = 0, message = "Maximum year filter must be a 4-digit number")
    private Integer maxYear;


    /**
     * Filter by location slug (string). Optional.
     * This is typically a human-readable identifier for the location (e.g., "new-york-ny").
     */
    private String location;

    /**
     * Filter by location ID. Optional.
     * Use this for precise filtering by a unique location identifier.
     */
    private Long locationId;

    /**
     * Minimum price for filtering. Optional. Must be positive or zero.
     */
    @PositiveOrZero(message = "Minimum price must be positive or zero")
    private BigDecimal minPrice;

    /**
     * Maximum price for filtering. Optional. Must be positive or zero.
     */
    @PositiveOrZero(message = "Maximum price must be positive or zero")
    private BigDecimal maxPrice;

    /**
     * Minimum mileage for filtering. Optional. Must be positive or zero.
     */
    @PositiveOrZero(message = "Minimum mileage must be positive or zero")
    private Integer minMileage;

    /**
     * Maximum mileage for filtering. Optional. Must be positive or zero.
     */
    @PositiveOrZero(message = "Maximum mileage must be positive or zero")
    private Integer maxMileage;

    /**
     * Filter by sold status. Optional.
     * If true, only sold listings are returned; if false, only unsold listings.
     */
    private Boolean isSold;

    /**
     * Filter by archived status. Optional.
     * If true, only archived listings are returned; if false, only active listings.
     */
    private Boolean isArchived;

    /**
     * Filter by seller type ID. Optional.
     * Use this to filter listings by the type of seller (e.g., dealer, private).
     */
    @Schema(description = "Filter by seller type ID (e.g., 1 for dealer, 2 for private seller)", example = "1")
    private Long sellerTypeId;

    // Helper methods for slug-based filtering
    
    /**
     * Returns normalized brand slugs (lowercase, trimmed, no duplicates).
     */
    @JsonIgnore
    public List<String> getNormalizedBrandSlugs() {
        return brandSlugs == null ? Collections.emptyList() :
            brandSlugs.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(slug -> !slug.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }
    
    /**
     * Returns normalized model slugs (lowercase, trimmed, no duplicates).
     */
    @JsonIgnore
    public List<String> getNormalizedModelSlugs() {
        return modelSlugs == null ? Collections.emptyList() :
            modelSlugs.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(slug -> !slug.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }
}
