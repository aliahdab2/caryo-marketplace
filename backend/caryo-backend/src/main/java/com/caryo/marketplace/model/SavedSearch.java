package com.caryo.marketplace.model;

import com.caryo.marketplace.converter.JsonMapConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Entity representing a saved search with filter criteria and notification preferences
 */
@Entity
@Table(name = "saved_searches")
@Getter
@Setter
@NoArgsConstructor
public class SavedSearch {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @NotBlank
    @Size(max = 255)
    @Column(name = "name_en", nullable = false, length = 255)
    private String nameEn;

    @Size(max = 255)
    @Column(name = "name_ar", length = 255)
    private String nameAr;

    /**
     * Search filters stored as JSON using AttributeConverter for H2/PostgreSQL compatibility
     * Expected structure:
     * {
     *   "brandSlugs": ["toyota", "honda"],
     *   "modelSlugs": ["camry", "civic"],
     *   "minPrice": 10000,
     *   "maxPrice": 50000,
     *   "minYear": 2020,
     *   "maxYear": 2024,
     *   "governorateIds": [1, 2],
     *   "location": {
     *     "lat": 33.8547,
     *     "lng": 35.8623,
     *     "radiusKm": 50
     *   },
     *   "bodyTypes": ["sedan", "suv"],
     *   "fuelTypes": ["gasoline", "hybrid"],
     *   "transmission": "automatic",
     *   "minMileage": 0,
     *   "maxMileage": 100000
     * }
     */
    @Convert(converter = JsonMapConverter.class)
    @Column(name = "filters", nullable = false, columnDefinition = "TEXT")
    private Map<String, Object> filters;

    /**
     * Notification preferences stored as JSON using AttributeConverter for H2/PostgreSQL compatibility
     * Expected structure:
     * {
     *   "email": true,
     *   "frequency": "immediate" | "daily" | "weekly"
     * }
     */
    @Convert(converter = JsonMapConverter.class)
    @Column(name = "notification_preferences", nullable = false, columnDefinition = "TEXT")
    private Map<String, Object> notificationPreferences;

    @Column(name = "last_notified_at")
    private LocalDateTime lastNotifiedAt;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Normalized search query hash for easy duplicate detection
     * Example: "brand=toyota&model=camry&minPrice=10000&maxPrice=50000"
     */
    @Column(name = "search_query_hash", length = 500)
    private String searchQueryHash;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Constructor for creating a new saved search
     */
    public SavedSearch(User user, String nameEn, String nameAr, Map<String, Object> filters,
                      Map<String, Object> notificationPreferences) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (filters == null || filters.isEmpty()) {
            throw new IllegalArgumentException("Filters cannot be null or empty");
        }

        this.user = user;
        this.nameEn = nameEn;
        this.nameAr = nameAr;
        this.filters = filters;
        this.notificationPreferences = notificationPreferences != null ? notificationPreferences : Map.of("email", true, "frequency", "immediate");
        this.isActive = true;
    }

    /**
     * Helper method to check if email notifications are enabled
     */
    public boolean isEmailNotificationEnabled() {
        if (notificationPreferences == null) {
            return true; // Default to enabled
        }
        return Boolean.TRUE.equals(notificationPreferences.get("email"));
    }

    /**
     * Helper method to get notification frequency
     */
    public String getNotificationFrequency() {
        if (notificationPreferences == null) {
            return "immediate"; // Default frequency
        }
        Object frequency = notificationPreferences.get("frequency");
        return frequency instanceof String ? (String) frequency : "immediate";
    }
}
