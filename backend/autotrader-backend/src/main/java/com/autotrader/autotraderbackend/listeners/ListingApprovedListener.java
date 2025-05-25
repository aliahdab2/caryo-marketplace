package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingApprovedEvent;
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
 * Listener for listing approval events.
 * Handles notification and other business logic when a listing is approved.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ListingApprovedListener {

    private final ListingEventUtils eventUtils;
    private final AsyncTransactionService txService;
    
    // TODO: Inject email service when ready
    // private final EmailService emailService;
    
    /**
     * Handle the listing approved event.
     * This will log the event and trigger any notification processes.
     * 
     * Uses transaction management to ensure database operations are consistent.
     * 
     * @param event The listing approved event (must not be null)
     */
    @EventListener
    @Async
    public void handleListingApproved(@NonNull ListingApprovedEvent event) {
        Objects.requireNonNull(event, "ListingApprovedEvent cannot be null");
        
        txService.executeInTransaction(() -> {
            CarListing listing = event.getListing();
            User seller = listing.getSeller();
            
            log.info("Listing approved event received for {}", 
                    eventUtils.getListingInfo(listing));

            // Detailed log about the car with safe null handling
            String sellerUsername = Optional.ofNullable(seller)
                    .map(User::getUsername)
                    .orElse("N/A");
            
            String sellerId = Optional.ofNullable(seller)
                    .map(User::getId)
                    .map(Object::toString)
                    .orElse("N/A");
                    
            log.debug("Approved Listing Details: ID: {}, Seller: {} (ID: {}), Make: {}, Model: {}, Year: {}, Price: {}",
                    listing.getId(),
                    sellerUsername,
                    sellerId,
                    listing.getBrandNameEn(),
                    listing.getModelNameEn(),
                    listing.getModelYear(),
                    listing.getPrice()
            );

            // TODO: Send email notification to the seller
            // Optional.ofNullable(seller)
            //     .map(User::getEmail)
            //     .ifPresent(email -> emailService.sendListingApprovedEmail(email, listing));

            // TODO: Update analytics or reporting
        });
    }
}
