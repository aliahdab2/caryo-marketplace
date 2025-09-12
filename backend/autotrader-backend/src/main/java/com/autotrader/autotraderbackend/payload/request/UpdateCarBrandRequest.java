package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for updating an existing car brand
 */
@Data
public class UpdateCarBrandRequest {

    @NotBlank(message = "Brand name is required")
    @Size(min = 2, max = 100, message = "Brand name must be between 2 and 100 characters")
    private String name;

    @Size(max = 100, message = "English display name cannot exceed 100 characters")
    private String displayNameEn;

    @Size(max = 100, message = "Arabic display name cannot exceed 100 characters")
    private String displayNameAr;

    private String slug;

    private boolean active;
}
