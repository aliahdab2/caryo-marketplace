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
import java.util.List;

/**
 * Entity representing a country in the geographic hierarchy.
 * Countries contain governorates which contain locations.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "countries", indexes = {
    @Index(name = "idx_country_code", columnList = "country_code", unique = true),
    @Index(name = "idx_country_is_active", columnList = "is_active")
})
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(min = 2, max = 2)
    @Column(name = "country_code", nullable = false, unique = true, length = 2)
    private String countryCode = "SY"; // ISO 3166-1 alpha-2 country code (e.g., "SY" for Syria)

    @NotNull
    @Size(max = 100)
    @Column(name = "display_name_en", nullable = false, length = 100)
    private String displayNameEn = "Syria";

    @NotNull
    @Size(max = 100)
    @Column(name = "display_name_ar", nullable = false, length = 100)
    private String displayNameAr = "سوريا";

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Bidirectional relationship with governorates
    @OneToMany(mappedBy = "country", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Governorate> governorates;

    /**
     * Returns the display name based on the locale
     * @param isArabic true for Arabic, false for English
     * @return The localized display name
     */
    public String getLocalizedName(boolean isArabic) {
        return isArabic ? displayNameAr : displayNameEn;
    }
}
