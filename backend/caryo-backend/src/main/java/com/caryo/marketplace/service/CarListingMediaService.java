package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.exception.StorageException;
import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.ListingMedia;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.repository.CarListingRepository;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.service.storage.StorageKeyGenerator;
import com.caryo.marketplace.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;

/**
 * Service responsible for media operations on car listings.
 * Handles uploading, managing, and deleting media files (images and videos).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarListingMediaService {

    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final StorageKeyGenerator storageKeyGenerator;

    /**
     * Upload an image for a car listing.
     */
    @Transactional
    public String uploadListingImage(Long listingId, MultipartFile file, String username) {
        return uploadListingMedia(listingId, file, username, "image");
    }

    /**
     * Upload video file to a car listing following AutoTrader patterns
     */
    @Transactional
    public String uploadListingVideo(Long listingId, MultipartFile file, String username) {
        return uploadListingMedia(listingId, file, username, "video");
    }

    /**
     * Generic method for uploading media (images or videos) to car listings
     */
    @Transactional
    public String uploadListingMedia(Long listingId, MultipartFile file, String username, String mediaType) {
        Objects.requireNonNull(listingId, "Listing ID cannot be null");
        Objects.requireNonNull(file, "File cannot be null");
        if (StringUtils.isBlank(username)) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        if (StringUtils.isBlank(mediaType) || (!mediaType.equals("image") && !mediaType.equals("video"))) {
            throw new IllegalArgumentException("Media type must be 'image' or 'video'");
        }

        log.info("Attempting to upload {} for listing ID: {} by user: {}", mediaType, listingId, username);
        User user = findUserByUsername(username);

        validateFile(file, listingId);

        CarListing listing = findListingById(listingId);

        authorizeListingModification(listing, user, "upload " + mediaType + " for");

        // Validate video limits if uploading video
        if ("video".equals(mediaType)) {
            validateVideoUploadLimits(listing);
        }

        String mediaKey = generateMediaKey(listingId, file.getOriginalFilename(), mediaType);

        try {
            storageService.store(file, mediaKey);

            // Create a new ListingMedia entity and link it to the car listing
            ListingMedia media = new ListingMedia();
            media.setCarListing(listing);
            media.setFileKey(mediaKey);
            media.setFileName(file.getOriginalFilename());
            media.setContentType(file.getContentType());
            media.setSize(file.getSize());

            // Calculate proper sort order
            int nextSortOrder = listing.getMedia().size();
            media.setSortOrder(nextSortOrder);
            media.setIsPrimary(listing.getMedia().isEmpty()); // First media is primary
            media.setMediaType(mediaType);

            // Set video-specific fields
            if ("video".equals(mediaType)) {
                media.setVideoSource("upload");
                // Duration will be set by frontend or external tools
            }

            // Add the media to the listing using helper method
            listing.addMedia(media);

            carListingRepository.save(listing); // Save the updated listing
            log.info("Successfully uploaded {} with key '{}' and updated listing ID: {}", mediaType, mediaKey, listingId);
            return mediaKey;
        } catch (StorageException e) {
            log.error("Storage service failed to store image for listing ID {}: {}. Error: {}", listingId, e.getMessage(), e.getCause() != null ? e.getCause().getMessage() : "N/A", e);
            // Re-throw the original StorageException to be handled by the controller or a global exception handler.
            // This preserves the specific details of the storage failure.
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error saving listing {} after image upload: {}", listingId, e.getMessage(), e);
            // Wrap other exceptions in a RuntimeException if they are not already.
            // Consider a more specific custom exception if appropriate for your error handling strategy.
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new RuntimeException("Failed to update listing after image upload.", e);
        }
    }

    /**
     * Delete all media files for a listing.
     * Used when deleting a listing.
     */
    @Transactional
    public void deleteListingMedia(Long listingId) {
        log.info("Deleting all media for listing ID: {}", listingId);

        CarListing listing = findListingById(listingId);

        if (listing.getMedia() != null && !listing.getMedia().isEmpty()) {
            for (ListingMedia media : listing.getMedia()) {
                try {
                    storageService.delete(media.getFileKey());
                    log.info("Deleted media with key: {} for listing ID: {}", media.getFileKey(), listingId);
                } catch (StorageException e) {
                    // Log but continue with listing deletion
                    log.error("Failed to delete media with key: {} for listing ID: {}", media.getFileKey(), listingId, e);
                }
            }
        }
    }

    // Helper methods

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User lookup failed for username: {}", username);
                    return new ResourceNotFoundException("User", "username", username);
                });
    }

    private CarListing findListingById(Long listingId) {
        return carListingRepository.findById(listingId)
                .orElseThrow(() -> {
                    log.warn("CarListing lookup failed for ID: {}", listingId);
                    return new ResourceNotFoundException("CarListing", "id", listingId);
                });
    }

    private void validateFile(MultipartFile file, Long listingId) {
        if (file == null || file.isEmpty()) {
            log.warn("Attempt to upload null or empty file for listing ID: {}", listingId);
            throw new StorageException("File provided for upload is null or empty.");
        }
        // Add other validations if needed (e.g., file type, size)
    }

    private void authorizeListingModification(CarListing listing, User user, String action) {
        if (listing.getSeller() == null || !listing.getSeller().getId().equals(user.getId())) {
            log.warn("Authorization failed: User '{}' (ID: {}) attempted to {} listing ID {} owned by '{}' (ID: {})",
                     user.getUsername(), user.getId(), action, listing.getId(),
                     listing.getSeller() != null ? listing.getSeller().getUsername() : "unknown",
                     listing.getSeller() != null ? listing.getSeller().getId() : "unknown");
            throw new SecurityException("User does not have permission to modify this listing.");
        }
    }

    private String generateMediaKey(Long listingId, String originalFilename, String mediaType) {
        return storageKeyGenerator.generateListingMediaKey(listingId, originalFilename);
    }

    private void validateVideoUploadLimits(CarListing listing) {
        long uploadedVideos = listing.getMedia().stream()
            .filter(media -> "video".equals(media.getMediaType()) && "upload".equals(media.getVideoSource()))
            .count();

        if (uploadedVideos >= 1) {
            throw new IllegalArgumentException("Maximum 1 uploaded video per listing allowed. Following best practices.");
        }
    }
}
