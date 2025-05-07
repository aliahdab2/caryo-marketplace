package com.autotrader.autotraderbackend.payload.request;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ListingFilterRequest {

    private String brand;
    private String model;

    @Min(value = 1920, message = "Minimum year filter must be 1920 or later")
    @Digits(integer = 4, fraction = 0, message = "Minimum year filter must be a 4-digit number")
    private Integer minYear;

    @CurrentYearOrEarlier(message = "Maximum year filter must not be later than the current year")
    @Digits(integer = 4, fraction = 0, message = "Maximum year filter must be a 4-digit number")
    private Integer maxYear;

    private String location; // This will be used for the slug
    private Long locationId; // New field for filtering by location ID

    @PositiveOrZero(message = "Minimum price must be positive or zero")
    private BigDecimal minPrice;

    @PositiveOrZero(message = "Maximum price must be positive or zero")
    private BigDecimal maxPrice;

    @PositiveOrZero(message = "Minimum mileage must be positive or zero")
    private Integer minMileage;

    @PositiveOrZero(message = "Maximum mileage must be positive or zero")
    private Integer maxMileage;

    // New fields for filtering by sold and archived status
    private Boolean isSold;
    private Boolean isArchived;

    // Pagination and sorting are handled separately via @RequestParam in the controller
}
