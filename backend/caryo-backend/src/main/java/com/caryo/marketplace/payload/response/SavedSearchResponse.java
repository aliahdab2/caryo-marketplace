package com.caryo.marketplace.payload.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for saved search information
 */
@Data
public class SavedSearchResponse {

    private UUID id;
    private String nameEn;
    private String nameAr;
    private Map<String, Object> filters;
    private Map<String, Object> notificationPreferences;
    private LocalDateTime lastNotifiedAt;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer matchCount; // Optional: number of current matches
    private Boolean wasUpdated; // Indicates if this was an update vs create operation
}
