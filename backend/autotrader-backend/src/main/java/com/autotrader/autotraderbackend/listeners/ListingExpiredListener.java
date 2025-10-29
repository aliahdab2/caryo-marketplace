package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingExpiredEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.service.AsyncTransactionService;
import com.autotrader.autotraderbackend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Optional;

/**
 * Listener for listing expired events.
 * Handles notifications and other business logic when a listing expires.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ListingExpiredListener {

    private final ListingEventUtils eventUtils;
    private final AsyncTransactionService txService;
    private final EmailService emailService;

    /**
     * Handle the listing expired event.
     * This will log the event and trigger any notification processes.
     *
     * Uses transaction management to ensure database operations are consistent.
     *
     * @param event The listing expired event (must not be null)
     */
    @EventListener
    @Async
    public void handleListingExpired(@NonNull ListingExpiredEvent event) {
        Objects.requireNonNull(event, "ListingExpiredEvent cannot be null");

        txService.executeInTransaction(() -> {
            CarListing listing = event.getListing();
            User seller = listing.getSeller();
            boolean isAdminAction = event.isAdminAction();
            String actionBy = isAdminAction ? "admin" : "system";

            log.info("Listing expired event received for {} by {}",
                    eventUtils.getListingInfo(listing), actionBy);

            // Send renewal options to seller
            Optional.ofNullable(seller).ifPresent(user -> {
                log.info("Preparing renewal options for seller {} for listing ID {}",
                        user.getUsername(), listing.getId());

                // Send email with renewal options
                if (user.getEmail() != null) {
                    try {
                        emailService.sendListingExpiredEmail(user, listing);
                        log.info("Listing expired email sent to seller: {}", user.getEmail());
                    } catch (Exception e) {
                        log.error("Failed to send listing expired email to seller: {}", user.getEmail(), e);
                    }
                }
            });

            // Update search index to exclude expired listing
            updateSearchIndexForExpiredListing(listing);
        });
    }

    /**
     * Update search index to exclude expired listing.
     * This ensures expired listings don't appear in search results.
     *
     * @param listing The expired car listing
     */
    private void updateSearchIndexForExpiredListing(CarListing listing) {
        try {
            // Mark listing as not searchable in search index
            listing.setSearchable(false);

            // Clear any search prominence boosts since listing is expired
            listing.setSearchScoreBoost(0.0);
            listing.setRecentlyRenewed(false);
            listing.setRecentlyRenewedUntil(null);

            // Update search index timestamp to trigger re-indexing
            listing.setSearchIndexUpdatedAt(java.time.LocalDateTime.now());

            log.info("Updated search index for expired listing ID: {} - marked as not searchable", listing.getId());

        } catch (Exception e) {
            log.error("Failed to update search index for expired listing ID: {}", listing.getId(), e);
            // Don't fail the expiration process if search index update fails
        }
    }
}
