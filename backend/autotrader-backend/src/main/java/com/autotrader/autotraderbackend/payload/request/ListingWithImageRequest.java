package com.autotrader.autotraderbackend.payload.request;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ListingWithImageRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Brand is required")
    private String brand;
    
    @NotBlank(message = "Model is required")
    private String model;
    
    @NotNull(message = "Year is required")
    @Min(value = 1920, message = "Year must be 1920 or later")
    @CurrentYearOrEarlier(message = "Year must not be later than the current year")
    @Digits(integer = 4, fraction = 0, message = "Year must be a 4-digit number")
    private Integer modelYear;
    
    @NotNull(message = "Mileage is required")
    @PositiveOrZero(message = "Mileage must be a positive number or zero")
    private Integer mileage;
    
    @NotNull(message = "Price is required")
    @Positive(message = "Price must be a positive number")
    private BigDecimal price;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    private String description;
}
