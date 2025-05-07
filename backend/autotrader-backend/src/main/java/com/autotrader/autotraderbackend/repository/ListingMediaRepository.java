package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.ListingMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingMediaRepository extends JpaRepository<ListingMedia, Long> {
    
    /**
     * Find all media associated with a specific car listing
     * 
     * @param listingId The ID of the car listing
     * @return A list of media items for the specified listing
     */
    List<ListingMedia> findByListingIdOrderBySortOrderAsc(Long listingId);
    
    /**
     * Find the primary media for a specific car listing
     * 
     * @param listingId The ID of the car listing
     * @return A list of primary media items (typically should be only one)
     */
    List<ListingMedia> findByListingIdAndIsPrimaryTrue(Long listingId);
}
