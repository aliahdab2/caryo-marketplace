package com.caryo.marketplace.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity to store the status of data synchronization operations.
 * This allows the frontend to retrieve the last sync status and whether a sync is currently in progress.
 */
@Entity
@Table(name = "sync_status")
@Getter
@Setter
@NoArgsConstructor
public class SyncStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String providerName; // e.g., "SyrianCars", "CarQueryAPI"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SyncState status; // IN_PROGRESS, COMPLETED, FAILED, IDLE

    @Column(name = "last_sync_time")
    private LocalDateTime lastSyncTime;

    @Column(name = "last_sync_message", columnDefinition = "TEXT")
    private String lastSyncMessage;

    @Column(name = "total_records_synced")
    private Long totalRecordsSynced = 0L;

    @Column(name = "total_records_failed")
    private Long totalRecordsFailed = 0L;

    @Column(name = "start_time")
    private LocalDateTime startTime; // When the current sync operation started

    // Constructors
    public SyncStatus(String providerName, SyncState status, LocalDateTime lastSyncTime, String lastSyncMessage) {
        this.providerName = providerName;
        this.status = status;
        this.lastSyncTime = lastSyncTime;
        this.lastSyncMessage = lastSyncMessage;
    }

    public SyncStatus(String providerName, SyncState status, LocalDateTime startTime) {
        this.providerName = providerName;
        this.status = status;
        this.startTime = startTime;
    }

    @PrePersist
    protected void onCreate() {
        if (lastSyncTime == null) {
            lastSyncTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        // Update lastSyncTime only when status changes from IN_PROGRESS or to a final state
        // if (this.status != SyncState.IN_PROGRESS && lastSyncTime == null) {
        //     lastSyncTime = LocalDateTime.now();
        // }
    }
}
