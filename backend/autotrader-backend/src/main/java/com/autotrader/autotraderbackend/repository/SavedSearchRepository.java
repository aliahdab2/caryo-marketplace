package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.SavedSearch;
import com.autotrader.autotraderbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SavedSearchRepository extends JpaRepository<SavedSearch, UUID> {

    /**
     * Find all active saved searches for a user
     */
    List<SavedSearch> findByUserAndIsActiveTrueOrderByCreatedAtDesc(User user);

    /**
     * Find all saved searches for a user (including inactive)
     */
    List<SavedSearch> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Find a saved search by ID and user (for security)
     */
    SavedSearch findByIdAndUser(UUID id, User user);

    /**
     * Find all active saved searches that are eligible for immediate notifications.
     * Business logic filtering (email enabled, frequency) is handled in the service layer.
     */
    @Query("SELECT ss FROM SavedSearch ss WHERE ss.isActive = true")
    List<SavedSearch> findActiveSearchesForImmediateNotification();

    /**
     * Find saved searches that haven't been notified recently and are due for periodic notifications.
     * Business logic filtering (email enabled, frequency) is handled in the service layer.
     */
    @Query("SELECT ss FROM SavedSearch ss WHERE ss.isActive = true " +
           "AND (ss.lastNotifiedAt IS NULL OR ss.lastNotifiedAt < :cutoffTime)")
    List<SavedSearch> findSearchesDueForPeriodicNotification(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Count active saved searches for a user
     */
    long countByUserAndIsActiveTrue(User user);
}
