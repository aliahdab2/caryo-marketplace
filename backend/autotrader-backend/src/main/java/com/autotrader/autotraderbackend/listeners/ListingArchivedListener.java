package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
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
 * Listener for listing archived events.
 * Handles notification and other business logic when a listing is archived.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ListingArchivedListener {

    private final ListingEventUtils eventUtils;
    private final AsyncTransactionService txService;
    
    /**
     * Handle the listing archived event.
     * This will log the event and trigger any notification processes.
     * 
     * Uses transaction management to ensure database operations are consistent.
     * 
     * @param event The listing archived event (must not be null)
     */
    @EventListener
    @Async
    public void handleListingArchived(@NonNull ListingArchivedEvent event) {
        Objects.requireNonNull(event, "ListingArchivedEvent cannot be null");
        
        txService.executeInTransaction(() -> {
            CarListing listing = event.getListing();
            User seller = listing.getSeller();
            boolean isAdminAction = event.isAdminAction();
            String actionBy = isAdminAction ? "admin" : "seller";
                    
            log.info("Listing archived event received for {} by {}", 
                    eventUtils.getListingInfo(listing), actionBy);

            // Log archival details with more context
            if (isAdminAction) {
                log.info("Admin archived {}", eventUtils.getListingInfo(listing));
                
                // Additional admin-specific logic could go here
            } else {
                String sellerName = Optional.ofNullable(seller)
                    .map(User::getUsername)
                    .orElse("unknown seller");
                log.info("Seller '{}' archived their own listing ID: {}", sellerName, listing.getId());
            }

            // TODO: If archived by admin, may need to send an explanation to the seller
            // if (isAdminAction && seller != null && seller.getEmail() != null) {
            //     emailService.sendListingArchivedByAdminEmail(seller.getEmail(), listing);
            // }
        });
    }
}
