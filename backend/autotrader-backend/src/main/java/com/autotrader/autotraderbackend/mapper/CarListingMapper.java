package com.autotrader.autotraderbackend.mapper;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.GovernorateResponse;
import com.autotrader.autotraderbackend.payload.response.ListingMediaResponse;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.payload.response.SellerTypeResponse;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
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
        if (Objects.isNull(carListing)) {
            log.warn("Attempted to map a null CarListing entity.");
            return null;
        }

        try {
            CarListingResponse response = new CarListingResponse();
            response.setId(carListing.getId());
            response.setTitle(carListing.getTitle());
            response.setModelYear(carListing.getModelYear());
            response.setPrice(carListing.getPrice());
            response.setCurrency(carListing.getCurrency());
            response.setMileage(carListing.getMileage());
            response.setDescription(carListing.getDescription());
            
            // Set denormalized brand and model name fields
            response.setBrandNameEn(carListing.getBrandNameEn());
            response.setBrandNameAr(carListing.getBrandNameAr());
            response.setModelNameEn(carListing.getModelNameEn());
            response.setModelNameAr(carListing.getModelNameAr());
            
            // Set denormalized governorate name fields
            response.setGovernorateNameEn(carListing.getGovernorateNameEn());
            response.setGovernorateNameAr(carListing.getGovernorateNameAr());
            
            // Use location
            if (Objects.nonNull(carListing.getLocation())) {
                response.setLocationDetails(LocationResponse.fromEntity(carListing.getLocation()));
            }
            
            // Use governorate
            if (Objects.nonNull(carListing.getGovernorate())) {
                response.setGovernorateDetails(GovernorateResponse.fromEntity(carListing.getGovernorate()));
            }

            response.setCreatedAt(carListing.getCreatedAt());
            // Ensure approved is properly set (never null)
            response.setApproved(Objects.nonNull(carListing.getApproved()) ? carListing.getApproved() : false);

            response.setIsSold(carListing.getSold());
            response.setIsArchived(carListing.getArchived());
            response.setIsExpired(carListing.getExpired());

            if (Objects.nonNull(carListing.getSeller())) {
                response.setSellerId(carListing.getSeller().getId());
                response.setSellerUsername(carListing.getSeller().getUsername());
                
                // Add seller type information
                if (Objects.nonNull(carListing.getSeller().getSellerType())) {
                    response.setSellerType(SellerTypeResponse.fromEntity(carListing.getSeller().getSellerType()));
                }
            } else {
                log.warn("CarListing with ID {} has a null seller.", carListing.getId());
            }

            // Map all media items with error handling
            try {
                List<ListingMediaResponse> mediaResponses = mapListingMedia(carListing);
                response.setMedia(mediaResponses);
            } catch (Exception e) {
                log.error("Error mapping media for listing ID {}: {}", carListing.getId(), e.getMessage(), e);
                response.setMedia(new ArrayList<>()); // Set empty list on error
            }

            return response;
        } catch (Exception e) {
            log.error("Error mapping CarListing with ID {}: {}", carListing.getId(), e.getMessage(), e);
            // Create minimal response with essential fields to avoid complete failure
            CarListingResponse fallbackResponse = new CarListingResponse();
            fallbackResponse.setId(carListing.getId());
            fallbackResponse.setIsSold(carListing.getSold());
            fallbackResponse.setIsArchived(carListing.getArchived());
            fallbackResponse.setIsExpired(carListing.getExpired());
            // Ensure approved is properly set in fallback response
            fallbackResponse.setApproved(Objects.nonNull(carListing.getApproved()) ? carListing.getApproved() : false);
            fallbackResponse.setMedia(new ArrayList<>());
            return fallbackResponse;
        }
    }
    
    /**
     * Converts a CarListing entity to a CarListingResponse DTO specifically for admin operations.
     * This method is more defensive and will never throw exceptions to ensure admin operations
     * don't fail even if there are issues with media or other related entities.
     *
     * @param carListing The CarListing entity.
     * @return The corresponding CarListingResponse DTO.
     */
    public CarListingResponse toCarListingResponseForAdmin(CarListing carListing) {
        if (Objects.isNull(carListing)) {
            log.warn("Attempted to map a null CarListing entity for admin operation.");
            return null;
        }

        try {
            CarListingResponse response = new CarListingResponse();
            response.setId(carListing.getId());
            
            // Set basic fields with null checks
            try { response.setTitle(carListing.getTitle()); } 
            catch (Exception e) { log.warn("Error setting title for listing ID {}", carListing.getId()); }
            
            try { 
                // Use denormalized brand and model name fields
                response.setBrandNameEn(carListing.getBrandNameEn());
                response.setBrandNameAr(carListing.getBrandNameAr());
                response.setModelNameEn(carListing.getModelNameEn());
                response.setModelNameAr(carListing.getModelNameAr());
            } 
            catch (Exception e) { log.warn("Error setting brand/model names for listing ID {}", carListing.getId()); }
            
            try { response.setModelYear(carListing.getModelYear()); } 
            catch (Exception e) { log.warn("Error setting modelYear for listing ID {}", carListing.getId()); }
            
            try { response.setPrice(carListing.getPrice()); } 
            catch (Exception e) { log.warn("Error setting price for listing ID {}", carListing.getId()); }
            
            try { response.setCurrency(carListing.getCurrency()); } 
            catch (Exception e) { log.warn("Error setting currency for listing ID {}", carListing.getId()); }
            
            try { response.setMileage(carListing.getMileage()); } 
            catch (Exception e) { log.warn("Error setting mileage for listing ID {}", carListing.getId()); }
            
            try { response.setDescription(carListing.getDescription()); } 
            catch (Exception e) { log.warn("Error setting description for listing ID {}", carListing.getId()); }
            
            // Set location safely
            try {
                if (Objects.nonNull(carListing.getLocation())) {
                    response.setLocationDetails(LocationResponse.fromEntity(carListing.getLocation()));
                }
            } catch (Exception e) {
                log.warn("Error setting location for listing ID {}", carListing.getId());
            }
            
            try { response.setCreatedAt(carListing.getCreatedAt()); } 
            catch (Exception e) { log.warn("Error setting createdAt for listing ID {}", carListing.getId()); }
            
            try { response.setApproved(carListing.getApproved()); } 
            catch (Exception e) { log.warn("Error setting approved for listing ID {}", carListing.getId()); }

            // Important status fields - with default values if exceptions occur
            try { 
                response.setIsSold(carListing.getSold()); 
            } catch (Exception e) { 
                log.warn("Error setting isSold for listing ID {}, defaulting to false", carListing.getId());
                response.setIsSold(false);
            }
            
            try { 
                response.setIsArchived(carListing.getArchived()); 
            } catch (Exception e) { 
                log.warn("Error setting isArchived for listing ID {}, defaulting to false", carListing.getId());
                response.setIsArchived(false);
            }
            
            try { 
                response.setIsExpired(carListing.getExpired()); 
            } catch (Exception e) { 
                log.warn("Error setting isExpired for listing ID {}, defaulting to false", carListing.getId());
                response.setIsExpired(false);
            }

            // Set seller info safely
            try {
                if (Objects.nonNull(carListing.getSeller())) {
                    response.setSellerId(carListing.getSeller().getId());
                    response.setSellerUsername(carListing.getSeller().getUsername());
                }
            } catch (Exception e) {
                log.warn("Error setting seller info for listing ID {}", carListing.getId());
            }

            // Set media with empty list on error
            try {
                if (Objects.nonNull(carListing.getMedia()) && !carListing.getMedia().isEmpty()) {
                    response.setMedia(mapListingMediaSafely(carListing));
                } else {
                    response.setMedia(new ArrayList<>());
                }
            } catch (Exception e) {
                log.warn("Error mapping media for listing ID {}, using empty list", carListing.getId());
                response.setMedia(new ArrayList<>());
            }

            return response;
        } catch (Exception e) {
            log.error("Error creating response for listing ID {}: {}", 
                    carListing.getId(), e.getMessage(), e);
            
            // Return minimal response with just ID and status fields to avoid complete failure
            CarListingResponse fallback = new CarListingResponse();
            fallback.setId(carListing.getId());
            
            try {
                fallback.setIsSold(carListing.getSold());
            } catch (Exception ex) {
                fallback.setIsSold(false);
            }
            
            try {
                fallback.setIsArchived(carListing.getArchived());
            } catch (Exception ex) {
                fallback.setIsArchived(false);
            }
            
            try {
                fallback.setIsExpired(carListing.getExpired());
            } catch (Exception ex) {
                fallback.setIsExpired(false);
            }
            
            // Ensure approved is properly set in fallback response
            try {
                fallback.setApproved(Objects.nonNull(carListing.getApproved()) ? carListing.getApproved() : false);
            } catch (Exception ex) {
                fallback.setApproved(false);
                log.warn("Error setting approved for listing ID {} in fallback, defaulting to false", carListing.getId());
            }
            
            fallback.setMedia(new ArrayList<>());
            return fallback;
        }
    }
    
    /**
     * Maps all media items from a car listing to ListingMediaResponse DTOs.
     * Handles generating signed URLs for each media item.
     *
     * @param carListing The car listing containing media items.
     * @return List of ListingMediaResponse DTOs, sorted by sortOrder.
     */
    private List<ListingMediaResponse> mapListingMedia(CarListing carListing) {
        if (Objects.isNull(carListing) || Objects.isNull(carListing.getMedia()) || carListing.getMedia().isEmpty()) {
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
        if (StringUtils.isBlank(imageKey)) {
             log.debug("No image key provided for listing ID {}. Skipping signed URL generation.", listingId);
            return null;
        }

        try {
            String signedUrl = storageService.getSignedUrl(imageKey, SIGNED_URL_EXPIRATION_SECONDS);
            log.debug("Generated signed URL for listing ID {}: {}", listingId, Objects.nonNull(signedUrl) ? "[URL Present]" : "[URL Null]"); // Avoid logging the full URL potentially
            return signedUrl;
        } catch (UnsupportedOperationException e) {
            log.warn("Storage service does not support signed URLs. Cannot generate for listing ID {}.", listingId);
            return null; // Return null if not supported
        } catch (Exception e) {
            log.error("Error generating signed URL for listing ID {} with key \'{}\': {}", listingId, imageKey, e.getMessage(), e);
            return null; // Return null on other errors
        }
    }
    
    /**
     * Safely maps a list of media items, ensuring no exceptions are thrown that could disrupt
     * the admin endpoints. If any errors occur during mapping, they are logged but will not
     * cause the entire mapping operation to fail.
     *
     * @param carListing The car listing containing media items.
     * @return List of ListingMediaResponse DTOs, or empty list if mapping fails.
     */
    private List<ListingMediaResponse> mapListingMediaSafely(CarListing carListing) {
        if (Objects.isNull(carListing) || Objects.isNull(carListing.getMedia())) {
            return new ArrayList<>();
        }
        
        try {
            return mapListingMedia(carListing);
        } catch (Exception e) {
            log.error("Error mapping media for listing ID {}: {}", carListing.getId(), e.getMessage(), e);
            return new ArrayList<>(); // Return empty list on error
        }
    }
}
