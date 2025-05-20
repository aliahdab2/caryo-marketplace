package com.autotrader.autotraderbackend.events;

import com.autotrader.autotraderbackend.model.CarListing;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import java.util.Objects;

/**
 * Event that is published when a car listing renewal is initiated.
 * This happens when a seller starts the process of renewing an existing listing.
 * Validates that the renewal duration is within acceptable bounds (1-365 days).
 */
@Getter
public class ListingRenewalInitiatedEvent extends ApplicationEvent {
    private static final int MAX_DURATION_DAYS = 365;
    private final CarListing listing;
    private final int durationDays;

    public ListingRenewalInitiatedEvent(Object source, CarListing listing, int durationDays) {
        super(validateSource(source));
        this.listing = validateListing(listing);
        this.durationDays = validateDuration(durationDays);
    }

    private static Object validateSource(Object source) {
        if (source == null) {
            throw new IllegalArgumentException("Source cannot be null");
        }
        return source;
    }

    private static CarListing validateListing(CarListing listing) {
        if (listing == null) {
            throw new IllegalArgumentException("Listing cannot be null");
        }
        return listing;
    }

    private static int validateDuration(int durationDays) {
        if (durationDays <= 0) {
            throw new IllegalArgumentException("Duration must be greater than 0 days");
        }
        if (durationDays > MAX_DURATION_DAYS) {
            throw new IllegalArgumentException("Duration cannot exceed " + MAX_DURATION_DAYS + " days");
        }
        return durationDays;
    }
}