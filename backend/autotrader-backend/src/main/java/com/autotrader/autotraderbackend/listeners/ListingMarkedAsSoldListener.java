package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingMarkedAsSoldEvent;
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
 * Listener for when a listing is marked as sold.
 * Handles notification and other business logic when a listing is sold.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ListingMarkedAsSoldListener {

    private final ListingEventUtils eventUtils;
    private final AsyncTransactionService txService;
    
    /**
     * Handle the listing marked as sold event.
     * This will log the event and trigger any notification processes.
     * 
     * Uses transaction management to ensure database operations are consistent.
     * 
     * @param event The listing marked as sold event (must not be null)
     */
    @EventListener
    @Async
    public void handleListingMarkedAsSold(@NonNull ListingMarkedAsSoldEvent event) {
        Objects.requireNonNull(event, "ListingMarkedAsSoldEvent cannot be null");
        
        txService.executeInTransaction(() -> {
            CarListing listing = event.getListing();
            User seller = listing.getSeller();
            boolean isAdminAction = event.isAdminAction();

            String actionBy = isAdminAction ? "admin" : "seller";
            log.info("Listing marked as sold event received for {} by {}", 
                    eventUtils.getListingInfo(listing), actionBy);

            // Detailed log about the car with safe null handling
            String sellerUsername = Optional.ofNullable(seller)
                    .map(User::getUsername)
                    .orElse("N/A");
            
            String sellerId = Optional.ofNullable(seller)
                    .map(User::getId)
                    .map(Object::toString)
                    .orElse("N/A");
                    
            log.debug("Sold Listing Details: ID: {}, Seller: {} (ID: {}), Make: {}, Model: {}, Year: {}, Price: {}",
                    listing.getId(),
                    sellerUsername,
                    sellerId,
                    listing.getBrandNameEn(),
                    listing.getModelNameEn(),
                    listing.getModelYear(),
                    listing.getPrice()
            );

            // TODO: Send confirmation email to seller
            // Optional.ofNullable(seller)
            //     .map(User::getEmail)
            //     .ifPresent(email -> emailService.sendListingSoldEmail(email, listing));
            
            // TODO: Send feedback request to seller
        });
    }
}
