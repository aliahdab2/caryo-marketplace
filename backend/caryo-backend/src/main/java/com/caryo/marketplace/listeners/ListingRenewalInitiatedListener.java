package com.caryo.marketplace.listeners;

import com.caryo.marketplace.events.ListingRenewalInitiatedEvent;
import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.service.AsyncTransactionService;
import com.caryo.marketplace.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * Listener for listing renewal events.
 * Handles notification and other business logic when a listing is renewed.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ListingRenewalInitiatedListener {

    private final ListingEventUtils eventUtils;
    private final AsyncTransactionService txService;
    private final EmailService emailService;

    /**
     * Handle the listing renewal initiated event.
     * This will log the event and trigger any notification processes.
     *
     * Uses transaction management to ensure database operations are consistent.
     *
     * @param event The listing renewal initiated event (must not be null)
     */
    @EventListener
    @Async
    public void handleListingRenewalInitiated(@NonNull ListingRenewalInitiatedEvent event) {
        Objects.requireNonNull(event, "ListingRenewalInitiatedEvent cannot be null");

        txService.executeInTransaction(() -> {
            CarListing listing = event.getListing();
            int renewalDays = event.getDurationDays();

            log.info("Listing renewal initiated event received for {} for {} days",
                    eventUtils.getListingInfo(listing), renewalDays);

            // Calculate estimated new expiration date for logging purposes
            LocalDateTime estimatedNewExpiration = LocalDateTime.now().plus(renewalDays, ChronoUnit.DAYS);
            log.debug("Listing ID: {} renewed for {} days, estimated new expiration: {}",
                    listing.getId(), renewalDays, estimatedNewExpiration);

            // Send confirmation email to seller
            User seller = listing.getSeller();
            if (seller != null && seller.getEmail() != null) {
                try {
                    emailService.sendListingRenewalEmail(seller, listing, renewalDays);
                    log.info("Listing renewal email sent to seller: {}", seller.getEmail());
                } catch (Exception e) {
                    log.error("Failed to send listing renewal email to seller: {}", seller.getEmail(), e);
                }
            }

            // Update listing search prominence - mark as recently renewed
            updateListingSearchProminence(listing, renewalDays);
        });
    }

    /**
     * Update listing's search prominence when renewed.
     * This improves user experience by highlighting recently renewed listings.
     *
     * @param listing The renewed car listing
     * @param renewalDays Number of days the listing was renewed for
     */
    private void updateListingSearchProminence(CarListing listing, int renewalDays) {
        try {
            // Update the listing's last renewal timestamp
            listing.setLastRenewedAt(LocalDateTime.now());

            // Calculate search boost based on renewal duration
            // Longer renewals get higher search prominence
            double searchBoost = Math.min(renewalDays / 30.0, 2.0); // Max boost of 2.0x for 60+ day renewals
            listing.setSearchScoreBoost(searchBoost);

            // Mark as recently renewed (will be highlighted in search results)
            listing.setRecentlyRenewed(true);

            // Set the recently renewed flag to expire after 7 days
            listing.setRecentlyRenewedUntil(LocalDateTime.now().plusDays(7));

            log.info("Updated search prominence for listing ID: {} - boost: {}, recently renewed until: {}",
                    listing.getId(), searchBoost, listing.getRecentlyRenewedUntil());

        } catch (Exception e) {
            log.error("Failed to update search prominence for listing ID: {}", listing.getId(), e);
            // Don't fail the renewal process if search prominence update fails
        }
    }
}
