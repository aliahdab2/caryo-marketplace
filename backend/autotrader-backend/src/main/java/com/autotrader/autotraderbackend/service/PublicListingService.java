package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Service for public listing operations that orchestrates between
 * CarListingService and ListingModerationService.
 * 
 * This service handles the business logic for public-facing listing operations
 * while keeping the core CarListingService focused on CRUD operations.
 * 
 * Follows the Facade pattern to provide a clean interface for public listing access.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PublicListingService {

    private final CarListingService carListingService;
    private final ListingModerationService moderationService;

    /**
     * Get a public listing by ID.
     * This method ensures the listing is approved and not hidden, sold, archived, or expired.
     * 
     * @param id the listing ID
     * @return the listing response
     * @throws ResourceNotFoundException if listing not found or not publicly accessible
     */
    @Transactional(readOnly = true)
    public CarListingResponse getPublicListingById(Long id) {
        log.debug("Fetching public listing details for ID: {}", id);
        
        // Get the listing first to check if it exists and is approved
        CarListingResponse listing = carListingService.getListingById(id);
        
        // Check if listing is approved
        if (!listing.getApproved()) {
            log.warn("Listing ID {} is not approved", id);
            throw new ResourceNotFoundException("CarListing", "id", id);
        }
        
        // Check if listing is hidden by admin (fail fast for most common case)
        if (moderationService.isListingHiddenByAdmin(id)) {
            log.warn("Listing ID {} is hidden by admin", id);
            throw new ResourceNotFoundException("CarListing", "id", id);
        }
        
        // Check if listing is sold
        if (moderationService.isListingSold(id)) {
            log.warn("Listing ID {} is sold", id);
            throw new ResourceNotFoundException("CarListing", "id", id);
        }
        
        // Check if listing is archived
        if (moderationService.isListingArchived(id)) {
            log.warn("Listing ID {} is archived", id);
            throw new ResourceNotFoundException("CarListing", "id", id);
        }
        
        // Check if listing is expired
        if (moderationService.isListingExpired(id)) {
            log.warn("Listing ID {} is expired", id);
            throw new ResourceNotFoundException("CarListing", "id", id);
        }
        
        return listing;
    }

    /**
     * Get all public listings with pagination.
     * This automatically filters out hidden listings.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getPublicListings(Pageable pageable) {
        log.debug("Fetching public listings page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        // The CarListingService already uses specifications that filter hidden listings
        return carListingService.getAllApprovedListings(pageable);
    }

    /**
     * Get filtered public listings.
     * This automatically filters out hidden listings.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getFilteredPublicListings(ListingFilterRequest filterRequest, Pageable pageable) {
        log.debug("Fetching filtered public listings with filters: {}", filterRequest);
        
        // The CarListingService already uses specifications that filter hidden listings
        return carListingService.getFilteredListings(filterRequest, pageable);
    }

    /**
     * Get count of public listings.
     */
    @Transactional(readOnly = true)
    public long getPublicListingsCount() {
        // The CarListingService already uses specifications that filter hidden listings
        return carListingService.getApprovedListingsCount();
    }

    /**
     * Get count of filtered public listings.
     */
    @Transactional(readOnly = true)
    public long getFilteredPublicListingsCount(ListingFilterRequest filterRequest) {
        // The CarListingService already uses specifications that filter hidden listings
        return carListingService.getFilteredListingsCount(filterRequest);
    }

    /**
     * Get filter breakdown for public listings.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getPublicFilterBreakdown(ListingFilterRequest existingFilters) {
        // The CarListingService already uses specifications that filter hidden listings
        return carListingService.getFilterBreakdown(existingFilters);
    }

    /**
     * Get counts by year for public listings.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getPublicCountsByYear(ListingFilterRequest filterRequest) {
        return carListingService.getCountsByYear(filterRequest);
    }

    /**
     * Get counts by brand for public listings.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getPublicCountsByBrand(ListingFilterRequest filterRequest) {
        return carListingService.getCountsByBrand(filterRequest);
    }

    /**
     * Get counts by model for public listings.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getPublicCountsByModel(ListingFilterRequest filterRequest) {
        return carListingService.getCountsByModel(filterRequest);
    }

    /**
     * Get counts by seller type for public listings.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getPublicCountsBySellerType(ListingFilterRequest filterRequest) {
        return carListingService.getCountsBySellerType(filterRequest);
    }

    /**
     * Get counts by fuel type for public listings.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getPublicCountsByFuelType(ListingFilterRequest filterRequest) {
        return carListingService.getCountsByFuelType(filterRequest);
    }

    /**
     * Get counts by transmission for public listings.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getPublicCountsByTransmission(ListingFilterRequest filterRequest) {
        return carListingService.getCountsByTransmission(filterRequest);
    }
}
