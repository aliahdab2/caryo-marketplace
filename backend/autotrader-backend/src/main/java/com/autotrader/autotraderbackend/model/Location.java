package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity representing a geographical location in the system.
 * Part of the Country > Governorate > Location hierarchy.
 */
@Entity
@Table(name = "locations", indexes = {
    @Index(name = "idx_location_slug", columnList = "slug"),
    @Index(name = "idx_location_governorate_id", columnList = "governorate_id"),
    @Index(name = "idx_location_is_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(max = 100)
    @Column(name = "display_name_en", nullable = false)
    private String displayNameEn;

    @NotNull
    @Size(max = 100)
    @Column(name = "display_name_ar", nullable = false)
    private String displayNameAr;

    @NotNull
    @Size(max = 100)
    @Column(nullable = false, unique = true)
    private String slug;

    @Size(max = 100)
    private String region;

    private Double latitude;

    private Double longitude;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "governorate_id", nullable = false)
    private Governorate governorate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Returns the display name based on the locale
     * @param isArabic true for Arabic, false for English
     * @return The localized display name
     */
    public String getLocalizedName(boolean isArabic) {
        return isArabic ? displayNameAr : displayNameEn;
    }

    /**
     * Helper method to get the country code from the associated governorate
     * @return The ISO 3166-1 alpha-2 country code
     */
    public String getCountryCode() {
        return governorate != null && governorate.getCountry() != null 
            ? governorate.getCountry().getCountryCode() 
            : null;
    }
}
