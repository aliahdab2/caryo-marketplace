package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingModerationAction;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.ListingModerationActionRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Service for managing listing moderation actions.
 * This service handles all admin moderation activities while keeping
 * the CarListing table clean and providing complete audit trail.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ListingModerationService {

    private final ListingModerationActionRepository moderationRepository;
    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;

    // Action type constants
    public static final String ACTION_HIDE = "HIDE";
    public static final String ACTION_UNHIDE = "UNHIDE";
    public static final String ACTION_APPROVE = "APPROVE";
    public static final String ACTION_REJECT = "REJECT";
    public static final String ACTION_REQUEST_CHANGES = "REQUEST_CHANGES";
    public static final String ACTION_MARK_SOLD = "MARK_SOLD";
    public static final String ACTION_UNMARK_SOLD = "UNMARK_SOLD";
    public static final String ACTION_ARCHIVE = "ARCHIVE";
    public static final String ACTION_UNARCHIVE = "UNARCHIVE";
    public static final String ACTION_EXPIRE = "EXPIRE";

    /**
     * Hide a listing by admin with reason and audit trail.
     */
    @Transactional
    public void hideListingAsAdmin(Long listingId, String reason, String adminUsername) {
        log.info("Admin {} attempting to hide listing ID: {} with reason: {}", adminUsername, listingId, reason);

        CarListing listing = findListingById(listingId);
        User admin = findUserByUsername(adminUsername);

        // Allow idempotent hide: create a new HIDE action even if currently hidden
        // This preserves a full audit trail of repeated actions

        // Validate business rules
        validateListingForHiding(listing);

        // Deactivate any previous hide/unhide actions
        moderationRepository.deactivatePreviousActions(listingId, ACTION_HIDE);
        moderationRepository.deactivatePreviousActions(listingId, ACTION_UNHIDE);

        // Create new hide action
        ListingModerationAction hideAction = new ListingModerationAction(
            listing, ACTION_HIDE, reason, admin
        );
        moderationRepository.save(hideAction);

        log.info("Admin {} successfully hidden listing ID: {} with reason: {}", adminUsername, listingId, reason);
    }

    /**
     * Unhide a listing by admin.
     */
    @Transactional
    public void unhideListingAsAdmin(Long listingId, String adminUsername) {
        log.info("Admin {} attempting to unhide listing ID: {}", adminUsername, listingId);

        CarListing listing = findListingById(listingId);
        User admin = findUserByUsername(adminUsername);

        // Allow idempotent unhide: create a new UNHIDE action even if not currently hidden
        // This preserves a full audit trail and makes the operation idempotent

        // Deactivate previous hide/unhide actions
        moderationRepository.deactivatePreviousActions(listingId, ACTION_HIDE);
        moderationRepository.deactivatePreviousActions(listingId, ACTION_UNHIDE);

        // Create new unhide action
        ListingModerationAction unhideAction = new ListingModerationAction(
            listing, ACTION_UNHIDE, "Unhidden by admin", admin
        );
        moderationRepository.save(unhideAction);

        log.info("Admin {} successfully unhidden listing ID: {}", adminUsername, listingId);
    }

    /**
     * Check if a listing is currently hidden by admin.
     */
    public boolean isListingHiddenByAdmin(Long listingId) {
        return moderationRepository.isListingHiddenByAdmin(listingId);
    }



    /**
     * Get all listing IDs that are currently hidden by admin.
     * This is used for filtering public listings.
     */
    public Set<Long> getHiddenListingIds() {
        List<Long> hiddenIds = moderationRepository.findAllHiddenListingIds();
        return Set.copyOf(hiddenIds);
    }

    /**
     * Get complete moderation history for a listing.
     */
    public List<ListingModerationAction> getModerationHistory(Long listingId) {
        return moderationRepository.findByListingIdOrderByPerformedAtDesc(listingId);
    }

    /**
     * Get active moderation actions for a listing.
     */
    public List<ListingModerationAction> getActiveModerationActions(Long listingId) {
        return moderationRepository.findByListingIdAndIsActiveTrueOrderByPerformedAtDesc(listingId);
    }

    /**
     * Check if a listing is approved based on moderation actions.
     * A listing is approved if the latest APPROVE/REJECT action is APPROVE.
     */
    public boolean isListingApproved(Long listingId) {
        // Hybrid approach: if the listing is already approved at the entity level,
        // consider it approved for performance-critical checks.
        try {
            CarListing listing = carListingRepository.findById(listingId).orElse(null);
            if (listing != null && Boolean.TRUE.equals(listing.getApproved())) {
                return true;
            }
        } catch (Exception ignored) {
            // Fallback to action-based logic if repository call fails during shutdown/cleanup
        }

        var approveAction = moderationRepository.findLatestActiveActionByType(listingId, ACTION_APPROVE);
        var rejectAction = moderationRepository.findLatestActiveActionByType(listingId, ACTION_REJECT);

        // If no actions, listing is pending (not approved)
        if (approveAction.isEmpty() && rejectAction.isEmpty()) {
            return false;
        }

        // If only approve action exists
        if (approveAction.isPresent() && rejectAction.isEmpty()) {
            return true;
        }

        // If only reject action exists
        if (rejectAction.isPresent() && approveAction.isEmpty()) {
            return false;
        }

        // If both exist, check which is more recent
        if (approveAction.isPresent() && rejectAction.isPresent()) {
            return approveAction.get().getPerformedAt().isAfter(rejectAction.get().getPerformedAt());
        }

        return false;
    }

    /**
     * Check if a listing is sold based on moderation actions.
     */
    public boolean isListingSold(Long listingId) {
        var soldAction = moderationRepository.findLatestActiveActionByType(listingId, ACTION_MARK_SOLD);
        var unsoldAction = moderationRepository.findLatestActiveActionByType(listingId, ACTION_UNMARK_SOLD);
        
        if (soldAction.isEmpty()) return false;
        if (unsoldAction.isEmpty()) return true;
        
        return soldAction.get().getPerformedAt().isAfter(unsoldAction.get().getPerformedAt());
    }

    /**
     * Check if a listing is archived based on moderation actions.
     */
    public boolean isListingArchived(Long listingId) {
        var archiveAction = moderationRepository.findLatestActiveActionByType(listingId, ACTION_ARCHIVE);
        var unarchiveAction = moderationRepository.findLatestActiveActionByType(listingId, ACTION_UNARCHIVE);
        
        if (archiveAction.isEmpty()) return false;
        if (unarchiveAction.isEmpty()) return true;
        
        return archiveAction.get().getPerformedAt().isAfter(unarchiveAction.get().getPerformedAt());
    }

    /**
     * Check if a listing is expired based on moderation actions.
     */
    public boolean isListingExpired(Long listingId) {
        return moderationRepository.findLatestActiveActionByType(listingId, ACTION_EXPIRE).isPresent();
    }

    /**
     * Get the computed status of a listing based on all moderation actions.
     * This replaces the need for multiple boolean fields.
     */
    public String getListingStatus(Long listingId) {
        if (isListingExpired(listingId)) return "EXPIRED";
        if (isListingArchived(listingId)) return "ARCHIVED";
        if (isListingSold(listingId)) return "SOLD";
        if (isListingHiddenByAdmin(listingId)) return "HIDDEN";
        if (!isListingApproved(listingId)) return "PENDING";
        return "ACTIVE";
    }

    // Helper methods
    private CarListing findListingById(Long listingId) {
        return carListingRepository.findById(listingId)
            .orElseThrow(() -> {
                log.warn("Listing not found with ID: {}", listingId);
                return new ResourceNotFoundException("CarListing", "id", listingId);
            });
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> {
                log.warn("User not found with username: {}", username);
                return new ResourceNotFoundException("User", "username", username);
            });
    }

    private void validateListingForHiding(CarListing listing) {
        // Add business validation rules here
        // For example: can't hide already sold listings, etc.
        Long listingId = listing.getId();
        
        if (isListingSold(listingId)) {
            throw new IllegalStateException("Cannot hide a listing that is already sold");
        }
        
        if (isListingArchived(listingId)) {
            throw new IllegalStateException("Cannot hide a listing that is already archived");
        }
    }

    /**
     * Mark a listing as sold (by owner or admin).
     */
    @Transactional
    public void markListingAsSold(Long listingId, String username) {
        log.info("User {} attempting to mark listing ID {} as sold", username, listingId);

        CarListing listing = findListingById(listingId);
        User user = findUserByUsername(username);

        // Deactivate any previous sold/unsold actions
        moderationRepository.deactivatePreviousActions(listingId, ACTION_MARK_SOLD);
        moderationRepository.deactivatePreviousActions(listingId, ACTION_UNMARK_SOLD);

        // Create new mark sold action
        ListingModerationAction soldAction = new ListingModerationAction(
            listing, ACTION_MARK_SOLD, "Marked as sold", user
        );
        moderationRepository.save(soldAction);

        log.info("User {} successfully marked listing ID {} as sold", username, listingId);
    }

    /**
     * Unmark a listing as sold (by owner or admin).
     */
    @Transactional
    public void unmarkListingAsSold(Long listingId, String username) {
        log.info("User {} attempting to unmark listing ID {} as sold", username, listingId);

        CarListing listing = findListingById(listingId);
        User user = findUserByUsername(username);

        // Deactivate any previous sold/unsold actions
        moderationRepository.deactivatePreviousActions(listingId, ACTION_MARK_SOLD);
        moderationRepository.deactivatePreviousActions(listingId, ACTION_UNMARK_SOLD);

        // Create new unmark sold action
        ListingModerationAction unsoldAction = new ListingModerationAction(
            listing, ACTION_UNMARK_SOLD, "Unmarked as sold", user
        );
        moderationRepository.save(unsoldAction);

        log.info("User {} successfully unmarked listing ID {} as sold", username, listingId);
    }

    /**
     * Archive a listing (by owner or admin).
     */
    @Transactional
    public void archiveListing(Long listingId, String username) {
        log.info("User {} attempting to archive listing ID {}", username, listingId);

        CarListing listing = findListingById(listingId);
        User user = findUserByUsername(username);

        // Deactivate any previous archive/unarchive actions
        moderationRepository.deactivatePreviousActions(listingId, ACTION_ARCHIVE);
        moderationRepository.deactivatePreviousActions(listingId, ACTION_UNARCHIVE);

        // Create new archive action
        ListingModerationAction archiveAction = new ListingModerationAction(
            listing, ACTION_ARCHIVE, "Archived", user
        );
        moderationRepository.save(archiveAction);

        log.info("User {} successfully archived listing ID {}", username, listingId);
    }

    /**
     * Unarchive a listing (by owner or admin).
     */
    @Transactional
    public void unarchiveListing(Long listingId, String username) {
        log.info("User {} attempting to unarchive listing ID {}", username, listingId);

        CarListing listing = findListingById(listingId);
        User user = findUserByUsername(username);

        // Deactivate any previous archive/unarchive actions
        moderationRepository.deactivatePreviousActions(listingId, ACTION_ARCHIVE);
        moderationRepository.deactivatePreviousActions(listingId, ACTION_UNARCHIVE);

        // Create new unarchive action
        ListingModerationAction unarchiveAction = new ListingModerationAction(
            listing, ACTION_UNARCHIVE, "Unarchived", user
        );
        moderationRepository.save(unarchiveAction);

        log.info("User {} successfully unarchived listing ID {}", username, listingId);
    }

    /**
     * Expire a listing (system action).
     */
    @Transactional
    public void expireListing(Long listingId) {
        log.info("System attempting to expire listing ID {}", listingId);

        CarListing listing = findListingById(listingId);
        
        // Create new expire action (use system user or admin)
        ListingModerationAction expireAction = new ListingModerationAction();
        expireAction.setListing(listing);
        expireAction.setActionType(ACTION_EXPIRE);
        expireAction.setReason("Expired by system");
        expireAction.setIsActive(true);
        
        moderationRepository.save(expireAction);

        log.info("System successfully expired listing ID {}", listingId);
    }
}
