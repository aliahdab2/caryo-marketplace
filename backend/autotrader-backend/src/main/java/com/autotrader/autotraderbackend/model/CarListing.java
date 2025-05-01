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
// Keep Lombok annotations for potential future use/consistency, but add explicit methods
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

    private String transmission;

    @Column(nullable = false)
    private Boolean approved = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User seller;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String imageUrl; // URL or identifier returned by storage service
    private String imageKey; // Key used to store the image in the storage service

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
