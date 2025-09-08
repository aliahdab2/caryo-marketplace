package com.autotrader.autotraderbackend.events;

import com.autotrader.autotraderbackend.model.CarListing;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Event that is published when a car listing is archived.
 * This can happen either by the seller or by an admin.
 *
 * This event provides comprehensive information about the archival operation
 * and ensures seller information is captured to avoid lazy loading issues.
 *
 * @author AutoTrader Team
 * @version 1.2
 */
@Getter
public class ListingArchivedEvent extends ApplicationEvent {

    /**
     * The car listing that was archived.
     */
    private final CarListing listing;

    /**
     * Whether this archival was performed by an admin (true) or seller (false).
     */
    private final boolean isAdminAction;

    /**
     * The username of the seller whose listing was archived.
     * This is extracted at event creation time to avoid lazy loading issues.
     */
    private String sellerUsername;

    /**
     * The ID of the seller whose listing was archived.
     * This is extracted at event creation time to avoid lazy loading issues.
     */
    private Long sellerId;

    /**
     * The timestamp when this event was created.
     */
    private final LocalDateTime eventTimestamp;

    /**
     * The source of the archival action (e.g., "admin", "api", "batch").
     */
    private final String archivalSource;

    /**
     * Additional reason/context for the archival (optional).
     */
    private final String archivalReason;

    /**
     * Create a new listing archived event with basic information.
     *
     * @param source The object that published this event (cannot be null)
     * @param listing The car listing that was archived (cannot be null)
     * @param isAdminAction Whether this was an admin action
     * @throws IllegalArgumentException if listing is null or source is null
     */
    public ListingArchivedEvent(Object source, CarListing listing, boolean isAdminAction) {
        this(source, listing, isAdminAction, null, null);
    }

    /**
     * Create a new listing archived event with additional context.
     *
     * @param source The object that published this event (cannot be null)
     * @param listing The car listing that was archived (cannot be null)
     * @param isAdminAction Whether this was an admin action
     * @param archivalSource The source of the archival action (optional)
     * @param archivalReason Additional reason/context for the archival (optional)
     * @throws IllegalArgumentException if listing is null or source is null
     */
    public ListingArchivedEvent(Object source, CarListing listing, boolean isAdminAction,
                               String archivalSource, String archivalReason) {
        super(source);

        // Validate required parameters
        Objects.requireNonNull(listing, "CarListing cannot be null");
        Objects.requireNonNull(source, "Event source cannot be null");

        this.listing = listing;
        this.isAdminAction = isAdminAction;
        this.archivalSource = StringUtils.hasText(archivalSource) ? archivalSource : "unknown";
        this.archivalReason = archivalReason;
        this.eventTimestamp = LocalDateTime.now();

        // Extract seller information safely to avoid lazy loading issues
        extractSellerInformation();
    }

    /**
     * Extract seller information from the listing to avoid lazy loading issues.
     * This ensures the information is available when the event is processed asynchronously.
     */
    private void extractSellerInformation() {
        if (listing.getSeller() != null) {
            this.sellerUsername = listing.getSeller().getUsername();
            this.sellerId = listing.getSeller().getId();
        } else {
            this.sellerUsername = "unknown";
            this.sellerId = null;
        }
    }

    /**
     * Get a human-readable description of the archival action.
     *
     * @return A description of who performed the action
     */
    public String getActionDescription() {
        if (isAdminAction) {
            return StringUtils.hasText(archivalReason)
                ? "Admin archived listing (reason: " + archivalReason + ")"
                : "Admin archived listing";
        } else {
            return "Seller archived their own listing";
        }
    }

    /**
     * Check if this event has a seller associated with it.
     *
     * @return true if seller information is available, false otherwise
     */
    public boolean hasSeller() {
        return sellerId != null && StringUtils.hasText(sellerUsername);
    }

    @Override
    public String toString() {
        return String.format("ListingArchivedEvent[listingId=%s, action=%s, seller='%s'(ID:%s), source='%s', timestamp=%s]",
                Objects.toString(listing.getId(), "null"),
                getActionDescription(),
                sellerUsername,
                Objects.toString(sellerId, "null"),
                archivalSource,
                eventTimestamp);
    }

    /**
     * Get a summary of this event for logging purposes.
     *
     * @return A concise summary string suitable for logging
     */
    public String toLogString() {
        return String.format("LISTING_ARCHIVED: ID=%s, ACTION=%s, SELLER=%s, SOURCE=%s",
                listing.getId(),
                isAdminAction ? "ADMIN" : "SELLER",
                sellerUsername,
                archivalSource);
    }
}
