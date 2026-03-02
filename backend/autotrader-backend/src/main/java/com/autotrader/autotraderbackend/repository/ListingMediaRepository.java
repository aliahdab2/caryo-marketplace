package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.ListingMedia.ModerationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // ============ Moderation queries ============

    /**
     * Find all media with a specific moderation status (paginated)
     * Used for admin moderation queue
     */
    Page<ListingMedia> findByModerationStatusOrderByCreatedAtAsc(
            ModerationStatus status, Pageable pageable);

    /**
     * Find pending media (for moderation queue)
     */
    default Page<ListingMedia> findPendingMedia(Pageable pageable) {
        return findByModerationStatusOrderByCreatedAtAsc(ModerationStatus.PENDING, pageable);
    }

    /**
     * Count pending media items (for dashboard badge)
     */
    long countByModerationStatus(ModerationStatus status);

    /**
     * Find approved media for a listing (public view)
     */
    List<ListingMedia> findByListingIdAndModerationStatusOrderBySortOrderAsc(
            Long listingId, ModerationStatus status);

    /**
     * Find approved media for a listing (convenience method)
     */
    default List<ListingMedia> findApprovedMediaByListingId(Long listingId) {
        return findByListingIdAndModerationStatusOrderBySortOrderAsc(
                listingId, ModerationStatus.APPROVED);
    }

    /**
     * Find primary approved media for a listing
     */
    @Query("SELECT m FROM ListingMedia m WHERE m.listingId = :listingId " +
           "AND m.isPrimary = true AND m.moderationStatus = 'APPROVED'")
    List<ListingMedia> findApprovedPrimaryMedia(@Param("listingId") Long listingId);

    /**
     * Count pending media for dashboard statistics
     */
    default long countPendingMedia() {
        return countByModerationStatus(ModerationStatus.PENDING);
    }

    /**
     * Find pending media by IDs (for batch moderation operations).
     * Avoids N+1 queries by fetching all items in one query.
     */
    @Query("SELECT m FROM ListingMedia m WHERE m.id IN :ids AND m.moderationStatus = 'PENDING'")
    List<ListingMedia> findPendingByIdIn(@Param("ids") List<Long> ids);
}
