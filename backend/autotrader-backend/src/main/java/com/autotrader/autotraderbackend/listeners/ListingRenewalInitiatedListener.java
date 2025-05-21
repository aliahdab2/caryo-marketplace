package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingRenewalInitiatedEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.service.AsyncTransactionService;
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

            // TODO: Send confirmation email to seller
            // if (seller != null && seller.getEmail() != null) {
            //     Date newExpirationDate = calculateNewExpirationDate(listing, renewalDays);
            //     emailService.sendListingRenewedEmail(seller.getEmail(), listing, newExpirationDate);
            // }
            
            // TODO: Update listing search prominence or boost as a "recently renewed" listing
        });
    }
}
