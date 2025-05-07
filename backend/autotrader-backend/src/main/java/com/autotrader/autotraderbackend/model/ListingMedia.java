package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Entity representing media files (images, videos) associated with car listings.
 */
@Entity
@Table(name = "listing_media")
@Getter
@Setter
@NoArgsConstructor
public class ListingMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false, insertable = false, updatable = false)
    private Long listingId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private CarListing carListing;

    @NotBlank
    @Size(max = 255)
    @Column(name = "file_key", nullable = false, length = 255)
    private String fileKey;

    @NotBlank
    @Size(max = 255)
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @NotNull
    @Column(name = "size", nullable = false)
    private Long size;

    @Column(name = "sort_order", nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    private Integer sortOrder = 0;

    @Column(name = "is_primary", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isPrimary = false;

    @NotBlank
    @Column(name = "media_type", nullable = false, length = 20)
    private String mediaType;  // 'image' or 'video'

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    /**
     * Handles pre-persist operations:
     * 1. Sets the creation timestamp if not already set
     * 2. Validates the media type
     */
    @PrePersist
    protected void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        validateMediaType();
    }
    
    /**
     * Handles pre-update operations:
     * Validates that the media type is valid
     */
    @PreUpdate
    protected void preUpdate() {
        validateMediaType();
    }
    
    /**
     * Validates that the media type is either 'image' or 'video'
     * This is enforced in the DB with a CHECK constraint, but we also validate in the entity
     */
    private void validateMediaType() {
        if (mediaType != null && !mediaType.equals("image") && !mediaType.equals("video")) {
            throw new IllegalArgumentException("Media type must be either 'image' or 'video'");
        }
    }
}
