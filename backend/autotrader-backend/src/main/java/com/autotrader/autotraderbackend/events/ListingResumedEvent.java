package com.autotrader.autotraderbackend.events;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.Objects;
import java.util.Optional;

/**
 * Event that is published when a paused car listing is resumed.
 */
@Getter
public class ListingResumedEvent extends ApplicationEvent {
    private final CarListing listing;

    public ListingResumedEvent(Object source, CarListing listing) {
        super(source);
        if (Objects.isNull(listing)) {
            throw new IllegalArgumentException("CarListing cannot be null");
        }
        this.listing = listing;
    }

    @Override
    public String toString() {
        return String.format("ListingResumedEvent[listingId=%s, seller=%s]",
            Objects.toString(listing.getId(), "null"),
            Optional.ofNullable(listing.getSeller())
                    .map(User::getUsername)
                    .orElse("unknown"));
    }
}
