package com.autotrader.autotraderbackend.payload.response;

import com.autotrader.autotraderbackend.model.Location;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for Location information
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class LocationResponse {
    private Long id;
    private String displayNameEn; // Changed from nameEn to match controller expectations
    private String displayNameAr; // Changed from nameAr to match controller expectations
    private String slug;
    private String countryCode;
    private String region;
    private Double latitude;
    private Double longitude;
    private boolean active; // Added active field
    
    /**
     * Create a LocationResponse from a Location entity
     * @param location The location entity
     * @return A new LocationResponse
     */
    public static LocationResponse fromEntity(Location location) {
        if (location == null) {
            return null;
        }
        
        return new LocationResponse(
                location.getId(),
                location.getDisplayNameEn(),
                location.getDisplayNameAr(),
                location.getSlug(),
                location.getCountryCode(),
                location.getRegion(),
                location.getLatitude(),
                location.getLongitude(),
                location.getIsActive() != null ? location.getIsActive() : true // Using getIsActive() with null check
        );
    }
}
