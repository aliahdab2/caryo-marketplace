package com.autotrader.autotraderbackend.payload.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

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
    // Removed brand and model fields; use denormalized fields below
    private Integer modelYear;
    private Integer mileage;
    private BigDecimal price;
    
    /**
     * Denormalized brand name in English for efficient search
     */
    private String brandNameEn;
    /**
     * Denormalized brand name in Arabic for efficient search
     */
    private String brandNameAr;
    /**
     * Denormalized model name in English for efficient search
     */
    private String modelNameEn;
    /**
     * Denormalized model name in Arabic for efficient search
     */
    private String modelNameAr;
    
    /**
     * Location details object
     */
    private LocationResponse locationDetails;
    
    private String description;
    /**
     * Collection of media items (images/videos) associated with this car listing
     */
    private List<ListingMediaResponse> media = new ArrayList<>();
    
    @JsonProperty("approved")
    private Boolean approved;
    private Long sellerId;
    private String sellerUsername;
    private LocalDateTime createdAt;
    private Boolean isSold;
    private Boolean isArchived;
    private Boolean isUserActive;
    private Boolean isExpired; // Added field

    // Explicit Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    // Removed getBrand and getModel; use denormalized fields below
    public String getBrandNameEn() { return brandNameEn; }
    public String getBrandNameAr() { return brandNameAr; }
    public String getModelNameEn() { return modelNameEn; }
    public String getModelNameAr() { return modelNameAr; }
    public Integer getModelYear() { return modelYear; }
    public Integer getMileage() { return mileage; }
    public BigDecimal getPrice() { return price; }
    
    public LocationResponse getLocationDetails() { return locationDetails; }
    
    public String getDescription() { return description; }
    public List<ListingMediaResponse> getMedia() { return media; }
    public Boolean getApproved() { return approved; }
    public Long getSellerId() { return sellerId; }
    public String getSellerUsername() { return sellerUsername; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Boolean getIsSold() { return isSold; }
    public Boolean getIsArchived() { return isArchived; }
    public Boolean getIsUserActive() { return isUserActive; } // Added getter
    public Boolean getIsExpired() { return isExpired; } // Added getter

    // Explicit Setters (Add if needed, currently only getters seem required by errors)
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    // Removed setBrand and setModel; use denormalized fields below
    public void setBrandNameEn(String brandNameEn) { this.brandNameEn = brandNameEn; }
    public void setBrandNameAr(String brandNameAr) { this.brandNameAr = brandNameAr; }
    public void setModelNameEn(String modelNameEn) { this.modelNameEn = modelNameEn; }
    public void setModelNameAr(String modelNameAr) { this.modelNameAr = modelNameAr; }
    public void setModelYear(Integer modelYear) { this.modelYear = modelYear; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public void setLocationDetails(LocationResponse locationDetails) { this.locationDetails = locationDetails; }
    
    public void setDescription(String description) { this.description = description; }
    public void setMedia(List<ListingMediaResponse> media) { this.media = media != null ? media : new ArrayList<>(); }
    public void setApproved(Boolean approved) { this.approved = approved; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    public void setSellerUsername(String sellerUsername) { this.sellerUsername = sellerUsername; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setIsSold(Boolean isSold) { this.isSold = isSold; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }
    public void setIsUserActive(Boolean isUserActive) { this.isUserActive = isUserActive; } // Added setter
    public void setIsExpired(Boolean isExpired) { this.isExpired = isExpired; } // Added setter
}
