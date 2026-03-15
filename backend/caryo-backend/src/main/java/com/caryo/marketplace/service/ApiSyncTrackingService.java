package com.caryo.marketplace.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Service to track API sync operations and prevent rate limiting
 * Protects against multiple syncs that could cause API blocking
 */
@Service
@Slf4j
public class ApiSyncTrackingService {

    // Track last sync times for different APIs
    private final Map<String, LocalDateTime> lastSyncTimes = new ConcurrentHashMap<>();

    // Cooldown periods (in hours)
    private static final int CARQUERY_COOLDOWN_HOURS = 2;
    private static final int SYRIANCARS_COOLDOWN_HOURS = 1;

    /**
     * Check if CarQuery sync is allowed
     */
    public SyncStatus checkCarQuerySyncStatus() {
        return checkSyncStatus("CARQUERY", CARQUERY_COOLDOWN_HOURS);
    }

    /**
     * Check if SyrianCars sync is allowed
     */
    public SyncStatus checkSyrianCarsSyncStatus() {
        return checkSyncStatus("SYRIANCARS", SYRIANCARS_COOLDOWN_HOURS);
    }

    /**
     * Record successful CarQuery sync
     */
    public void recordCarQuerySync() {
        recordSync("CARQUERY");
    }

    /**
     * Record successful SyrianCars sync
     */
    public void recordSyrianCarsSync() {
        recordSync("SYRIANCARS");
    }

    /**
     * Generic method to check sync status
     */
    private SyncStatus checkSyncStatus(String apiName, int cooldownHours) {
        LocalDateTime lastSync = lastSyncTimes.get(apiName);

        if (lastSync == null) {
            log.info("{} API: No previous sync recorded, sync allowed", apiName);
            return new SyncStatus(true, "No previous sync recorded", null, 0);
        }

        LocalDateTime now = LocalDateTime.now();
        long hoursSinceLastSync = ChronoUnit.HOURS.between(lastSync, now);

        if (hoursSinceLastSync >= cooldownHours) {
            log.info("{} API: Last sync was {} hours ago, sync allowed", apiName, hoursSinceLastSync);
            return new SyncStatus(true,
                String.format("Last sync was %d hours ago", hoursSinceLastSync),
                lastSync, hoursSinceLastSync);
        } else {
            long remainingHours = cooldownHours - hoursSinceLastSync;
            String message = String.format("Sync blocked. Last sync was %d hours ago. Please wait %d more hours to avoid API rate limiting.",
                hoursSinceLastSync, remainingHours);
            log.warn("{} API: {}", apiName, message);
            return new SyncStatus(false, message, lastSync, hoursSinceLastSync);
        }
    }

    /**
     * Record a successful sync
     */
    private void recordSync(String apiName) {
        LocalDateTime now = LocalDateTime.now();
        lastSyncTimes.put(apiName, now);
        log.info("{} API: Sync recorded at {}", apiName, now);
    }

    /**
     * Get all sync statuses for admin dashboard
     */
    public Map<String, SyncStatus> getAllSyncStatuses() {
        Map<String, SyncStatus> statuses = new ConcurrentHashMap<>();
        statuses.put("carquery", checkCarQuerySyncStatus());
        statuses.put("syriancars", checkSyrianCarsSyncStatus());
        return statuses;
    }

    /**
     * Force reset sync tracking (admin only - use with caution)
     */
    public void resetSyncTracking(String apiName) {
        lastSyncTimes.remove(apiName.toUpperCase());
        log.warn("ADMIN ACTION: Sync tracking reset for {} API", apiName);
    }

    /**
     * Sync status result class
     */
    public static class SyncStatus {
        private final boolean allowed;
        private final String message;
        private final LocalDateTime lastSyncTime;
        private final long hoursSinceLastSync;

        public SyncStatus(boolean allowed, String message, LocalDateTime lastSyncTime, long hoursSinceLastSync) {
            this.allowed = allowed;
            this.message = message;
            this.lastSyncTime = lastSyncTime;
            this.hoursSinceLastSync = hoursSinceLastSync;
        }

        // Getters
        public boolean isAllowed() { return allowed; }
        public String getMessage() { return message; }
        public LocalDateTime getLastSyncTime() { return lastSyncTime; }
        public long getHoursSinceLastSync() { return hoursSinceLastSync; }

        public long getRemainingCooldownHours(int totalCooldownHours) {
            if (allowed) return 0;
            return totalCooldownHours - hoursSinceLastSync;
        }
    }
}
