package com.autotrader.autotraderbackend.payload.response;

import com.autotrader.autotraderbackend.service.DealerTrialService.TrialStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for checking if a dealer can create a listing.
 * Includes the reason and full trial status for context.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CanCreateListingResponse {

    /**
     * Whether the dealer can create a listing.
     */
    private boolean canCreate;

    /**
     * Reason for the decision.
     * Examples: "Trial active", "Trial expired", "Listing limit reached", "Subscription active"
     */
    private String reason;

    /**
     * Full trial status with detailed information.
     */
    private TrialStatus trialStatus;

    /**
     * Factory method: Dealer is allowed to create listing (trial active).
     */
    public static CanCreateListingResponse allowed(TrialStatus status) {
        return CanCreateListingResponse.builder()
            .canCreate(true)
            .reason("Trial active")
            .trialStatus(status)
            .build();
    }

    /**
     * Factory method: Trial has expired by time.
     */
    public static CanCreateListingResponse trialExpired(TrialStatus status) {
        return CanCreateListingResponse.builder()
            .canCreate(false)
            .reason("Trial expired")
            .trialStatus(status)
            .build();
    }

    /**
     * Factory method: Listing limit reached.
     */
    public static CanCreateListingResponse limitReached(TrialStatus status) {
        return CanCreateListingResponse.builder()
            .canCreate(false)
            .reason("Listing limit reached")
            .trialStatus(status)
            .build();
    }

    /**
     * Factory method: Feature flag disabled.
     */
    public static CanCreateListingResponse featureDisabled(TrialStatus status) {
        return CanCreateListingResponse.builder()
            .canCreate(false)
            .reason("Listing creation disabled")
            .trialStatus(status)
            .build();
    }

    /**
     * Factory method: Subscription is active.
     */
    public static CanCreateListingResponse subscriptionActive(TrialStatus status) {
        return CanCreateListingResponse.builder()
            .canCreate(true)
            .reason("Subscription active")
            .trialStatus(status)
            .build();
    }

    /**
     * Factory method: In grace period.
     */
    public static CanCreateListingResponse gracePeriod(TrialStatus status) {
        return CanCreateListingResponse.builder()
            .canCreate(true)
            .reason("Grace period active")
            .trialStatus(status)
            .build();
    }
}