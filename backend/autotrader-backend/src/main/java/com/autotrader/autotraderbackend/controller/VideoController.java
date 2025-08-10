package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Controller for managing video content in car listings.
 * Follows AutoTrader patterns for YouTube integration and external video URLs.
 */
@RestController
@RequestMapping("/api/listings/{listingId}/videos")
@Tag(name = "Video Management", description = "Video management operations for car listings")
@Slf4j
public class VideoController {

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private UserRepository userRepository;



    // YouTube URL validation pattern (supports various YouTube URL formats)
    private static final Pattern YOUTUBE_URL_PATTERN = Pattern.compile(
        "^(https?://)?(www\\.)?(youtube\\.com/watch\\?v=|youtu\\.be/)[a-zA-Z0-9_-]{11}.*$"
    );

    // Vimeo URL validation pattern
    private static final Pattern VIMEO_URL_PATTERN = Pattern.compile(
        "^(https?://)?(www\\.)?vimeo\\.com/\\d+.*$"
    );

    /**
     * Add external video URL to a listing (YouTube, Vimeo, etc.)
     * Following AutoTrader's primary pattern of YouTube integration
     */
    @PostMapping("/external")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Add external video URL", 
               description = "Add YouTube, Vimeo, or other external video URL to a car listing",
               security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> addExternalVideo(
            @PathVariable Long listingId,
            @Valid @RequestBody ExternalVideoRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Adding external video to listing {}: {}", listingId, request.getUrl());

        // Get user from authentication
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // Get the listing and verify ownership
        CarListing listing = carListingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (!Objects.equals(listing.getSeller().getId(), user.getId())) {
            throw new RuntimeException("You can only add videos to your own listings");
        }

        // Validate video limits (1 uploaded + 1 external as per requirements)
        validateVideoLimits(listing, "external");

        // Validate and determine video source type
        String videoSource = determineVideoSource(request.getUrl());
        
        // Create new media entity for external video
        ListingMedia videoMedia = new ListingMedia();
        videoMedia.setCarListing(listing);
        videoMedia.setMediaType("video");
        videoMedia.setVideoSource(videoSource);
        videoMedia.setExternalUrl(request.getUrl());
        videoMedia.setFileKey("external_" + videoSource + "_video_" + System.currentTimeMillis()); // Unique key for external videos
        videoMedia.setFileName(request.getTitle() != null ? request.getTitle() : videoSource.substring(0, 1).toUpperCase() + videoSource.substring(1) + " Video");
        videoMedia.setContentType("video/external");
        videoMedia.setSize(0L); // External videos don't have file size
        
        // Set duration if provided (AutoTrader limit: 3 minutes)
        if (request.getDurationSeconds() != null) {
            if (request.getDurationSeconds() > 180) {
                throw new RuntimeException("Video duration cannot exceed 3 minutes (180 seconds)");
            }
            videoMedia.setDurationSeconds(request.getDurationSeconds());
        }

        // Calculate sort order (videos typically come after images)
        int nextSortOrder = listing.getMedia().size();
        videoMedia.setSortOrder(nextSortOrder);
        
        // External videos are typically not primary unless it's the only media
        videoMedia.setIsPrimary(listing.getMedia().isEmpty());

        // Add to listing and save
        listing.addMedia(videoMedia);
        carListingRepository.save(listing);

        log.info("Successfully added external video to listing {}", listingId);

        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("id", videoMedia.getId());
        response.put("url", videoMedia.getExternalUrl());
        response.put("videoSource", videoMedia.getVideoSource());
        response.put("mediaType", videoMedia.getMediaType());
        response.put("sortOrder", videoMedia.getSortOrder());
        response.put("isPrimary", videoMedia.getIsPrimary());

        return ResponseEntity.ok(response);
    }

    /**
     * Remove external video from listing
     */
    @DeleteMapping("/external/{mediaId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Remove external video", 
               description = "Remove an external video URL from a car listing")
    public ResponseEntity<Map<String, String>> removeExternalVideo(
            @PathVariable Long listingId,
            @PathVariable Long mediaId,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Removing external video {} from listing {}", mediaId, listingId);

        // Get user from authentication
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // Get the listing and verify ownership
        CarListing listing = carListingRepository.findById(listingId)
            .orElseThrow(() -> new RuntimeException("Listing not found: " + listingId));

        if (!Objects.equals(listing.getSeller().getId(), user.getId())) {
            throw new RuntimeException("You can only remove videos from your own listings");
        }

        // Find and remove the media
        boolean removed = listing.getMedia().removeIf(media -> 
            Objects.equals(media.getId(), mediaId) && 
            "video".equals(media.getMediaType()) &&
            media.isExternalVideo()
        );

        if (!removed) {
            throw new RuntimeException("External video not found: " + mediaId);
        }

        carListingRepository.save(listing);

        Map<String, String> response = new HashMap<>();
        response.put("message", "External video removed successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Validates video limits per listing following the requirement:
     * - Maximum 1 uploaded video file
     * - Maximum 1 external video URL
     */
    private void validateVideoLimits(CarListing listing, String newVideoType) {
        long uploadedVideos = listing.getMedia().stream()
            .filter(media -> "video".equals(media.getMediaType()) && "upload".equals(media.getVideoSource()))
            .count();
        
        long externalVideos = listing.getMedia().stream()
            .filter(media -> "video".equals(media.getMediaType()) && media.isExternalVideo())
            .count();

        if ("upload".equals(newVideoType) && uploadedVideos >= 1) {
            throw new RuntimeException("Maximum 1 uploaded video per listing allowed");
        }
        
        if ("external".equals(newVideoType) && externalVideos >= 1) {
            throw new RuntimeException("Maximum 1 external video URL per listing allowed");
        }
    }

    /**
     * Determines the video source type based on URL pattern
     */
    private String determineVideoSource(String url) {
        if (url == null || url.trim().isEmpty()) {
            throw new RuntimeException("Video URL cannot be empty");
        }

        String normalizedUrl = url.trim().toLowerCase();
        
        if (YOUTUBE_URL_PATTERN.matcher(url).matches()) {
            return "youtube";
        } else if (VIMEO_URL_PATTERN.matcher(url).matches()) {
            return "vimeo";
        } else if (normalizedUrl.startsWith("http://") || normalizedUrl.startsWith("https://")) {
            return "external";
        } else {
            throw new RuntimeException("Invalid video URL format. Must be a valid YouTube, Vimeo, or other HTTPS URL.");
        }
    }

    /**
     * Request object for external video addition
     */
    public static class ExternalVideoRequest {
        private String url;
        private String title;
        private Integer durationSeconds;

        // Getters and setters
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public Integer getDurationSeconds() { return durationSeconds; }
        public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }
    }
}
