package com.autotrader.autotraderbackend.payload.request;

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
    private Integer modelYear;
    private String location;
    
    @PositiveOrZero(message = "Minimum price must be positive or zero")
    private BigDecimal minPrice;
    
    @PositiveOrZero(message = "Maximum price must be positive or zero")
    private BigDecimal maxPrice;
    
    @Min(value = 0, message = "Page must be positive or zero")
    private Integer page = 0;
    
    @Min(value = 1, message = "Size must be at least 1")
    private Integer size = 10;
    
    private String sortBy = "createdAt";
    private String sortDirection = "desc";
}
