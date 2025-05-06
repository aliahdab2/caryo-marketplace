package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    
    @NotBlank(message = "Country code is required")
    @Pattern(regexp = "^[A-Z]{2}$", message = "Country code must be 2 uppercase letters (ISO 3166-1 alpha-2)")
    private String countryCode;
    
    @Size(max = 100, message = "Region must be less than 100 characters")
    private String region;
    
    private Double latitude;
    
    private Double longitude;
    
    private Boolean active = true;
}
