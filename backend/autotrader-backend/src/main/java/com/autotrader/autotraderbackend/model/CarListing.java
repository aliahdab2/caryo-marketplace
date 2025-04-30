package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
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
    private Integer year;
    
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
    public CarListing(String title, String brand, String model, Integer year, Integer mileage, 
                      BigDecimal price, String location, String description, User seller) {
        this.title = title;
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.mileage = mileage;
        this.price = price;
        this.location = location;
        this.description = description;
        this.seller = seller;
    }
}
