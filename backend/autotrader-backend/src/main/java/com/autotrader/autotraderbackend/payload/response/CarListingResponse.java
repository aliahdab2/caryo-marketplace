package com.autotrader.autotraderbackend.payload.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// Keep Lombok annotations for potential future use/consistency, but add explicit methods
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CarListingResponse {

    private Long id;
    private String title;
    private String brand;
    private String model;
    private Integer modelYear;
    private Integer mileage;
    private BigDecimal price;
    
    /**
     * @deprecated Use locationDetails instead
     */
    @Deprecated
    private String location;
    
    /**
     * Location details object
     */
    private LocationResponse locationDetails;
    
    private String description;
    private String imageUrl;
    private Boolean approved;
    private Long sellerId;
    private String sellerUsername;
    private LocalDateTime createdAt;

    // Explicit Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public Integer getModelYear() { return modelYear; }
    public Integer getMileage() { return mileage; }
    public BigDecimal getPrice() { return price; }
    
    /**
     * @deprecated Use getLocationDetails() instead
     */
    @Deprecated
    public String getLocation() { return location; }
    
    public LocationResponse getLocationDetails() { return locationDetails; }
    
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public Boolean getApproved() { return approved; }
    public Long getSellerId() { return sellerId; }
    public String getSellerUsername() { return sellerUsername; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Explicit Setters (Add if needed, currently only getters seem required by errors)
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setBrand(String brand) { this.brand = brand; }
    public void setModel(String model) { this.model = model; }
    public void setModelYear(Integer modelYear) { this.modelYear = modelYear; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    /**
     * @deprecated Use setLocationDetails(LocationResponse) instead
     */
    @Deprecated
    public void setLocation(String location) { this.location = location; }
    
    public void setLocationDetails(LocationResponse locationDetails) { this.locationDetails = locationDetails; }
    
    public void setDescription(String description) { this.description = description; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setApproved(Boolean approved) { this.approved = approved; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    public void setSellerUsername(String sellerUsername) { this.sellerUsername = sellerUsername; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
