package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for creating or updating locations
 */
@Data
public class LocationRequest {
    
    @NotBlank(message = "English name is required")
    @Size(min = 2, max = 100, message = "English name must be between 2 and 100 characters")
    private String nameEn;
    
    @NotBlank(message = "Arabic name is required")
    @Size(min = 2, max = 100, message = "Arabic name must be between 2 and 100 characters")
    private String nameAr;
    
    // Replace countryCode with governorateId
    @NotNull(message = "Governorate ID is required")
    private Long governorateId;
    
    @Size(max = 100, message = "Region must be less than 100 characters")
    private String region;
    
    private Double latitude;
    
    private Double longitude;
    
    private Boolean active = true;
}
