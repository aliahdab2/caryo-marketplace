package com.caryo.marketplace.payload.response;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for authenticated dealer's own profile data.
 * Used by GET /api/dealer/profile endpoint.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealerProfileResponse {
    private Long id;
    private String businessName;
    private String vatNumber;
    private String tradingAddress;
    private String businessEmail;
    private String businessPhone;
    private String logoUrl;
    private String bannerUrl;
    private String description;
    private String descriptionAr;
    private String workingHours;
    private String socialLinks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Trial/Subscription info
    private String subscriptionTier;
    private String subscriptionStatus;
    private ZonedDateTime trialStartedAt;
    private Integer trialListingsCount;
    private Boolean trialExpired;
    private Boolean canCreateListings;
    private String timezone;
}
