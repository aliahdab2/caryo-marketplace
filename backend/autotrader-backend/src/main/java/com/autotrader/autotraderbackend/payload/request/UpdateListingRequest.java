package com.autotrader.autotraderbackend.payload.request;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Getter
@Setter
public class UpdateListingRequest {
    
    private String title;
    
    private String brand;
    
    private String model;
    
    @Min(value = 1920, message = "Year must be 1920 or later")
    @CurrentYearOrEarlier(message = "Year must not be later than the current year")
    @Digits(integer = 4, fraction = 0, message = "Year must be a 4-digit number")
    private Integer modelYear;
    
    @PositiveOrZero(message = "Mileage must be a positive number or zero")
    private Integer mileage;
    
    @Positive(message = "Price must be a positive number")
    private BigDecimal price;
    
    private String location;
    
    private String description;
    
    private String transmission;

    // Explicit getters and setters
    public String getTitle() { return title; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public Integer getModelYear() { return modelYear; }
    public Integer getMileage() { return mileage; }
    public BigDecimal getPrice() { return price; }
    public String getLocation() { return location; }
    public String getDescription() { return description; }
    public String getTransmission() { return transmission; }

    public void setTitle(String title) { this.title = title; }
    public void setBrand(String brand) { this.brand = brand; }
    public void setModel(String model) { this.model = model; }
    public void setModelYear(Integer modelYear) { this.modelYear = modelYear; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setLocation(String location) { this.location = location; }
    public void setDescription(String description) { this.description = description; }
    public void setTransmission(String transmission) { this.transmission = transmission; }
}
