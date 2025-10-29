package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.RegularUserListingLimitException;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Dealer;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarListingService {

    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final SavedSearchService savedSearchService;
    private final CarListingMediaService carListingMediaService;
    private final CarListingCrudService crudService;
    private final CarListingAnalyticsService analyticsService;
    private final CarListingQueryService queryService;
    private final DealerService dealerService;
    private final DealerTrialService dealerTrialService;

    @Value("${user.regular.listing_limit:5}")
    private int regularUserListingLimit;

    /**
     * Check if user can create listings (email verified and account active).
     */
    public boolean canUserCreateListings(String username) {
        return crudService.canUserCreateListings(username);
    }

    /**
     * Create a new car listing without media.
     */
    @Transactional
    public CarListingResponse createListing(CreateListingRequest request, String username) {
        Objects.requireNonNull(request, "CreateListingRequest cannot be null");
        if (StringUtils.isBlank(username)) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        log.info("Attempting to create new listing for user: {}", username);

        // 1. VALIDATE dealer can create listing (trial/subscription limits)
        validateDealerCanCreateListing(username);

        // 2. Create the listing
        CarListingResponse response = crudService.createListingInternal(request, username);

        // 3. TRACK usage (increment trial counter if dealer on trial)
        trackListingCreation(username);

        return response;
    }

    /**
     * Create a new car listing with optional media upload.
     */
    @Transactional
    public CarListingResponse createListingWithMedia(CreateListingRequest request, MultipartFile image, String username) {
        Objects.requireNonNull(request, "CreateListingRequest cannot be null");
        if (StringUtils.isBlank(username)) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        log.info("Attempting to create new listing with media for user: {}", username);

        // 1. VALIDATE dealer can create listing (trial/subscription limits)
        validateDealerCanCreateListing(username);

        // 2. Create the listing
        CarListingResponse listingResponse = crudService.createListingInternal(request, username);

        // 3. TRACK usage (increment trial counter if dealer on trial)
        trackListingCreation(username);

        // Get the actual entity for notifications and media handling
        CarListing savedListing = carListingRepository.findById(listingResponse.getId())
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", listingResponse.getId()));

        // Handle media upload if provided
        if (Objects.nonNull(image) && !image.isEmpty()) {
            uploadInitialMediaForListing(listingResponse.getId(), image, username);
        }

        // Process the new listing for saved search notifications
        processSavedSearchNotifications(savedListing);

        return listingResponse;
    }

    /**
     * Validate that user can create a listing (checks both dealer and regular user limits).
     */
    private void validateDealerCanCreateListing(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Check if user is a dealer
        if (dealerService.isDealer(user)) {
            // Dealer validation - check trial/subscription limits
            Dealer dealer = dealerService.getDealerByUserId(user.getId())
                .orElseThrow(() -> new com.autotrader.autotraderbackend.exception.dealer.DealerNotFoundException(user.getId()));

            // Check if dealer can create listing (trial/subscription limits)
            if (!dealerTrialService.canCreateListing(dealer)) {
                int listingsUsed = dealer.getTrialListingsCount();
                String tier = dealer.getSubscriptionTier();

                if ("trial".equals(tier)) {
                    throw new com.autotrader.autotraderbackend.exception.dealer.TrialExpiredException(listingsUsed, 15);
                } else if ("suspended".equals(dealer.getSubscriptionStatus())) {
                    throw new com.autotrader.autotraderbackend.exception.dealer.TrialExpiredException(tier, true);
                } else {
                    throw new com.autotrader.autotraderbackend.exception.dealer.SubscriptionLimitExceededException(tier, listingsUsed, 100);
                }
            }

            log.debug("Dealer {} validated - can create listing. Trial: {}, Used: {}",
                dealer.getId(), dealer.isOnTrial(), dealer.getTrialListingsCount());
        } else {
            // Regular user validation - check listing limit
            long activeListings = carListingRepository.countActiveListingsByUser(user);
            
            if (activeListings >= regularUserListingLimit) {
                log.warn("Regular user {} hit listing limit: {}/{}", 
                    username, activeListings, regularUserListingLimit);
                throw new RegularUserListingLimitException(username, (int) activeListings, regularUserListingLimit);
            }
            
            log.debug("Regular user {} validated - can create listing. Active: {}/{}",
                username, activeListings, regularUserListingLimit);
        }
    }

    /**
     * Track listing creation (increment trial counter for dealers on trial).
     */
    private void trackListingCreation(String username) {
        User user = userRepository.findByUsername(username)
            .orElse(null);

        if (user != null && dealerService.isDealer(user)) {
            Dealer dealer = dealerService.getDealerByUserId(user.getId())
                .orElse(null);

            if (dealer != null && dealer.isOnTrial()) {
                dealerTrialService.incrementListingCount(dealer);
                log.info("Incremented trial listing count for dealer {}: {}/15",
                    dealer.getId(), dealer.getTrialListingsCount());
            }
        }
    }

    /**
     * Process saved search notifications for a new listing.
     */
    private void processSavedSearchNotifications(CarListing listing) {
        try {
            savedSearchService.processNewListingForNotifications(listing);
            log.debug("Successfully processed saved search notifications for listing ID: {}", listing.getId());
            } catch (Exception e) {
            log.error("Failed to process saved search notifications for new listing {}: {}",
                     listing.getId(), e.getMessage(), e);
            // Don't fail the listing creation if notification processing fails
        }
    }

    /**
     * Upload initial media for a newly created listing.
     */
    private void uploadInitialMediaForListing(Long listingId, MultipartFile image, String username) {
        try {
            String originalFilename = image.getOriginalFilename();
            if (StringUtils.isBlank(originalFilename)) {
                log.warn("Image for listing ID {} has a blank original filename. Skipping image processing.", listingId);
                return;
            }

            // Delegate media upload to media service
            carListingMediaService.uploadListingImage(listingId, image, username);
            log.info("Successfully uploaded initial image for new listing ID: {}", listingId);

        } catch (StorageException e) {
            log.error("Failed to upload image for listing ID {}: {}. Error: {}",
                     listingId, e.getMessage(), e.getCause() != null ? e.getCause().getMessage() : "N/A", e);
        } catch (Exception e) {
            log.error("Unexpected error during image handling for listing ID {}: {}", listingId, e.getMessage(), e);
        }
    }

    /**
     * Legacy method for backward compatibility - now delegates to {@link #createListingWithMedia(CreateListingRequest, MultipartFile, String)}.
     * @deprecated Since 1.0. Use {@link #createListingWithMedia(CreateListingRequest, MultipartFile, String)} for new code. This method will be removed in a future release.
     */
    @Transactional
    @Deprecated(since = "1.0", forRemoval = true)
    public CarListingResponse createListing(CreateListingRequest request, MultipartFile image, String username) {
        return createListingWithMedia(request, image, username);
    }

    /**
     * Upload an image for a car listing.
     */
    @Transactional
    public String uploadListingImage(Long listingId, MultipartFile file, String username) {
        return carListingMediaService.uploadListingImage(listingId, file, username);
    }

    /**
     * Upload video file to a car listing following AutoTrader patterns
     */
    @Transactional
    public String uploadListingVideo(Long listingId, MultipartFile file, String username) {
        return carListingMediaService.uploadListingVideo(listingId, file, username);
    }

    /**
     * Generic method for uploading media (images or videos) to car listings
     */
    @Transactional
    public String uploadListingMedia(Long listingId, MultipartFile file, String username, String mediaType) {
        return carListingMediaService.uploadListingMedia(listingId, file, username, mediaType);
    }

    /**
     * Get car listing details by ID. Only returns approved listings.
     */
    @Transactional(readOnly = true)
    public CarListingResponse getListingById(Long id) {
        return crudService.getListingById(id);
    }

    /**
     * Get all approved listings with pagination.
     * By default, this excludes listings that are sold or archived.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getAllApprovedListings(Pageable pageable) {
        return queryService.getAllApprovedListings(pageable);
    }

    /**
     * Get the count of all approved listings.
     * By default, this excludes listings that are sold or archived.
     */
    @Transactional(readOnly = true)
    public long getApprovedListingsCount() {
        return queryService.getApprovedListingsCount();
    }

    /**
     * Get filtered and approved listings based on criteria.
     * If isSold is not specified in filterRequest, defaults to false (not sold).
     * If isArchived is not specified in filterRequest, defaults to false (not archived).
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getFilteredListings(ListingFilterRequest filterRequest, Pageable pageable) {
        return queryService.getFilteredListings(filterRequest, pageable);
    }

    /**
     * Get the count of filtered and approved listings based on criteria.
     * If isSold is not specified in filterRequest, defaults to false (not sold).
     * If isArchived is not specified in filterRequest, defaults to false (not archived).
     */
    @Transactional(readOnly = true)
    public long getFilteredListingsCount(ListingFilterRequest filterRequest) {
        return queryService.getFilteredListingsCount(filterRequest);
    }

    /**
     * Get filter breakdown showing counts for each filter option.
     * This is useful for displaying counts next to filter options in the UI.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getFilterBreakdown(ListingFilterRequest existingFilters) {
        return analyticsService.getFilterBreakdown(existingFilters);
    }

    /**
     * Get count of listings grouped by model year for filter dropdown.
     * Returns years in descending order (newest first) like AutoTrader UK.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByYear(ListingFilterRequest filterRequest) {
        return analyticsService.getCountsByYear(filterRequest);
    }

    /**
     * Get count of listings grouped by brand.
     * Optimized to use database queries when possible.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByBrand(ListingFilterRequest filterRequest) {
        return analyticsService.getCountsByBrand(filterRequest);
    }

    /**
     * Get count of listings grouped by model.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByModel(ListingFilterRequest filterRequest) {
        return analyticsService.getCountsByModel(filterRequest);
    }

    /**
     * Get count of listings by seller type with optimized approach.
     * Uses direct database queries when possible, falls back to specification filtering when needed.
     */
    public Map<String, Long> getCountsBySellerType(ListingFilterRequest filterRequest) {
        try {
            return analyticsService.getCountsBySellerType(filterRequest);
        } catch (Exception e) {
            log.error("Error getting seller type counts: {}", e.getMessage(), e);
            return Collections.emptyMap();
        }
    }


    /**
     * Get count of listings by fuel type with optimized approach.
     * Uses direct database queries when possible, falls back to specification filtering when needed.
     */
    public Map<String, Long> getCountsByFuelType(ListingFilterRequest filterRequest) {
        try {
            return analyticsService.getCountsByFuelType(filterRequest);
        } catch (Exception e) {
            log.error("Error getting fuel type counts: {}", e.getMessage(), e);
            return Collections.emptyMap();
        }
    }


    /**
     * Get count of listings grouped by transmission.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByTransmission(ListingFilterRequest filterRequest) {
        return analyticsService.getCountsByTransmission(filterRequest);
    }





    /**
     * Get all listings (approved or not) for the specified user.
     * This method does NOT automatically filter by isSold or isArchived,
     * allowing users to see all their listings regardless of state.
     */
    @Transactional(readOnly = true)
    public List<CarListingResponse> getMyListings(String username) {
        return crudService.getMyListings(username);
    }

    /**
     * Update an existing car listing.
     *
     * @param id         The ID of the car listing to update
     * @param request    Updated listing details
     * @param username   The username of the user making the request
     * @return The updated CarListingResponse
     * @throws ResourceNotFoundException If the listing does not exist
     * @throws SecurityException If the user does not own the listing and is not an admin
     */
    @Transactional
    public CarListingResponse updateListing(Long id, UpdateListingRequest request, String username) {
        return crudService.updateListing(id, request, username);
    }

    /**
     * Delete a car listing.
     *
     * @param id         The ID of the car listing to delete
     * @param username   The username of the user making the request
     * @throws ResourceNotFoundException If the listing does not exist
     * @throws SecurityException If the user does not own the listing
     */
    @Transactional
    public void deleteListing(Long id, String username) {
        // If listing has media, delete all media files from storage first
        carListingMediaService.deleteListingMedia(id);

        // Then delete the listing itself
        crudService.deleteListing(id, username);
    }

    /**
     * Admin-only method to delete any car listing.
     *
     * @param id The ID of the car listing to delete
     * @throws ResourceNotFoundException If the listing does not exist
     */
    @Transactional
    public void deleteListingAsAdmin(Long id) {
        // If listing has media, delete all media files from storage first
        carListingMediaService.deleteListingMedia(id);

        // Then delete the listing itself
        crudService.deleteListingAsAdmin(id);
    }

    /**
     * Admin-only method to approve any car listing.
     * @param id the ID of the listing to approve
     * @return the approved listing response
     * @throws ResourceNotFoundException if the listing is not found
     */
    public CarListingResponse approveListingAsAdmin(Long id) {
        return crudService.approveListingAsAdmin(id);
    }

    /**
     * Admin-only method to get all car listings regardless of approval status.
     * @param pageable pagination information
     * @return paginated list of all car listings
     */
    public Page<CarListingResponse> getAllListingsAsAdmin(Pageable pageable) {
        return crudService.getAllListingsAsAdmin(pageable);
    }
}