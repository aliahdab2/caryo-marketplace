package com.caryo.marketplace.service;

import com.caryo.marketplace.model.SyncState;
import com.caryo.marketplace.model.SyncStatus;
import com.caryo.marketplace.repository.SyncStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for managing the persistent sync status of data providers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SyncStatusService {

    private final SyncStatusRepository syncStatusRepository;

    @Transactional
    public SyncStatus createOrUpdateSyncStatus(String providerName, SyncState status, String message, Long totalSynced, Long totalFailed, LocalDateTime startTime) {
        Optional<SyncStatus> existingStatus = syncStatusRepository.findByProviderName(providerName);
        SyncStatus syncStatus;

        if (existingStatus.isPresent()) {
            syncStatus = existingStatus.get();
            log.debug("Updating sync status for provider {}: old status {}, new status {}", providerName, syncStatus.getStatus(), status);
        } else {
            syncStatus = new SyncStatus();
            syncStatus.setProviderName(providerName);
            log.debug("Creating new sync status for provider {}: status {}", providerName, status);
        }

        syncStatus.setStatus(status);
        syncStatus.setLastSyncMessage(message);
        syncStatus.setTotalRecordsSynced(totalSynced);
        syncStatus.setTotalRecordsFailed(totalFailed);

        // Update last sync time only if the status is not IN_PROGRESS or changes to IN_PROGRESS
        if (status != SyncState.IN_PROGRESS) {
            syncStatus.setLastSyncTime(LocalDateTime.now());
            syncStatus.setStartTime(null); // Clear start time if sync is not in progress
        } else if (syncStatus.getStartTime() == null) {
            syncStatus.setStartTime(startTime != null ? startTime : LocalDateTime.now());
        }

        return syncStatusRepository.save(syncStatus);
    }

    @Transactional(readOnly = true)
    public Optional<SyncStatus> getSyncStatusByProviderName(String providerName) {
        return syncStatusRepository.findByProviderName(providerName);
    }

    @Transactional
    public SyncStatus startSync(String providerName) {
        return createOrUpdateSyncStatus(providerName, SyncState.IN_PROGRESS, "Syncing data...", 0L, 0L, LocalDateTime.now());
    }

    @Transactional
    public SyncStatus completeSync(String providerName, String message, Long totalSynced, Long totalFailed) {
        return createOrUpdateSyncStatus(providerName, SyncState.COMPLETED, message, totalSynced, totalFailed, null);
    }

    @Transactional
    public SyncStatus failSync(String providerName, String errorMessage) {
        return createOrUpdateSyncStatus(providerName, SyncState.FAILED, errorMessage, 0L, 0L, null);
    }

    @Transactional
    public SyncStatus resetSyncStatus(String providerName) {
        return createOrUpdateSyncStatus(providerName, SyncState.IDLE, "Ready to sync", 0L, 0L, null);
    }
}
