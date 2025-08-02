package com.autotrader.autotraderbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a notification sent for a saved search to track duplicates
 */
@Entity
@Table(name = "saved_search_notifications")
@Getter
@Setter
@NoArgsConstructor
public class SavedSearchNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_search_id", nullable = false)
    @JsonIgnore
    private SavedSearch savedSearch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    @JsonIgnore
    private CarListing listing;

    @NotNull
    @Column(name = "notified_at", nullable = false)
    private LocalDateTime notifiedAt;

    @PrePersist
    protected void onCreate() {
        if (notifiedAt == null) {
            notifiedAt = LocalDateTime.now();
        }
    }

    /**
     * Constructor for creating a new notification record
     */
    public SavedSearchNotification(SavedSearch savedSearch, CarListing listing) {
        this.savedSearch = savedSearch;
        this.listing = listing;
        this.notifiedAt = LocalDateTime.now();
    }
}
