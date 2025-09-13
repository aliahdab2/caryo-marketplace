package com.autotrader.autotraderbackend.payload.request;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating new car model
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateModelRequest {
    
    @NotBlank(message = "Model name is required")
    @Size(max = 50, message = "Model name must not exceed 50 characters")
    private String name;
    
    @NotBlank(message = "English display name is required")
    @Size(max = 100, message = "English display name must not exceed 100 characters")
    private String displayNameEn;
    
    @NotBlank(message = "Arabic display name is required")
    @Size(max = 100, message = "Arabic display name must not exceed 100 characters")
    private String displayNameAr;
    
    @NotNull(message = "Brand ID is required")
    private Long brandId;
    
    @NotNull(message = "Active status is required")
    private Boolean isActive = true; // Default to active
    
    @Override
    public String toString() {
        return "CreateModelRequest{" +
                "name='" + name + '\'' +
                ", displayNameEn='" + displayNameEn + '\'' +
                ", displayNameAr='" + displayNameAr + '\'' +
                ", brandId=" + brandId +
                ", isActive=" + isActive +
                '}';
    }
}
