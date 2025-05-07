package com.autotrader.autotraderbackend.mapper;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.ListingMediaResponse;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class CarListingMapper {

    private final StorageService storageService;
    private static final long SIGNED_URL_EXPIRATION_SECONDS = 3600; // 1 hour

    /**
     * Converts a CarListing entity to a CarListingResponse DTO.
     * Maps all media items from the listing to the response and handles fetching
     * signed URLs for each media item.
     *
     * @param carListing The CarListing entity.
     * @return The corresponding CarListingResponse DTO.
     */
    public CarListingResponse toCarListingResponse(CarListing carListing) {
        if (carListing == null) {
            log.warn("Attempted to map a null CarListing entity.");
            return null;
        }

        CarListingResponse response = new CarListingResponse();
        response.setId(carListing.getId());
        response.setTitle(carListing.getTitle());
        response.setBrand(carListing.getBrand());
        response.setModel(carListing.getModel());
        response.setModelYear(carListing.getModelYear());
        response.setPrice(carListing.getPrice());
        response.setMileage(carListing.getMileage());
        response.setDescription(carListing.getDescription());
        
        // Use location
        if (carListing.getLocation() != null) {
            response.setLocationDetails(LocationResponse.fromEntity(carListing.getLocation()));
        }
        // If location is null, locationDetails will be null (handled by fromEntity)
        // and the legacy response.setLocation() is not set.
        
        response.setCreatedAt(carListing.getCreatedAt());
        response.setApproved(carListing.getApproved());

        if (carListing.getSeller() != null) {
            response.setSellerId(carListing.getSeller().getId());
            response.setSellerUsername(carListing.getSeller().getUsername());
        } else {
            log.warn("CarListing with ID {} has a null seller.", carListing.getId());
        }

        // Map all media items
        List<ListingMediaResponse> mediaResponses = mapListingMedia(carListing);
        response.setMedia(mediaResponses);

        return response;
    }
    
    /**
     * Maps all media items from a car listing to ListingMediaResponse DTOs.
     * Handles generating signed URLs for each media item.
     *
     * @param carListing The car listing containing media items.
     * @return List of ListingMediaResponse DTOs, sorted by sortOrder.
     */
    private List<ListingMediaResponse> mapListingMedia(CarListing carListing) {
        if (carListing == null || carListing.getMedia() == null || carListing.getMedia().isEmpty()) {
            return new ArrayList<>();
        }
        
        return carListing.getMedia().stream()
            .map(media -> mapSingleMedia(carListing.getId(), media))
            .sorted(Comparator.comparing(ListingMediaResponse::getSortOrder))
            .collect(Collectors.toList());
    }
    
    /**
     * Maps a single media item to a ListingMediaResponse DTO.
     *
     * @param listingId The ID of the associated car listing.
     * @param media The media entity to map.
     * @return The corresponding ListingMediaResponse DTO.
     */
    private ListingMediaResponse mapSingleMedia(Long listingId, com.autotrader.autotraderbackend.model.ListingMedia media) {
        ListingMediaResponse mediaResponse = new ListingMediaResponse();
        mediaResponse.setId(media.getId());
        mediaResponse.setFileKey(media.getFileKey());
        mediaResponse.setFileName(media.getFileName());
        mediaResponse.setContentType(media.getContentType());
        mediaResponse.setSize(media.getSize());
        mediaResponse.setSortOrder(media.getSortOrder());
        mediaResponse.setIsPrimary(media.getIsPrimary());
        mediaResponse.setMediaType(media.getMediaType());
        
        // Generate signed URL for this media item
        String signedUrl = generateSignedUrl(listingId, media.getFileKey());
        mediaResponse.setUrl(signedUrl);
        
        return mediaResponse;
    }

    /**
     * Generates a signed URL for a given image key.
     * Handles potential errors during URL generation gracefully.
     *
     * @param listingId The ID of the listing (for logging).
     * @param imageKey The key of the image in storage.
     * @return The signed URL, or null if generation fails or no key is provided.
     */
    private String generateSignedUrl(Long listingId, String imageKey) {
        if (imageKey == null || imageKey.isBlank()) {
             log.debug("No image key provided for listing ID {}. Skipping signed URL generation.", listingId);
            return null;
        }

        try {
            String signedUrl = storageService.getSignedUrl(imageKey, SIGNED_URL_EXPIRATION_SECONDS);
            log.debug("Generated signed URL for listing ID {}: {}", listingId, signedUrl != null ? "[URL Present]" : "[URL Null]"); // Avoid logging the full URL potentially
            return signedUrl;
        } catch (UnsupportedOperationException e) {
            log.warn("Storage service does not support signed URLs. Cannot generate for listing ID {}.", listingId);
            return null; // Return null if not supported
        } catch (Exception e) {
            log.error("Error generating signed URL for listing ID {} with key '{}': {}", listingId, imageKey, e.getMessage(), e);
            return null; // Return null on other errors
        }
    }
}
