package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingExpiredEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.service.AsyncTransactionService;
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
                        
                // TODO: Send email with renewal options
                // Optional.ofNullable(user.getEmail())
                //     .ifPresent(email -> emailService.sendListingExpiredEmail(email, listing, getRenewalOptions()));
            });
            
            // TODO: Update search index to exclude this listing
        });
    }
}
