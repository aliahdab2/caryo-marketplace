package com.autotrader.autotraderbackend.model;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import jakarta.persistence.*;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "car_listings")
@Getter
@Setter
@NoArgsConstructor
public class CarListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @NotBlank
    @Size(max = 50)
    @Column(name = "brand", nullable = false, length = 50)
    private String brand;

    @NotBlank
    @Size(max = 50)
    @Column(name = "model", nullable = false, length = 50)
    private String model;

    @Column(name = "model_year", nullable = false)
    @Min(value = 1920, message = "Year must be 1920 or later")
    @CurrentYearOrEarlier(message = "Year must not be later than the current year")
    @Digits(integer = 4, fraction = 0, message = "Year must be a 4-digit number")
    private Integer modelYear;

    @Column(name = "mileage", nullable = false)
    private Integer mileage;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Size(max = 17)
    @Column(name = "vin", length = 17)
    private String vin;

    @Size(max = 50)
    @Column(name = "stock_number", length = 50)
    private String stockNumber;

    @Size(max = 50)
    @Column(name = "exterior_color", length = 50)
    private String exteriorColor;

    @Size(max = 50)
    @Column(name = "interior_color", length = 50)
    private String interiorColor;

    @Column(name = "doors")
    private Integer doors;

    @Column(name = "cylinders")
    private Integer cylinders;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location locationEntity;

    @NotBlank
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Size(max = 50)
    @Column(name = "transmission", length = 50)
    private String transmission;

    @Column(name = "approved", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean approved = false;

    @Column(name = "sold", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean sold = false;

    @Column(name = "archived", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean archived = false;

    @Column(name = "expiration_date")
    private LocalDateTime expirationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP")
    private LocalDateTime updatedAt;

    @Column(name = "image_url")
    private String imageUrl; // URL or identifier returned by storage service

    @Column(name = "image_key")
    private String imageKey; // Key used to store the image in the storage service

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
