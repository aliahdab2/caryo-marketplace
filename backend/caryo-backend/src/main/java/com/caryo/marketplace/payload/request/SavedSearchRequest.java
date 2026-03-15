package com.caryo.marketplace.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

/**
 * Request DTO for creating or updating a saved search
 */
@Data
public class SavedSearchRequest {

    @NotBlank(message = "Search name (English) is required")
    @Size(max = 255, message = "Search name (English) cannot exceed 255 characters")
    private String nameEn;

    @Size(max = 255, message = "Search name (Arabic) cannot exceed 255 characters")
    private String nameAr;

    @NotNull(message = "Filters are required")
    private Map<String, Object> filters;

    @NotNull(message = "Notification preferences are required")
    private Map<String, Object> notificationPreferences;

    private Boolean isActive = true;
}
