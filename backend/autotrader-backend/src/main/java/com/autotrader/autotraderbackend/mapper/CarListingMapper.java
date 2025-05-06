package com.autotrader.autotraderbackend.mapper;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CarListingMapper {

    private final StorageService storageService;
    private static final long SIGNED_URL_EXPIRATION_SECONDS = 3600; // 1 hour

    /**
     * Converts a CarListing entity to a CarListingResponse DTO.
     * Handles fetching the signed URL for the image if an image key exists.
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
        
        // Use only locationEntity
        if (carListing.getLocationEntity() != null) {
            response.setLocationDetails(LocationResponse.fromEntity(carListing.getLocationEntity()));
        }
        // If locationEntity is null, locationDetails will be null (handled by fromEntity)
        // and the legacy response.setLocation() is not set.
        
        response.setCreatedAt(carListing.getCreatedAt());
        response.setApproved(carListing.getApproved());

        if (carListing.getSeller() != null) {
            response.setSellerId(carListing.getSeller().getId());
            response.setSellerUsername(carListing.getSeller().getUsername());
        } else {
             log.warn("CarListing with ID {} has a null seller.", carListing.getId());
        }

        // Generate signed URL if image key exists
        String signedImageUrl = generateSignedUrl(carListing.getId(), carListing.getImageKey());
        response.setImageUrl(signedImageUrl);

        return response;
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
