package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dealers", indexes = {
    @Index(name = "idx_dealer_user_id", columnList = "user_id", unique = true),
    @Index(name = "idx_dealer_business_name", columnList = "business_name"),
    @Index(name = "idx_dealer_vat_number", columnList = "vat_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dealer {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "dealer_seq")
    @SequenceGenerator(name = "dealer_seq", sequenceName = "dealer_id_seq", allocationSize = 1)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @NotBlank(message = "Business name is required")
    @Size(min = 2, max = 100, message = "Business name must be between 2 and 100 characters")
    @Column(name = "business_name", nullable = false, length = 100)
    private String businessName;

    @Size(max = 50, message = "VAT number must not exceed 50 characters")
    @Column(name = "vat_number", length = 50, unique = true)
    private String vatNumber;

    @Size(max = 255, message = "Trading address must not exceed 255 characters")
    @Column(name = "trading_address", length = 255)
    private String tradingAddress;

    @Email(message = "Business email must be valid")
    @Size(max = 50, message = "Business email must not exceed 50 characters")
    @Column(name = "business_email", length = 50, unique = true)
    private String businessEmail;

    @Size(max = 20, message = "Business phone must not exceed 20 characters")
    @Column(name = "business_phone", length = 20)
    private String businessPhone;

    @Size(max = 255, message = "Logo URL must not exceed 255 characters")
    @Column(name = "logo_url", length = 255)
    private String logoUrl;

    @Size(max = 255, message = "Banner URL must not exceed 255 characters")
    @Column(name = "banner_url", length = 255)
    private String bannerUrl;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "description_ar", columnDefinition = "text")
    private String descriptionAr;

    // Store JSON data as string to keep persistence simple
    @Column(name = "working_hours", columnDefinition = "jsonb")
    private String workingHours;

    @Column(name = "social_links", columnDefinition = "jsonb")
    private String socialLinks;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Audit fields
    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    // Trial fields
    @Column(name = "trial_started_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime trialStartedAt;

    @Column(name = "trial_listings_count", nullable = false)
    @Builder.Default
    private Integer trialListingsCount = 0;

    @Column(name = "trial_expired", nullable = false)
    @Builder.Default
    private Boolean trialExpired = false;

    @Column(name = "trial_extended_until", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime trialExtendedUntil;

    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "Asia/Damascus";

    // Subscription fields
    @Column(name = "subscription_tier", length = 50)
    @Builder.Default
    private String subscriptionTier = "trial";

    @Column(name = "subscription_started_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime subscriptionStartedAt;

    @Column(name = "subscription_status", length = 50)
    @Builder.Default
    private String subscriptionStatus = "trial";

    @Column(name = "subscription_next_billing_date", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime subscriptionNextBillingDate;

    @Column(name = "subscription_cancelled_at", columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private ZonedDateTime subscriptionCancelledAt;

    // Notification tracking (JSON array stored as TEXT)
    @Column(name = "notifications_sent", columnDefinition = "text")
    @Convert(converter = com.autotrader.autotraderbackend.converter.StringListConverter.class)
    @Builder.Default
    private List<String> notificationsSent = new ArrayList<>();

    // Feature flags
    @Column(name = "can_create_listings", nullable = false)
    @Builder.Default
    private Boolean canCreateListings = true;

    @Column(name = "payment_warning", nullable = false)
    @Builder.Default
    private Boolean paymentWarning = false;

    // Helper methods
    public boolean hasCompleteBusinessInfo() {
        return businessName != null && !businessName.trim().isEmpty();
    }

    public boolean hasContactInfo() {
        return (businessEmail != null && !businessEmail.trim().isEmpty()) ||
               (businessPhone != null && !businessPhone.trim().isEmpty());
    }

    public boolean isOnTrial() {
        return "trial".equals(subscriptionTier);
    }

    public boolean hasActiveSubscription() {
        return subscriptionTier != null &&
               !"trial".equals(subscriptionTier) &&
               !"suspended".equals(subscriptionStatus);
    }

    public void markNotified(String notificationType) {
        if (notificationsSent == null) {
            notificationsSent = new ArrayList<>();
        }
        if (!notificationsSent.contains(notificationType)) {
            notificationsSent.add(notificationType);
        }
    }

    public boolean isNotified(String notificationType) {
        return notificationsSent != null && notificationsSent.contains(notificationType);
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        if (trialStartedAt == null) {
            trialStartedAt = ZonedDateTime.now();
        }

        // Initialize notifications list to prevent NPE
        if (notificationsSent == null) {
            notificationsSent = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
