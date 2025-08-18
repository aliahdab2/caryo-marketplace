package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.events.ListingApprovedEvent;
import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
import com.autotrader.autotraderbackend.events.ListingMarkedAsSoldEvent;
import com.autotrader.autotraderbackend.events.ListingExpiredEvent;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarListingStatusService {
    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final CarListingMapper carListingMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final ListingModerationService moderationService;

    /**
     * Marks a car listing as sold.
     */
    @Transactional
    public CarListingResponse markListingAsSold(Long listingId, String username) {
        log.info("User {} attempting to mark listing ID {} as sold", username, listingId);
        CarListing listing = findListingByIdAndAuthorize(listingId, username, "mark as sold");

        if (moderationService.isListingArchived(listingId)) {
            log.warn("Attempt to mark archived listing ID {} as sold by user {}", listingId, username);
            throw new IllegalStateException("Cannot mark an archived listing as sold. Please unarchive first.");
        }
        if (moderationService.isListingSold(listingId)) {
            log.warn("Listing ID {} is already marked as sold. No action taken by user {}.", listingId, username);
            return carListingMapper.toCarListingResponse(listing);
        }

        // Create moderation action for marking as sold
        moderationService.markListingAsSold(listingId, username);
        
        eventPublisher.publishEvent(new ListingMarkedAsSoldEvent(this, listing, false));
        log.info("Successfully marked listing ID {} as sold by user {}", listingId, username);
        return carListingMapper.toCarListingResponse(listing);
    }

    /**
     * Marks a car listing as sold (admin-only).
     */
    @Transactional
    public CarListingResponse markListingAsSoldByAdmin(Long listingId) {
        log.info("Admin attempting to mark listing ID {} as sold", listingId);
        CarListing listing = findListingById(listingId);

        if (moderationService.isListingArchived(listingId)) {
            log.warn("Admin attempt to mark archived listing ID {} as sold", listingId);
            throw new IllegalStateException("Cannot mark an archived listing as sold. Please unarchive first.");
        }

        if (moderationService.isListingSold(listingId)) {
            log.warn("Listing ID {} is already marked as sold. Throwing IllegalStateException.", listingId);
            throw new IllegalStateException("Listing with ID " + listingId + " is already marked as sold.");
        }

        // Create moderation action for marking as sold by admin
        moderationService.markListingAsSold(listingId, "admin");
        
        log.info("Admin successfully marked listing ID {} as sold", listingId);
        eventPublisher.publishEvent(new ListingMarkedAsSoldEvent(this, listing, true));
        
        return carListingMapper.toCarListingResponse(listing);
    }

    /**
     * Unmarks a car listing as sold by admin.
     */
    @Transactional
    public CarListingResponse unmarkSoldListingByAdmin(Long listingId) {
        log.info("Admin attempting to unmark listing ID {} as sold", listingId);
        CarListing listing = findListingById(listingId);

        if (!moderationService.isListingSold(listingId)) {
            log.warn("Listing ID {} is not marked as sold. No action taken.", listingId);
            throw new IllegalStateException("Listing is not marked as sold");
        }

        // Create moderation action for unmarking as sold by admin
        moderationService.unmarkListingAsSold(listingId, "admin");
        
        log.info("Successfully unmarked listing ID {} as sold by admin", listingId);
        return carListingMapper.toCarListingResponse(listing);
    }

    /**
     * Archives a car listing.
     */
    @Transactional
    public CarListingResponse archiveListing(Long listingId, String username) {
        log.info("User {} attempting to archive listing ID {}", username, listingId);
        CarListing listing = findListingByIdAndAuthorize(listingId, username, "archive");

        if (moderationService.isListingArchived(listingId)) {
            log.warn("Listing ID {} is already archived. No action taken by user {}.", listingId, username);
            return carListingMapper.toCarListingResponse(listing);
        }

        // Create moderation action for archiving
        moderationService.archiveListing(listingId, username);
        
        eventPublisher.publishEvent(new ListingArchivedEvent(this, listing, false));
        log.info("Published ListingArchivedEvent for listing ID: {}", listing.getId());
        
        log.info("Successfully archived listing ID {} by user {}", listingId, username);
        return carListingMapper.toCarListingResponse(listing);
    }

    /**
     * Archives a car listing (admin-only).
     */
    @Transactional
    public CarListingResponse archiveListingByAdmin(Long listingId) {
        log.info("Admin attempting to archive listing ID {}", listingId);
        CarListing listing = carListingRepository.findById(listingId)
                .orElseThrow(() -> {
                    log.warn("Admin archive failed: Listing not found with ID: {}", listingId);
                    return new ResourceNotFoundException("Car Listing", "id", listingId.toString());
                });

        if (moderationService.isListingArchived(listingId)) {
            log.warn("Listing ID {} is already archived. Admin operation aborted.", listingId);
            throw new IllegalStateException("Listing with ID " + listingId + " is already archived.");
        }

        // Create moderation action for archiving by admin
        moderationService.archiveListing(listingId, "admin");
        log.info("Admin successfully archived listing ID {}", listingId);
        eventPublisher.publishEvent(new ListingArchivedEvent(this, listing, true)); 
        log.info("Published ListingArchivedEvent for listing ID: {} (admin)", listing.getId());
        return carListingMapper.toCarListingResponse(listing);
    }

    /**
     * Unarchives a car listing.
     */
    @Transactional
    public CarListingResponse unarchiveListing(Long listingId, String username) {
        log.info("User {} attempting to unarchive listing ID {}", username, listingId);
        CarListing listing = findListingByIdAndAuthorize(listingId, username, "unarchive");

        if (!moderationService.isListingArchived(listingId)) {
            log.warn("Listing ID {} is not archived. No action taken for unarchive by user {}.", listingId, username);
            throw new IllegalStateException("Listing with ID " + listingId + " is not currently archived.");
        }

        moderationService.unarchiveListing(listingId, username);
        CarListing updatedListing = carListingRepository.save(listing);
        log.info("Successfully unarchived listing ID {} by user {}", listingId, username);
        return carListingMapper.toCarListingResponse(updatedListing);
    }

    /**
     * Unarchives a car listing (admin-only).
     */
    @Transactional
    public CarListingResponse unarchiveListingByAdmin(Long listingId) {
        log.info("Admin attempting to unarchive listing ID {}", listingId);
        CarListing listing = carListingRepository.findById(listingId)
                .orElseThrow(() -> {
                    log.warn("Admin unarchive failed: Listing not found with ID: {}", listingId);
                    return new ResourceNotFoundException("Car Listing", "id", listingId.toString());
                });

        if (!moderationService.isListingArchived(listingId)) {
            log.warn("Listing ID {} is not archived. No action taken for unarchive by admin.", listingId);
            throw new IllegalStateException("Listing with ID " + listingId + " is not currently archived.");
        }

        moderationService.unarchiveListing(listingId, "admin");
        CarListing updatedListing = carListingRepository.save(listing);
        log.info("Admin successfully unarchived listing ID {}", listingId);
        return carListingMapper.toCarListingResponse(updatedListing);
    }

    /**
     * Pauses a car listing (sets isUserActive to false).
     */
    @Transactional
    public CarListingResponse pauseListing(Long listingId, String username) {
        log.info("User {} attempting to pause listing ID {}", username, listingId);
        CarListing listing = findListingByIdAndAuthorize(listingId, username, "pause");

        if (!listing.getApproved()) {
            log.warn("User {} attempted to pause unapproved listing ID {}", username, listingId);
            throw new IllegalStateException("Cannot pause a listing that is not yet approved.");
        }
        if (moderationService.isListingSold(listingId)) {
            log.warn("User {} attempted to pause sold listing ID {}", username, listingId);
            throw new IllegalStateException("Cannot pause a listing that has been marked as sold.");
        }
        if (moderationService.isListingArchived(listingId)) {
            log.warn("User {} attempted to pause archived listing ID {}", username, listingId);
            throw new IllegalStateException("Cannot pause a listing that has been archived.");
        }
        if (!listing.getIsUserActive()) {
            log.info("Listing ID {} is already paused by user {}. No action needed.", listingId, username);
            return carListingMapper.toCarListingResponse(listing);
        }

        listing.setIsUserActive(false);
        CarListing updatedListing = carListingRepository.save(listing);
        log.info("Successfully paused listing ID {} by user {}", listingId, username);
        return carListingMapper.toCarListingResponse(updatedListing);
    }

    /**
     * Resumes a car listing (sets isUserActive to true).
     */
    @Transactional
    public CarListingResponse resumeListing(Long listingId, String username) {
        log.info("User {} attempting to resume listing ID {}", username, listingId);
        CarListing listing = findListingByIdAndAuthorize(listingId, username, "resume");

        if (moderationService.isListingSold(listingId)) {
            log.warn("User {} attempted to resume sold listing ID {}", username, listingId);
            throw new IllegalStateException("Cannot resume a listing that has been marked as sold.");
        }
        if (moderationService.isListingArchived(listingId)) {
            log.warn("User {} attempted to resume archived listing ID {}", username, listingId);
            throw new IllegalStateException("Cannot resume a listing that has been archived. Please contact support or renew if applicable.");
        }
        if (listing.getIsUserActive()) {
            log.info("Listing ID {} is already active for user {}. No action needed.", listingId, username);
            return carListingMapper.toCarListingResponse(listing);
        }

        listing.setIsUserActive(true);
        CarListing updatedListing = carListingRepository.save(listing);
        log.info("Successfully resumed listing ID {} by user {}", listingId, username);
        return carListingMapper.toCarListingResponse(updatedListing);
    }

    /**
     * Approve a car listing.
     */
    @Transactional
    public CarListingResponse approveListing(Long id) {
        log.info("Attempting to approve listing with ID: {}", id);
        CarListing carListing = findListingById(id); 

        if (Boolean.TRUE.equals(carListing.getApproved())) {
            log.warn("Listing ID {} is already approved. Admin operation aborted.", id);
            throw new IllegalStateException("Listing with ID " + id + " is already approved.");
        }

        carListing.setApproved(true);
        CarListing approvedListing = carListingRepository.save(carListing);
        log.info("Successfully approved listing ID: {}", approvedListing.getId());

        eventPublisher.publishEvent(new ListingApprovedEvent(this, approvedListing)); 
        log.info("Published ListingApprovedEvent for listing ID: {}", approvedListing.getId());

        return carListingMapper.toCarListingResponse(approvedListing);
    }

    /**
     * Marks a car listing as expired.
     */
    @Transactional
    public CarListingResponse expireListing(Long listingId) {
        log.info("Attempting to expire listing ID {}", listingId);
        CarListing listing = findListingById(listingId);

        // Check if already expired
        if (moderationService.isListingExpired(listingId)) {
            log.warn("Listing ID {} is already expired. No action taken.", listingId);
            throw new IllegalStateException("Listing is already expired");
        }

        // Check if archived
        if (moderationService.isListingArchived(listingId)) {
            log.warn("Cannot expire archived listing ID {}", listingId);
            throw new IllegalStateException("Cannot expire an archived listing");
        }

        // Check if sold
        if (moderationService.isListingSold(listingId)) {
            log.warn("Cannot expire sold listing ID {}", listingId);
            throw new IllegalStateException("Cannot expire a sold listing");
        }

        moderationService.expireListing(listingId);
        listing.setIsUserActive(false); // Deactivate the listing

        CarListing updatedListing = carListingRepository.save(listing);
        
        eventPublisher.publishEvent(new ListingExpiredEvent(this, updatedListing, true));
        log.info("Successfully expired listing ID {}", listingId);
        
        return carListingMapper.toCarListingResponse(updatedListing);
    }

    // --- Helper Methods ---

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User lookup failed for username: {}", username);
                    return new ResourceNotFoundException("User", "username", username);
                });
    }

    private CarListing findListingById(Long listingId) {
        return carListingRepository.findById(listingId)
                .orElseThrow(() -> {
                    log.warn("CarListing lookup failed for ID: {}", listingId);
                    return new ResourceNotFoundException("Car Listing", "id", String.valueOf(listingId));
                });
    }

    private void authorizeListingModification(CarListing listing, User user, String action) {
        if (listing.getSeller() == null || !listing.getSeller().getId().equals(user.getId())) {
            log.warn("Authorization failed: User '{}' (ID: {}) attempted to {} listing ID {} owned by '{}' (ID: {})",
                     user.getUsername(), user.getId(), action, listing.getId(),
                     listing.getSeller() != null ? listing.getSeller().getUsername() : "unknown",
                     listing.getSeller() != null ? listing.getSeller().getId() : "unknown");
            throw new SecurityException("User does not have permission to modify this listing.");
        }
    }

    private CarListing findListingByIdAndAuthorize(Long listingId, String username, String action) {
        User user = findUserByUsername(username);
        CarListing listing = findListingById(listingId);
        authorizeListingModification(listing, user, action);
        return listing;
    }
}
