package com.autotrader.autotraderbackend.payload.request;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class UpdateListingRequest {
    private String title;
    private Long modelId;
    @Min(value = 1920, message = "Year must be 1920 or later")
    @CurrentYearOrEarlier(message = "Year must not be later than the current year")
    @Digits(integer = 4, fraction = 0, message = "Year must be a 4-digit number")
    private Integer modelYear;
    @PositiveOrZero(message = "Mileage must be a positive number or zero")
    private Integer mileage;
    @Positive(message = "Price must be a positive number")
    private BigDecimal price;
    /**
     * ID of the location entity
     */
    private Long locationId;
    private String description;
    private String transmission;
    private Boolean isSold;
    private Boolean isArchived;

    // Explicit getters and setters
    public String getTitle() { return title; }
    public Long getModelId() { return modelId; }
    public Integer getModelYear() { return modelYear; }
    public Integer getMileage() { return mileage; }
    public BigDecimal getPrice() { return price; }
    public Long getLocationId() { return locationId; }
    public String getDescription() { return description; }
    public String getTransmission() { return transmission; }
    public Boolean getIsSold() { return isSold; }
    public Boolean getIsArchived() { return isArchived; }

    public void setTitle(String title) { this.title = title; }
    public void setModelId(Long modelId) { this.modelId = modelId; }
    public void setModelYear(Integer modelYear) { this.modelYear = modelYear; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }
    public void setDescription(String description) { this.description = description; }
    public void setTransmission(String transmission) { this.transmission = transmission; }
    public void setIsSold(Boolean isSold) { this.isSold = isSold; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
}
