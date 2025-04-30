package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class CreateListingRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Brand is required")
    private String brand;
    
    @NotBlank(message = "Model is required")
    private String model;
    
    @NotNull(message = "Year is required")
    @Positive(message = "Year must be a positive number")
    private Integer year;
    
    @NotNull(message = "Mileage is required")
    @PositiveOrZero(message = "Mileage must be a positive number or zero")
    private Integer mileage;
    
    @NotNull(message = "Price is required")
    @Positive(message = "Price must be a positive number")
    private BigDecimal price;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    private String description;
    
    private String imageUrl;
}
