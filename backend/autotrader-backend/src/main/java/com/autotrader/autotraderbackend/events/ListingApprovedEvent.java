package com.autotrader.autotraderbackend.events;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.Objects;
import java.util.Optional;

/**
 * Event that is published when a car listing is approved.
 */
@Getter
public class ListingApprovedEvent extends ApplicationEvent {
    private final CarListing listing;

    public ListingApprovedEvent(Object source, CarListing listing) {
        super(source);
        if (Objects.isNull(listing)) {
            throw new IllegalArgumentException("CarListing cannot be null");
        }
        this.listing = listing;
    }

    @Override
    public String toString() {
        return String.format("ListingApprovedEvent[listingId=%s, seller=%s]",
            Objects.toString(listing.getId(), "null"),
            Optional.ofNullable(listing.getSeller())
                    .map(User::getUsername)
                    .orElse("unknown"));
    }
}
