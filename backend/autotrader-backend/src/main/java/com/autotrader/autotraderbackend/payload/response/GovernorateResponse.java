package com.autotrader.autotraderbackend.payload.response;

import com.autotrader.autotraderbackend.model.Governorate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GovernorateResponse {
    private Long id;
    private String displayNameEn;
    private String displayNameAr;
    private String slug;
    private Long countryId; // Changed from countryCode
    private String countryCode; // Added to maintain backward compatibility
    private String countryNameEn; // Added
    private String countryNameAr; // Added
    private String region;
    private Double latitude;
    private Double longitude;
    
    /**
     * Factory method to create a GovernorateResponse from a Governorate entity
     * 
     * @param governorate the Governorate entity
     * @return a new GovernorateResponse, or null if the input is null
     */
    public static GovernorateResponse fromEntity(Governorate governorate) {
        if (governorate == null) {
            return null;
        }
        
        GovernorateResponse response = new GovernorateResponse();
        response.setId(governorate.getId());
        response.setDisplayNameEn(governorate.getDisplayNameEn());
        response.setDisplayNameAr(governorate.getDisplayNameAr());
        response.setSlug(governorate.getSlug());
        response.setRegion(governorate.getRegion());
        response.setLatitude(governorate.getLatitude());
        response.setLongitude(governorate.getLongitude());
        
        // Set country information
        if (governorate.getCountry() != null) {
            response.setCountryId(governorate.getCountry().getId());
            response.setCountryCode(governorate.getCountry().getCountryCode());
            response.setCountryNameEn(governorate.getCountry().getDisplayNameEn());
            response.setCountryNameAr(governorate.getCountry().getDisplayNameAr());
        }
        
        return response;
    }
}
