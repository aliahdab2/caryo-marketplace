package com.autotrader.autotraderbackend.payload.request;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;

/**
 * Request DTO for creating a new car brand with its first model atomically
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateBrandWithModelRequest {
    
    @Valid
    @NotNull(message = "Brand details are required")
    private BrandDetails brand;
    
    @Valid
    @NotNull(message = "Model details are required")
    private ModelDetails model;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BrandDetails {
        @NotBlank(message = "Brand name is required")
        @Size(max = 50, message = "Brand name must not exceed 50 characters")
        private String name;
        
        @NotBlank(message = "English display name is required")
        @Size(max = 100, message = "English display name must not exceed 100 characters")
        private String displayNameEn;
        
        @NotBlank(message = "Arabic display name is required")
        @Size(max = 100, message = "Arabic display name must not exceed 100 characters")
        private String displayNameAr;
        
        @NotNull(message = "Active status is required")
        private Boolean isActive = true;
    }
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelDetails {
        @NotBlank(message = "Model name is required")
        @Size(max = 50, message = "Model name must not exceed 50 characters")
        private String name;
        
        @NotBlank(message = "English display name is required")
        @Size(max = 100, message = "English display name must not exceed 100 characters")
        private String displayNameEn;
        
        @NotBlank(message = "Arabic display name is required")
        @Size(max = 100, message = "Arabic display name must not exceed 100 characters")
        private String displayNameAr;
        
        @NotNull(message = "Active status is required")
        private Boolean isActive = true;
    }
    
    @Override
    public String toString() {
        return "CreateBrandWithModelRequest{" +
                "brand=" + (brand != null ? brand.getName() : "null") +
                ", model=" + (model != null ? model.getName() : "null") +
                '}';
    }
}
