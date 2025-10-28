package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.dealer.DealerNotFoundException;
import com.autotrader.autotraderbackend.model.Dealer;
import com.autotrader.autotraderbackend.payload.response.CanCreateListingResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.autotrader.autotraderbackend.service.DealerService;
import com.autotrader.autotraderbackend.service.DealerTrialService;
import com.autotrader.autotraderbackend.service.DealerTrialService.TrialStatus;
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
public class DealerController {

    private final DealerService dealerService;
    private final DealerTrialService dealerTrialService;

    /**
     * Get trial status for the authenticated dealer.
     * 
     * @param userDetails Authenticated user details
     * @return Trial status including days remaining, listings used, etc.
     */
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
    @PostMapping("/extend-trial/{dealerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> extendTrial(
            @PathVariable Long dealerId,
            @RequestParam int additionalDays,
            @RequestParam String reason,
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
    @GetMapping("/profile")
    @PreAuthorize("hasRole('DEALER') or hasRole('ADMIN')")
    public ResponseEntity<?> getDealerProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Long userId = userDetails.getId();
            
            Dealer dealer = dealerService.getDealerByUserId(userId)
                .orElseThrow(() -> new DealerNotFoundException(userId));

            return ResponseEntity.ok(dealer);
            
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
     * Check if dealer can create a new listing.
     * 
     * @param userDetails Authenticated user details
     * @return Response with canCreate flag, reason, and trial status
     */
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

