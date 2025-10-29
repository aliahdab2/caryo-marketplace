package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
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

    @Size(max = 255)
    @Column(name = "file_key", length = 255)
    private String fileKey;

    @Size(max = 255)
    @Column(name = "file_name", length = 255)
    private String fileName;

    @Size(max = 100)
    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "size")
    private Long size;

    // External video URL (for YouTube, Vimeo, etc.) - following AutoTrader pattern
    @Size(max = 500)
    @Column(name = "external_url", length = 500)
    private String externalUrl;

    // Video source type ('upload' for file uploads, 'youtube', 'vimeo', 'external')
    @Size(max = 20)
    @Column(name = "video_source", length = 20)
    private String videoSource;

    // Video duration in seconds (for validation and display)
    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "sort_order", nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    private Integer sortOrder = 0;

    @Column(name = "is_primary", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isPrimary = false;

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
     * and that required fields are present based on the media source type
     */
    private void validateMediaType() {
        if (mediaType != null && !mediaType.equals("image") && !mediaType.equals("video")) {
            throw new IllegalArgumentException("Media type must be either 'image' or 'video'");
        }

        // Validate based on video source type
        if ("video".equals(mediaType)) {
            validateVideoSource();
        } else if ("image".equals(mediaType)) {
            validateImageFields();
        }
    }

    /**
     * Validates video-specific fields based on AutoTrader patterns
     */
    private void validateVideoSource() {
        if (videoSource == null) {
            throw new IllegalArgumentException("Video source must be specified for video media");
        }

        switch (videoSource.toLowerCase()) {
            case "upload":
                // For uploaded videos, file_key and content_type are required
                if (fileKey == null || fileKey.trim().isEmpty()) {
                    throw new IllegalArgumentException("File key is required for uploaded videos");
                }
                if (contentType == null || contentType.trim().isEmpty()) {
                    throw new IllegalArgumentException("Content type is required for uploaded videos");
                }
                break;
            case "youtube":
            case "vimeo":
            case "external":
                // For external videos, external_url is required
                if (externalUrl == null || externalUrl.trim().isEmpty()) {
                    throw new IllegalArgumentException("External URL is required for " + videoSource + " videos");
                }
                // Validate URL format for YouTube
                if ("youtube".equals(videoSource) && !isValidYouTubeUrl(externalUrl)) {
                    throw new IllegalArgumentException("Invalid YouTube URL format");
                }
                // Set default values for NOT NULL fields to work with H2 constraints
                if (fileKey == null) {
                    fileKey = "external_" + videoSource + "_video";
                }
                if (fileName == null) {
                    fileName = videoSource.substring(0, 1).toUpperCase() + videoSource.substring(1) + " Video";
                }
                if (contentType == null) {
                    contentType = "video/external";
                }
                if (size == null) {
                    size = 0L; // External videos don't have file size
                }
                break;
            default:
                throw new IllegalArgumentException("Invalid video source: " + videoSource +
                    ". Must be 'upload', 'youtube', 'vimeo', or 'external'");
        }

        // Validate duration (AutoTrader limit: 3 minutes = 180 seconds)
        if (durationSeconds != null && durationSeconds > 180) {
            throw new IllegalArgumentException("Video duration cannot exceed 3 minutes (180 seconds)");
        }
    }

    /**
     * Validates image-specific fields
     */
    private void validateImageFields() {
        if (fileKey == null || fileKey.trim().isEmpty()) {
            throw new IllegalArgumentException("File key is required for images");
        }
        if (contentType == null || contentType.trim().isEmpty()) {
            throw new IllegalArgumentException("Content type is required for images");
        }
    }

    /**
     * Validates YouTube URL format following AutoTrader patterns
     */
    private boolean isValidYouTubeUrl(String url) {
        if (url == null) return false;
        return url.matches("^(https?://)?(www\\.)?(youtube\\.com/watch\\?v=|youtu\\.be/)[a-zA-Z0-9_-]{11}.*$");
    }

    /**
     * Checks if this media item is an external video (YouTube, Vimeo, etc.)
     */
    public boolean isExternalVideo() {
        return "video".equals(mediaType) &&
               videoSource != null &&
               !videoSource.equals("upload");
    }

    /**
     * Checks if this media item is an uploaded video file
     */
    public boolean isUploadedVideo() {
        return "video".equals(mediaType) && "upload".equals(videoSource);
    }
}
