package com.autotrader.autotraderbackend.payload.request;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for updating car brand information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBrandRequest {
    
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
    private Boolean isActive;
    
    @Override
    public String toString() {
        return "UpdateBrandRequest{" +
                "name='" + name + '\'' +
                ", displayNameEn='" + displayNameEn + '\'' +
                ", displayNameAr='" + displayNameAr + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
