package com.caryo.marketplace.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for updating an existing car model
 */
@Data
public class UpdateCarModelRequest {

    @NotNull(message = "Brand ID is required")
    private Long brandId;

    @NotBlank(message = "English model name is required")
    @Size(min = 1, max = 100, message = "English model name must be between 1 and 100 characters")
    private String nameEn;

    @Size(max = 100, message = "Arabic model name cannot exceed 100 characters")
    private String nameAr;

    private String slug;

    private boolean active;
}
