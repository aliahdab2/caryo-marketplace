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
public class CreateListingRequest {
    
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
    
    /**
     * @deprecated Use locationId instead
     */
    @Deprecated
    private String location;
    
    /**
     * ID of the location entity
     */
    @NotNull(message = "Location is required")
    private Long locationId;
    
    private String description;
    
    private String imageUrl;

    // Explicit Getters
    public String getTitle() { return title; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public Integer getModelYear() { return modelYear; }
    public Integer getMileage() { return mileage; }
    public BigDecimal getPrice() { return price; }
    /**
     * @deprecated Use getLocationId() instead
     */
    @Deprecated
    public String getLocation() { return location; }
    
    public Long getLocationId() { return locationId; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }

    // Explicit Setters
    public void setTitle(String title) { this.title = title; }
    public void setBrand(String brand) { this.brand = brand; }
    public void setModel(String model) { this.model = model; }
    public void setModelYear(Integer modelYear) { this.modelYear = modelYear; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    /**
     * @deprecated Use setLocationId(Long) instead
     */
    @Deprecated
    public void setLocation(String location) { this.location = location; }
    
    public void setLocationId(Long locationId) { this.locationId = locationId; }
    public void setDescription(String description) { this.description = description; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
