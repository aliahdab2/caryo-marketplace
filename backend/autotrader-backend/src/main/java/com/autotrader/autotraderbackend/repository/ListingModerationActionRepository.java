package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.ListingModerationAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for managing listing moderation actions.
 * Provides methods to track and query admin moderation activities.
 */
@Repository
public interface ListingModerationActionRepository extends JpaRepository<ListingModerationAction, Long> {

    /**
     * Find all moderation actions for a specific listing, ordered by most recent first.
     */
    List<ListingModerationAction> findByListingIdOrderByPerformedAtDesc(Long listingId);

    /**
     * Find the most recent active moderation action of a specific type for a listing.
     * This is useful to check current status (e.g., is listing currently hidden?).
     */
    @Query("SELECT lma FROM ListingModerationAction lma WHERE lma.listing.id = :listingId " +
           "AND lma.actionType = :actionType AND lma.isActive = true " +
           "ORDER BY lma.performedAt DESC")
    Optional<ListingModerationAction> findLatestActiveActionByType(@Param("listingId") Long listingId, 
                                                                   @Param("actionType") String actionType);

    /**
     * Check if a listing is currently hidden by admin using latest-action-wins approach.
     * Returns true if the latest HIDE action is more recent than the latest UNHIDE action.
     */
    @Query("SELECT CASE WHEN " +
           "(SELECT MAX(lma1.performedAt) FROM ListingModerationAction lma1 " +
           " WHERE lma1.listing.id = :listingId AND lma1.actionType = 'HIDE' AND lma1.isActive = true) > " +
           "(SELECT MAX(lma2.performedAt) FROM ListingModerationAction lma2 " +
           " WHERE lma2.listing.id = :listingId AND lma2.actionType = 'UNHIDE' AND lma2.isActive = true) " +
           "THEN true ELSE false END")
    boolean isListingHiddenByAdmin(@Param("listingId") Long listingId);

    /**
     * Check if a listing is currently sold using latest-action-wins approach.
     * Returns true if the latest MARK_SOLD action is more recent than the latest UNMARK_SOLD action.
     */
    @Query("SELECT CASE WHEN " +
           "(SELECT MAX(lma1.performedAt) FROM ListingModerationAction lma1 " +
           " WHERE lma1.listing.id = :listingId AND lma1.actionType = 'MARK_SOLD' AND lma1.isActive = true) > " +
           "COALESCE((SELECT MAX(lma2.performedAt) FROM ListingModerationAction lma2 " +
           " WHERE lma2.listing.id = :listingId AND lma2.actionType = 'UNMARK_SOLD' AND lma2.isActive = true), " +
           " CAST('1970-01-01 00:00:00' AS TIMESTAMP)) " +
           "THEN true ELSE false END")
    boolean isListingSoldByLatestAction(@Param("listingId") Long listingId);

    /**
     * Check if a listing is currently archived using latest-action-wins approach.
     * Returns true if the latest ARCHIVE action is more recent than the latest UNARCHIVE action.
     */
    @Query("SELECT CASE WHEN " +
           "(SELECT MAX(lma1.performedAt) FROM ListingModerationAction lma1 " +
           " WHERE lma1.listing.id = :listingId AND lma1.actionType = 'ARCHIVE' AND lma1.isActive = true) > " +
           "COALESCE((SELECT MAX(lma2.performedAt) FROM ListingModerationAction lma2 " +
           " WHERE lma2.listing.id = :listingId AND lma2.actionType = 'UNARCHIVE' AND lma2.isActive = true), " +
           " CAST('1970-01-01 00:00:00' AS TIMESTAMP)) " +
           "THEN true ELSE false END")
    boolean isListingArchivedByLatestAction(@Param("listingId") Long listingId);

    /**
     * Find all listings that are currently hidden by admin.
     * This is used for admin dashboard and public listing filtering.
     */
    @Query("SELECT DISTINCT lma.listing.id FROM ListingModerationAction lma " +
           "WHERE lma.actionType = 'HIDE' AND lma.isActive = true " +
           "AND NOT EXISTS (SELECT lma2 FROM ListingModerationAction lma2 " +
           "WHERE lma2.listing.id = lma.listing.id AND lma2.actionType = 'UNHIDE' " +
           "AND lma2.isActive = true AND lma2.performedAt > lma.performedAt)")
    List<Long> findAllHiddenListingIds();

    /**
     * Find all active moderation actions for a listing.
     */
    List<ListingModerationAction> findByListingIdAndIsActiveTrueOrderByPerformedAtDesc(Long listingId);

    /**
     * Find moderation actions performed by a specific admin.
     */
    List<ListingModerationAction> findByPerformedByIdOrderByPerformedAtDesc(Long adminId);

    /**
     * Deactivate all previous actions of the same type for a listing.
     * This is used when a new action supersedes previous ones.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ListingModerationAction lma SET lma.isActive = false " +
           "WHERE lma.listing.id = :listingId AND lma.actionType = :actionType AND lma.isActive = true")
    void deactivatePreviousActions(@Param("listingId") Long listingId, @Param("actionType") String actionType);

    /**
     * Batch method to get all active moderation actions for multiple listings.
     * Returns listing_id, action_type, performed_at for processing in service layer.
     */
    @Query("SELECT lma.listing.id, lma.actionType, lma.performedAt FROM ListingModerationAction lma " +
           "WHERE lma.listing.id IN :listingIds AND lma.isActive = true " +
           "AND lma.actionType IN ('HIDE', 'UNHIDE', 'MARK_SOLD', 'UNMARK_SOLD', 'ARCHIVE', 'UNARCHIVE', 'EXPIRE') " +
           "ORDER BY lma.listing.id, lma.actionType, lma.performedAt DESC")
    List<Object[]> findActiveActionsForListings(@Param("listingIds") List<Long> listingIds);
}
