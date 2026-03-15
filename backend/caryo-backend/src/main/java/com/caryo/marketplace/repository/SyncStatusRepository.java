package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for managing {@link SyncStatus} entities.
 */
@Repository
public interface SyncStatusRepository extends JpaRepository<SyncStatus, Long> {
    Optional<SyncStatus> findByProviderName(String providerName);
}
