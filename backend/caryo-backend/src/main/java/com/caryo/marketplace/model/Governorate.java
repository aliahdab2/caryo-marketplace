package com.caryo.marketplace.model;

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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "governorates", indexes = {
    @Index(name = "idx_governorate_slug", columnList = "slug", unique = true),
    @Index(name = "idx_governorate_country_id", columnList = "country_id"),
    @Index(name = "idx_governorate_is_active", columnList = "is_active")
})
public class Governorate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Size(max = 100)
    @Column(name = "display_name_en", nullable = false, length = 100)
    private String displayNameEn;

    @NotNull
    @Size(max = 100)
    @Column(name = "display_name_ar", nullable = false, length = 100)
    private String displayNameAr;

    @NotNull
    @Size(max = 100)
    @Column(name = "slug", nullable = false, unique = true, length = 100)
    private String slug;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    @Size(max = 100)
    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Bidirectional relationship with locations
    @OneToMany(mappedBy = "governorate", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Location> locations;

    /**
     * Returns the display name based on the locale
     * @param isArabic true for Arabic, false for English
     * @return The localized display name
     */
    public String getLocalizedName(boolean isArabic) {
        return isArabic ? displayNameAr : displayNameEn;
    }
}
