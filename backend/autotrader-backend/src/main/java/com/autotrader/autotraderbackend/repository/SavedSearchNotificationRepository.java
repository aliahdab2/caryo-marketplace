package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.SavedSearch;
import com.autotrader.autotraderbackend.model.SavedSearchNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SavedSearchNotificationRepository extends JpaRepository<SavedSearchNotification, UUID> {

    /**
     * Check if a notification has already been sent for a specific saved search and listing combination
     */
    boolean existsBySavedSearchAndListing(SavedSearch savedSearch, CarListing listing);

    /**
     * Find all notifications for a saved search
     */
    List<SavedSearchNotification> findBySavedSearchOrderByNotifiedAtDesc(SavedSearch savedSearch);

    /**
     * Find notifications sent within a specific time period for a saved search
     */
    List<SavedSearchNotification> findBySavedSearchAndNotifiedAtAfter(SavedSearch savedSearch, LocalDateTime after);

    /**
     * Count notifications sent for a saved search within a time period
     */
    long countBySavedSearchAndNotifiedAtAfter(SavedSearch savedSearch, LocalDateTime after);

    /**
     * Delete old notifications to prevent table growth (cleanup)
     */
    @Query("DELETE FROM SavedSearchNotification ssn WHERE ssn.notifiedAt < :cutoffDate")
    void deleteNotificationsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}
