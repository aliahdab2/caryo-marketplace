package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.service.AsyncTransactionService;
import com.autotrader.autotraderbackend.service.EmailService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
    private final EmailService emailService;

    @PersistenceContext
    private final EntityManager entityManager;
    
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
            boolean isAdminAction = event.isAdminAction();
            String actionBy = isAdminAction ? "admin" : "seller";

            // Use the seller information from the event to avoid lazy loading issues
            String sellerInfo = String.format("'%s' (ID: %s)",
                    event.getSellerUsername(),
                    Objects.toString(event.getSellerId(), "unknown"));

            log.info("Listing archived event received for listing ID {} by {} by {}",
                    listing.getId(), sellerInfo, actionBy);

            // Log archival details with more context
            if (isAdminAction) {
                log.info("Admin archived listing ID {} by {}", listing.getId(), sellerInfo);

                // Additional admin-specific logic could go here
            } else {
                log.info("Seller '{}' archived their own listing ID: {}", event.getSellerUsername(), listing.getId());
            }

            // If archived by admin, send notification email to the seller
            if (isAdminAction && event.getSellerId() != null) {
                try {
                    // We need to fetch the seller entity in this transaction to send the email
                    var seller = entityManager.find(com.autotrader.autotraderbackend.model.User.class, event.getSellerId());
                    if (seller != null && seller.getEmail() != null) {
                        // No specific reason available from event, will use default message
                        emailService.sendListingArchivedByAdminEmail(seller, listing, null);
                        log.info("Listing archived by admin notification email sent to seller: {}", seller.getEmail());
                    }
                } catch (Exception e) {
                    log.error("Failed to send listing archived by admin email to seller ID: {}", event.getSellerId(), e);
                }
            }
        });
    }
}
