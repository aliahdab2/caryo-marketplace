package com.autotrader.autotraderbackend.model;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import jakarta.persistence.*;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "car_listings")
@Getter
@Setter
public class CarListing {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false)
    private String brand;
    
    @Column(nullable = false)
    private String model;
    
    @Column(name = "model_year", nullable = false)
    @Min(value = 1920, message = "Year must be 1920 or later")
    @CurrentYearOrEarlier(message = "Year must not be later than the current year")
    @Digits(integer = 4, fraction = 0, message = "Year must be a 4-digit number")
    private Integer modelYear;
    
    @Column(nullable = false)
    private Integer mileage;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    @Column(nullable = false)
    private String location;
    
    @Column(length = 2000)
    private String description;
    
    private String imageUrl;
    
    @Column(nullable = false)
    private Boolean approved = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User seller;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Default constructor
    public CarListing() {
    }
    
    // Constructor with fields
    public CarListing(String title, String brand, String model, Integer modelYear, Integer mileage, 
                      BigDecimal price, String location, String description, User seller) {
        this.title = title;
        this.brand = brand;
        this.model = model;
        this.modelYear = modelYear;
        this.mileage = mileage;
        this.price = price;
        this.location = location;
        this.description = description;
        this.seller = seller;
    }
}
