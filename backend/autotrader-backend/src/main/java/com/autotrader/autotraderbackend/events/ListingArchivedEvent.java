package com.autotrader.autotraderbackend.events;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.Objects;
import java.util.Optional;

/**
 * Event that is published when a car listing is archived.
 * This can happen either by the seller or by an admin.
 */
@Getter
public class ListingArchivedEvent extends ApplicationEvent {
    private final CarListing listing; // Renamed from carListing
    private final boolean isAdminAction;

    public ListingArchivedEvent(Object source, CarListing listing, boolean isAdminAction) { // Renamed parameter
        super(source);
        if (Objects.isNull(listing)) { // Changed to Objects.isNull
            throw new IllegalArgumentException("CarListing cannot be null");
        }
        // Removed redundant source null check, ApplicationEvent handles this
        this.listing = listing; // Renamed from carListing
        this.isAdminAction = isAdminAction;
    }

    @Override
    public String toString() {
        return String.format("ListingArchivedEvent[listingId=%s, isAdminAction=%s, seller=%s]", // Renamed carListingId to listingId
                Objects.toString(listing.getId(), "null"), // Updated for null safety
                isAdminAction,
                Optional.ofNullable(listing.getSeller()) // Updated for null safety
                        .map(User::getUsername)
                        .orElse("unknown"));
    }
}
