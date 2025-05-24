package com.autotrader.autotraderbackend.model;

import com.autotrader.autotraderbackend.validation.CurrentYearOrEarlier;
import jakarta.persistence.*;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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


    @Column(name = "doors")
    private Integer doors;

    @Column(name = "cylinders")
    private Integer cylinders;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;
    
    @NotBlank
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Size(max = 50)
    @Column(name = "transmission", length = 50)
    private String transmission;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "condition_id")
    private CarCondition condition;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "body_style_id")
    private BodyStyle bodyStyle;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transmission_id")
    private Transmission transmissionType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fuel_type_id")
    private FuelType fuelType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drive_type_id")
    private DriveType driveType;

    @Column(name = "approved", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean approved = false;

    @Column(name = "sold", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean sold = false;

    @Column(name = "archived", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean archived = false;

    @Column(name = "expired", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean expired = false;

    @Column(name = "is_user_active", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isUserActive = true;

    @Column(name = "expiration_date")
    private LocalDateTime expirationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "carListing", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ListingMedia> media = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    /**
     * The @PreUpdate method is commented out because we're using a PostgreSQL trigger
     * to automatically update the updated_at timestamp.
     * 
     * If we ever need to handle updates at the application level, uncomment this method.
     *
     * @PreUpdate
     * protected void onUpdate() {
     *     updatedAt = LocalDateTime.now();
     * }
     */
    

    
    /**
     * Helper method to get the primary media item for this listing
     * @return The primary media item, or the first media item if no primary is set, or null if no media exists
     */
    public ListingMedia getPrimaryMedia() {
        if (media == null || media.isEmpty()) {
            return null;
        }
        
        return media.stream()
            .filter(m -> m.getIsPrimary() && "image".equals(m.getMediaType()))
            .findFirst()
            .orElseGet(() -> media.stream()
                .filter(m -> "image".equals(m.getMediaType()))
                .findFirst()
                .orElse(null));
    }
    
    /**
     * Helper method to add a media item to this listing
     * @param media The media item to add
     */
    public void addMedia(ListingMedia media) {
        this.media.add(media);
    }
    
    /**
     * Helper method to remove a media item from this listing
     * @param media The media item to remove
     */
    public void removeMedia(ListingMedia media) {
        this.media.remove(media);
    }
    
    /**
     * Synchronizes the transmission string field with the transmissionType entity.
     * This method should be called before saving a car listing.
     */
    protected void syncTransmissionField() {
        if (transmissionType != null) {
            this.transmission = transmissionType.getName();
        }
    }
    /**
     * Returns true if the listing is considered active according to business rules.
     * A listing is active if it is approved, not sold, not archived, not expired,
     * and (if expirationDate is set) the expirationDate is in the future.
     */
    public boolean isActive() {
        return Boolean.TRUE.equals(approved)
            && Boolean.FALSE.equals(sold)
            && Boolean.FALSE.equals(archived)
            && Boolean.FALSE.equals(expired)
            && (expirationDate == null || expirationDate.isAfter(LocalDateTime.now()));
    }
}
