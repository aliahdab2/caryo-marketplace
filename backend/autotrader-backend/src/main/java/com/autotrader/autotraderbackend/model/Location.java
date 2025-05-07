package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity representing a geographical location in the system.
 * Supports multilingual names and geographical coordinates.
 */
@Entity
@Table(name = "locations", indexes = {
    @Index(name = "idx_location_slug", columnList = "slug"),
    @Index(name = "idx_location_country_code", columnList = "country_code")
})
@Getter
@Setter
@NoArgsConstructor
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The name of the location in English
     */
    @Column(nullable = false)
    private String displayNameEn;

    /**
     * The name of the location in Arabic
     */
    @Column(nullable = false)
    private String displayNameAr;

    /**
     * URL-friendly slug for the location
     */
    @Column(nullable = false, unique = true)
    private String slug;

    /**
     * ISO 3166-1 alpha-2 country code (e.g., "SY" for Syria)
     */
    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    /**
     * Optional region grouping (e.g., "Central Syria")
     */
    private String region;

    /**
     * Latitude coordinate of the location
     */
    private Double latitude;

    /**
     * Longitude coordinate of the location
     */
    private Double longitude;

    /**
     * Flag indicating whether the location is active in the system
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;


    /**
     * Returns the display name based on the locale
     * @param isArabic true for Arabic, false for English
     * @return The localized display name
     */
    public String getLocalizedName(boolean isArabic) {
        return isArabic ? displayNameAr : displayNameEn;
    }
}
