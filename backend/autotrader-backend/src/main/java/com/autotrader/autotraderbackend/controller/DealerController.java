package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.dealer.DealerNotFoundException;
import com.autotrader.autotraderbackend.model.Dealer;
import com.autotrader.autotraderbackend.payload.response.CanCreateListingResponse;
import com.autotrader.autotraderbackend.payload.response.DealerProfileResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.autotrader.autotraderbackend.service.DealerService;
import com.autotrader.autotraderbackend.service.DealerTrialService;
import com.autotrader.autotraderbackend.service.DealerTrialService.TrialStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for dealer-specific operations.
 *
 * Endpoints:
 * - GET /api/dealer/trial-status - Get current trial status
 * - POST /api/dealer/extend-trial - Extend trial (admin only)
 * - GET /api/dealer/profile - Get dealer profile
 * - GET /api/dealer/can-create-listing - Check if can create listing
 */
@RestController
@RequestMapping("/api/dealer")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Dealer", description = "Dealer profile management, trial status, and subscription operations")
@SecurityRequirement(name = "bearer-token")
public class DealerController {

    private final DealerService dealerService;
    private final DealerTrialService dealerTrialService;

    /**
     * Get trial status for the authenticated dealer.
     *
     * @param userDetails Authenticated user details
     * @return Trial status including days remaining, listings used, etc.
     */
    @Operation(
        summary = "Get dealer trial status",
        description = "Returns trial status including days remaining, listings used/limit, and subscription info"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Trial status retrieved successfully",
            content = @Content(schema = @Schema(implementation = TrialStatus.class))),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Not a dealer account"),
        @ApiResponse(responseCode = "404", description = "Dealer profile not found")
    })
    @GetMapping("/trial-status")
    @PreAuthorize("hasRole('DEALER') or hasRole('ADMIN')")
    public ResponseEntity<?> getTrialStatus(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Long userId = userDetails.getId();

            Dealer dealer = dealerService.getDealerByUserId(userId)
                .orElseThrow(() -> new DealerNotFoundException(userId));

            TrialStatus status = dealerTrialService.getTrialStatus(dealer);

            log.info("Trial status requested for dealer: {} - Active: {}, Listings: {}/{}",
                dealer.getId(), status.isActive(), status.getListingsUsed(), status.getListingsLimit());

            return ResponseEntity.ok(status);

        } catch (DealerNotFoundException e) {
            log.error("Dealer not found for user: {}", userDetails.getId());
            return ResponseEntity.status(404)
                .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching trial status", e);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Could not fetch trial status"));
        }
    }

    /**
     * Extend trial for a dealer (admin only).
     *
     * @param dealerId Dealer ID to extend
     * @param additionalDays Number of days to extend
     * @param reason Reason for extension (audit trail)
     * @return Success message
     */
    @Operation(
        summary = "Extend dealer trial period",
        description = "Admin-only endpoint to extend a dealer's trial period by a specified number of days"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Trial extended successfully"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Admin role required"),
        @ApiResponse(responseCode = "404", description = "Dealer not found")
    })
    @PostMapping("/extend-trial/{dealerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> extendTrial(
            @Parameter(description = "Dealer ID to extend trial for") @PathVariable Long dealerId,
            @Parameter(description = "Number of days to add to trial") @RequestParam int additionalDays,
            @Parameter(description = "Reason for extension (audit trail)") @RequestParam String reason,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Dealer dealer = dealerService.getDealerById(dealerId)
                .orElseThrow(() -> new DealerNotFoundException("Dealer not found with ID: " + dealerId, dealerId));

            dealerTrialService.extendTrial(dealer, additionalDays, reason);

            log.info("Trial extended by admin {} for dealer {}: {} days. Reason: {}",
                userDetails.getUsername(), dealerId, additionalDays, reason);

            return ResponseEntity.ok(
                new MessageResponse("Trial extended successfully by " + additionalDays + " days"));

        } catch (DealerNotFoundException e) {
            log.error("Dealer not found: {}", dealerId);
            return ResponseEntity.status(404)
                .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error extending trial for dealer: {}", dealerId, e);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Could not extend trial"));
        }
    }

    /**
     * Get dealer profile for authenticated user.
     *
     * @param userDetails Authenticated user details
     * @return Dealer profile
     */
    @Operation(
        summary = "Get dealer profile",
        description = "Returns the authenticated dealer's full profile including business info, branding, and subscription status"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
            content = @Content(schema = @Schema(implementation = DealerProfileResponse.class))),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Not a dealer account"),
        @ApiResponse(responseCode = "404", description = "Dealer profile not found")
    })
    @GetMapping("/profile")
    @PreAuthorize("hasRole('DEALER') or hasRole('ADMIN')")
    public ResponseEntity<?> getDealerProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Long userId = userDetails.getId();

            Dealer dealer = dealerService.getDealerByUserId(userId)
                .orElseThrow(() -> new DealerNotFoundException(userId));

            // Map entity to DTO to avoid Hibernate proxy serialization issues
            DealerProfileResponse response = mapDealerToProfileResponse(dealer);
            return ResponseEntity.ok(response);

        } catch (DealerNotFoundException e) {
            log.error("Dealer profile not found for user: {}", userDetails.getId());
            return ResponseEntity.status(404)
                .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching dealer profile", e);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Could not fetch dealer profile"));
        }
    }

    /**
     * Maps a Dealer entity to a DealerProfileResponse DTO.
     * This avoids Hibernate lazy-loading proxy serialization issues.
     */
    private DealerProfileResponse mapDealerToProfileResponse(Dealer dealer) {
        return DealerProfileResponse.builder()
            .id(dealer.getId())
            .businessName(dealer.getBusinessName())
            .vatNumber(dealer.getVatNumber())
            .tradingAddress(dealer.getTradingAddress())
            .businessEmail(dealer.getBusinessEmail())
            .businessPhone(dealer.getBusinessPhone())
            .logoUrl(dealer.getLogoUrl())
            .bannerUrl(dealer.getBannerUrl())
            .description(dealer.getDescription())
            .descriptionAr(dealer.getDescriptionAr())
            .workingHours(dealer.getWorkingHours())
            .socialLinks(dealer.getSocialLinks())
            .createdAt(dealer.getCreatedAt())
            .updatedAt(dealer.getUpdatedAt())
            .subscriptionTier(dealer.getSubscriptionTier())
            .subscriptionStatus(dealer.getSubscriptionStatus())
            .trialStartedAt(dealer.getTrialStartedAt())
            .trialListingsCount(dealer.getTrialListingsCount())
            .trialExpired(dealer.getTrialExpired())
            .canCreateListings(dealer.getCanCreateListings())
            .timezone(dealer.getTimezone())
            .build();
    }

    /**
     * Update dealer public profile fields.
     *
     * @param userDetails Authenticated user details
     * @param updateRequest Profile update payload
     * @return Updated dealer profile
     */
    @Operation(
        summary = "Update dealer profile",
        description = "Updates dealer's public profile including business info, logo, banner, description, and social links"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profile updated successfully",
            content = @Content(schema = @Schema(implementation = Dealer.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input (duplicate email, invalid URL, etc.)"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Not a dealer account"),
        @ApiResponse(responseCode = "404", description = "Dealer profile not found")
    })
    @PutMapping("/profile")
    @PreAuthorize("hasRole('DEALER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateDealerProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody com.autotrader.autotraderbackend.payload.request.DealerProfileUpdateRequest updateRequest) {
        try {
            Long userId = userDetails.getId();

            Dealer dealer = dealerService.getDealerByUserId(userId)
                .orElseThrow(() -> new DealerNotFoundException(userId));

            Dealer updatedDealer = dealerService.updatePublicProfile(dealer, updateRequest);
            return ResponseEntity.ok(updatedDealer);
        } catch (DealerNotFoundException e) {
            log.error("Dealer profile not found for user: {}", userDetails.getId());
            return ResponseEntity.status(404)
                .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating dealer profile", e);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Could not update dealer profile"));
        }
    }

    /**
     * Check if dealer can create a new listing.
     *
     * @param userDetails Authenticated user details
     * @return Response with canCreate flag, reason, and trial status
     */
    @Operation(
        summary = "Check listing creation permission",
        description = "Checks if the dealer can create a new listing based on trial status, subscription, and limits"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Permission status retrieved",
            content = @Content(schema = @Schema(implementation = CanCreateListingResponse.class))),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "403", description = "Not a dealer account"),
        @ApiResponse(responseCode = "404", description = "Dealer profile not found")
    })
    @GetMapping("/can-create-listing")
    @PreAuthorize("hasRole('DEALER') or hasRole('ADMIN')")
    public ResponseEntity<?> canCreateListing(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Long userId = userDetails.getId();

            Dealer dealer = dealerService.getDealerByUserId(userId)
                .orElseThrow(() -> new DealerNotFoundException(userId));

            boolean canCreate = dealerTrialService.canCreateListing(dealer);
            TrialStatus status = dealerTrialService.getTrialStatus(dealer);

            // Determine reason based on status
            CanCreateListingResponse response;
            if (canCreate) {
                if (status.isInGracePeriod()) {
                    response = CanCreateListingResponse.gracePeriod(status);
                } else if (dealer.hasActiveSubscription()) {
                    response = CanCreateListingResponse.subscriptionActive(status);
                } else {
                    response = CanCreateListingResponse.allowed(status);
                }
            } else {
                if (!dealer.getCanCreateListings()) {
                    response = CanCreateListingResponse.featureDisabled(status);
                } else if (dealer.getTrialListingsCount() >= status.getListingsLimit()) {
                    response = CanCreateListingResponse.limitReached(status);
                } else {
                    response = CanCreateListingResponse.trialExpired(status);
                }
            }

            return ResponseEntity.ok(response);

        } catch (DealerNotFoundException e) {
            log.error("Dealer not found for user: {}", userDetails.getId());
            return ResponseEntity.status(404)
                .body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error checking listing creation permission", e);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: Could not check listing permission"));
        }
    }
}

