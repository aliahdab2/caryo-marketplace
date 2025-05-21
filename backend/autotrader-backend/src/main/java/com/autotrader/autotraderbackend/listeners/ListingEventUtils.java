package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.model.CarListing;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Optional;

/**
 * Utility class for event listeners with common functionality for formatting and extracting information.
 */
@Component
public class ListingEventUtils {

    /**
     * Extract seller information from a car listing in a safe way.
     * 
     * @param listing The car listing, can be null
     * @return A string with the seller's information or "unknown" if not available
     */
    public String getSellerInfo(@Nullable CarListing listing) {
        if (listing == null) {
            return "unknown";
        }
        
        return Optional.ofNullable(listing.getSeller())
                .map(seller -> String.format("'%s' (ID: %s)", 
                        Objects.toString(seller.getUsername(), "unnamed"), 
                        Objects.toString(seller.getId(), "unknown")))
                .orElse("unknown seller");
    }

    /**
     * Extract listing information in a safe way.
     * 
     * @param listing The car listing, can be null
     * @return A string with basic listing information
     */
    public String getListingInfo(@Nullable CarListing listing) {
        if (listing == null) {
            return "unknown listing";
        }
        
        return String.format("listing ID %s by %s", 
                Objects.toString(listing.getId(), "unknown"), 
                getSellerInfo(listing));
    }
}
