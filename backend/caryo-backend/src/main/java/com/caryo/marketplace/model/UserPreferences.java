package com.caryo.marketplace.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Per-user notification and privacy preferences (dashboard settings page).
 * Users without a row use the column defaults, which mirror the previous
 * hardcoded UI defaults.
 */
@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    // Notification settings
    @Column(name = "email_notifications", nullable = false)
    private boolean emailNotifications = true;

    @Column(name = "push_notifications", nullable = false)
    private boolean pushNotifications = false;

    @Column(name = "new_messages", nullable = false)
    private boolean newMessages = true;

    @Column(name = "listing_expiry", nullable = false)
    private boolean listingExpiry = true;

    @Column(name = "price_drops", nullable = false)
    private boolean priceDrops = false;

    @Column(name = "newsletter", nullable = false)
    private boolean newsletter = true;

    @Column(name = "marketing", nullable = false)
    private boolean marketing = false;

    // Privacy settings
    @Column(name = "show_phone", nullable = false)
    private boolean showPhone = false;

    @Column(name = "show_email", nullable = false)
    private boolean showEmail = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
