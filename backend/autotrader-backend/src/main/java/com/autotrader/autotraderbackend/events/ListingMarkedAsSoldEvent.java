package com.autotrader.autotraderbackend.events;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import java.util.Objects;
import java.util.Optional;

/**
 * Event that is published when a car listing is marked as sold.
 * This can happen either by the seller or by an admin.
 */
@Getter
public class ListingMarkedAsSoldEvent extends ApplicationEvent {
    private final CarListing listing;
    private final boolean isAdminAction;

    public ListingMarkedAsSoldEvent(Object source, CarListing listing, boolean isAdminAction) {
        super(source);
        if (Objects.isNull(listing)) {
            throw new IllegalArgumentException("CarListing cannot be null");
        }
        this.listing = listing;
        this.isAdminAction = isAdminAction;
    }

    @Override
    public String toString() {
        return String.format("ListingMarkedAsSoldEvent[listingId=%s, isAdminAction=%s, seller=%s]",
            Objects.toString(listing.getId(), "null"),
            isAdminAction,
            Optional.ofNullable(listing.getSeller())
                    .map(User::getUsername)
                    .orElse("unknown"));
    }
}