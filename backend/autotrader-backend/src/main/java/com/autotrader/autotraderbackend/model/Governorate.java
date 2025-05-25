package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "governorates")
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
    @Size(max = 2)
    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Size(max = 100)
    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Constructors, getters, and setters are handled by Lombok
}
