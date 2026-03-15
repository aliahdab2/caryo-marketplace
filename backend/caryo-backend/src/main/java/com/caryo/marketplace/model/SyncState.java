package com.caryo.marketplace.model;

/**
 * Enum representing the current state of a data synchronization operation.
 */
public enum SyncState {
    /**
     * No sync operation is currently running. Ready to start.
     */
    IDLE,
    /**
     * A sync operation is currently in progress.
     */
    IN_PROGRESS,
    /**
     * The last sync operation completed successfully.
     */
    COMPLETED,
    /**
     * The last sync operation failed.
     */
    FAILED
}
