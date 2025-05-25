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
    private String countryCode;
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
        
        return GovernorateResponse.builder()
                .id(governorate.getId())
                .displayNameEn(governorate.getDisplayNameEn())
                .displayNameAr(governorate.getDisplayNameAr())
                .slug(governorate.getSlug())
                .countryCode(governorate.getCountryCode())
                .region(governorate.getRegion())
                .latitude(governorate.getLatitude())
                .longitude(governorate.getLongitude())
                .build();
    }
}
