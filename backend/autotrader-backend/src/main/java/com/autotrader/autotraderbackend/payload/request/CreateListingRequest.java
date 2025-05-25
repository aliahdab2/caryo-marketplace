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
    

    /**
     * The title of the car listing. Required and must not be blank.
     */
    @NotBlank(message = "Title is required")
    private String title;

    /**
     * The model ID of the car. Required.
     */
    @NotNull(message = "Model is required")
    private Long modelId;

    /**
     * The model year of the car. Required. Must be a 4-digit integer, not earlier than 1920,
     * and not later than the current year.
     */
    @NotNull(message = "Year is required")
    @Min(value = 1920, message = "Year must be 1920 or later")
    @CurrentYearOrEarlier(message = "Year must not be later than the current year")
    @Digits(integer = 4, fraction = 0, message = "Year must be a 4-digit number")
    private Integer modelYear;

    /**
     * The mileage of the car. Required. Must be zero or a positive integer.
     */
    @NotNull(message = "Mileage is required")
    @PositiveOrZero(message = "Mileage must be a positive number or zero")
    private Integer mileage;

    /**
     * The price of the car. Required. Must be a positive decimal number.
     */
    @NotNull(message = "Price is required")
    @Positive(message = "Price must be a positive number")
    private BigDecimal price;

    /**
     * ID of the location entity. Required.
     */
    @NotNull(message = "Location is required")
    private Long locationId;

    /**
     * Optional description of the car listing.
     */
    private String description;

    /**
     * Whether the car is marked as sold. Optional.
     */
    private Boolean isSold;

    /**
     * Whether the car listing is archived. Optional.
     */
    private Boolean isArchived;

    // Explicit Getters
    public String getTitle() { return title; }
    public Long getModelId() { return modelId; }
    public Integer getModelYear() { return modelYear; }
    public Integer getMileage() { return mileage; }
    public BigDecimal getPrice() { return price; }
    public Long getLocationId() { return locationId; }
    public String getDescription() { return description; }
    public Boolean getIsSold() { return isSold; }
    public Boolean getIsArchived() { return isArchived; }

    // Explicit Setters
    public void setTitle(String title) { this.title = title; }
    public void setModelId(Long modelId) { this.modelId = modelId; }
    public void setModelYear(Integer modelYear) { this.modelYear = modelYear; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }
    public void setDescription(String description) { this.description = description; }
    public void setIsSold(Boolean isSold) { this.isSold = isSold; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
}
