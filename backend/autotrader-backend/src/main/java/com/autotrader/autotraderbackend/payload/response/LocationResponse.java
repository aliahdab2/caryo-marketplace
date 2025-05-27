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
    private String countryCode; // Derived from governorate.country.countryCode
    private Long governorateId; // Added
    private String governorateNameEn; // Added 
    private String governorateNameAr; // Added
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
        
        LocationResponse response = new LocationResponse();
        response.setId(location.getId());
        response.setDisplayNameEn(location.getDisplayNameEn());
        response.setDisplayNameAr(location.getDisplayNameAr());
        response.setSlug(location.getSlug());
        response.setRegion(location.getRegion());
        response.setLatitude(location.getLatitude());
        response.setLongitude(location.getLongitude());
        response.setActive(location.getIsActive() != null ? location.getIsActive() : true);
        
        // Set governorate and country information
        if (location.getGovernorate() != null) {
            response.setGovernorateId(location.getGovernorate().getId());
            response.setGovernorateNameEn(location.getGovernorate().getDisplayNameEn());
            response.setGovernorateNameAr(location.getGovernorate().getDisplayNameAr());
            
            if (location.getGovernorate().getCountry() != null) {
                response.setCountryCode(location.getGovernorate().getCountry().getCountryCode());
            }
        }
        
        return response;
    }
}
