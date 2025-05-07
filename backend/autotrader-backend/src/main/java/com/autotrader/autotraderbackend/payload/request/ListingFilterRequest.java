package com.autotrader.autotraderbackend.payload.request;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Request object for filtering car listings.
 * All fields are optional; only provided fields will be used as filters.
 * Pagination and sorting are handled separately via @RequestParam in the controller.
 */
@Getter
@Setter
public class ListingFilterRequest {


    /**
     * Filter by car brand (manufacturer). Optional.
     */
    private String brand;

    /**
     * Filter by car model. Optional.
     */
    private String model;

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
}
