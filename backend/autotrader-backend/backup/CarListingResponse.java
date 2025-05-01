package com.autotrader.autotraderbackend.payload.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CarListingResponse {
    
    private Long id;
    private String title;
    private String brand;
    private String model;
    private Integer modelYear;
    private Integer mileage;
    private BigDecimal price;
    private String location;
    private String description;
    private String imageUrl;
    private Boolean approved;
    private Long sellerId;
    private String sellerUsername;
    private LocalDateTime createdAt;
    
    // Default constructor
    public CarListingResponse() {
    }
    
    // Constructor with fields
    public CarListingResponse(Long id, String title, String brand, String model, Integer modelYear, Integer mileage,
                           BigDecimal price, String location, String description, String imageUrl,
                           Boolean approved, Long sellerId, String sellerUsername, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.brand = brand;
        this.model = model;
        this.modelYear = modelYear;
        this.mileage = mileage;
        this.price = price;
        this.location = location;
        this.description = description;
        this.imageUrl = imageUrl;
        this.approved = approved;
        this.sellerId = sellerId;
        this.sellerUsername = sellerUsername;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getBrand() {
        return brand;
    }
    
    public void setBrand(String brand) {
        this.brand = brand;
    }
    
    public String getModel() {
        return model;
    }
    
    public void setModel(String model) {
        this.model = model;
    }
    
    public Integer getModelYear() {
        return modelYear;
    }
    
    public void setModelYear(Integer modelYear) {
        this.modelYear = modelYear;
    }
    
    public Integer getMileage() {
        return mileage;
    }
    
    public void setMileage(Integer mileage) {
        this.mileage = mileage;
    }
    
    public BigDecimal getPrice() {
        return price;
    }
    
    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getImageUrl() {
        return imageUrl;
    }
    
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    public Boolean getApproved() {
        return approved;
    }
    
    public void setApproved(Boolean approved) {
        this.approved = approved;
    }
    
    public Long getSellerId() {
        return sellerId;
    }
    
    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }
    
    public String getSellerUsername() {
        return sellerUsername;
    }
    
    public void setSellerUsername(String sellerUsername) {
        this.sellerUsername = sellerUsername;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
