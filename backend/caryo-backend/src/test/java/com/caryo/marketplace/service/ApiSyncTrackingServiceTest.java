package com.caryo.marketplace.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for ApiSyncTrackingService
 * Focuses on rate limiting logic and sync status tracking
 */
@DisplayName("ApiSyncTrackingService Tests")
class ApiSyncTrackingServiceTest {

    private ApiSyncTrackingService apiSyncTrackingService;

    @BeforeEach
    void setUp() {
        apiSyncTrackingService = new ApiSyncTrackingService();

        // Clear any existing sync times for clean test state
        Map<String, LocalDateTime> lastSyncTimes = new ConcurrentHashMap<>();
        ReflectionTestUtils.setField(apiSyncTrackingService, "lastSyncTimes", lastSyncTimes);
    }

    @Nested
    @DisplayName("CarQuery Sync Status Tests")
    class CarQuerySyncStatusTests {

        @Test
        @DisplayName("Should allow CarQuery sync when no previous sync exists")
        void shouldAllowCarQuerySyncWhenNoPreviousSync() {
            ApiSyncTrackingService.SyncStatus status = apiSyncTrackingService.checkCarQuerySyncStatus();

            assertTrue(status.isAllowed(), "Should allow sync when no previous sync exists");
            assertNull(status.getLastSyncTime(), "Last sync time should be null");
            assertEquals(0, status.getHoursSinceLastSync(), "Hours since last sync should be 0");
            assertEquals("No previous sync recorded", status.getMessage(), "Should provide informative message");
        }

        @Test
        @DisplayName("Should block CarQuery sync when recently synced (within cooldown period)")
        void shouldBlockCarQuerySyncWhenRecentlySynced() {
            // Record a sync 1 hour ago - cooldown is 2 hours so should block
            apiSyncTrackingService.recordCarQuerySync();

            // Simulate 1 hour passing by setting last sync time to 1 hour ago
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            lastSyncTimes.put("CARQUERY", oneHourAgo);

            ApiSyncTrackingService.SyncStatus status = apiSyncTrackingService.checkCarQuerySyncStatus();

            assertFalse(status.isAllowed(), "Should block sync when within cooldown period");
            assertEquals(oneHourAgo, status.getLastSyncTime(), "Should return correct last sync time");
            assertEquals(1, status.getHoursSinceLastSync(), "Should calculate correct hours since last sync");
            assertTrue(status.getMessage().contains("Sync blocked"), "Should indicate sync is blocked");
        }

        @Test
        @DisplayName("Should allow CarQuery sync after cooldown period expires")
        void shouldAllowCarQuerySyncAfterCooldownExpires() {
            // Record a sync 3 hours ago (beyond 2-hour cooldown)
            LocalDateTime threeHoursAgo = LocalDateTime.now().minusHours(3);
            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            lastSyncTimes.put("CARQUERY", threeHoursAgo);

            ApiSyncTrackingService.SyncStatus status = apiSyncTrackingService.checkCarQuerySyncStatus();

            assertTrue(status.isAllowed(), "Should allow sync after cooldown expires");
            assertEquals(threeHoursAgo, status.getLastSyncTime(), "Should return correct last sync time");
            assertEquals(3, status.getHoursSinceLastSync(), "Should calculate correct hours since last sync");
            assertTrue(status.getMessage().contains("Last sync was 3 hours ago"), "Should provide informative message");
        }

        @Test
        @DisplayName("Should record CarQuery sync time correctly")
        void shouldRecordCarQuerySyncTimeCorrectly() {
            LocalDateTime beforeSync = LocalDateTime.now().minusSeconds(1);

            apiSyncTrackingService.recordCarQuerySync();

            LocalDateTime afterSync = LocalDateTime.now().plusSeconds(1);
            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            LocalDateTime recordedTime = lastSyncTimes.get("CARQUERY");

            assertNotNull(recordedTime, "Sync time should be recorded");
            assertTrue(recordedTime.isAfter(beforeSync) && recordedTime.isBefore(afterSync),
                "Recorded time should be within expected range");
        }
    }

    @Nested
    @DisplayName("SyrianCars Sync Status Tests")
    class SyrianCarsSyncStatusTests {

        @Test
        @DisplayName("Should allow SyrianCars sync when no previous sync exists")
        void shouldAllowSyrianCarsSyncWhenNoPreviousSync() {
            ApiSyncTrackingService.SyncStatus status = apiSyncTrackingService.checkSyrianCarsSyncStatus();

            assertTrue(status.isAllowed(), "Should allow sync when no previous sync exists");
            assertNull(status.getLastSyncTime(), "Last sync time should be null");
            assertEquals(0, status.getHoursSinceLastSync(), "Hours since last sync should be 0");
            assertEquals("No previous sync recorded", status.getMessage(), "Should provide informative message");
        }

        @Test
        @DisplayName("Should block SyrianCars sync when recently synced (within cooldown period)")
        void shouldBlockSyrianCarsSyncWhenRecentlySynced() {
            // Record a sync 30 minutes ago - cooldown is 1 hour so should block
            LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);
            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            lastSyncTimes.put("SYRIANCARS", thirtyMinutesAgo);

            ApiSyncTrackingService.SyncStatus status = apiSyncTrackingService.checkSyrianCarsSyncStatus();

            assertFalse(status.isAllowed(), "Should block sync when within cooldown period");
            assertEquals(thirtyMinutesAgo, status.getLastSyncTime(), "Should return correct last sync time");
            assertEquals(0, status.getHoursSinceLastSync(), "Should show 0 hours for partial hour");
            assertTrue(status.getMessage().contains("Sync blocked"), "Should indicate sync is blocked");
        }

        @Test
        @DisplayName("Should allow SyrianCars sync after cooldown period expires")
        void shouldAllowSyrianCarsSyncAfterCooldownExpires() {
            // Record a sync 2 hours ago (beyond 1-hour cooldown)
            LocalDateTime twoHoursAgo = LocalDateTime.now().minusHours(2);
            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            lastSyncTimes.put("SYRIANCARS", twoHoursAgo);

            ApiSyncTrackingService.SyncStatus status = apiSyncTrackingService.checkSyrianCarsSyncStatus();

            assertTrue(status.isAllowed(), "Should allow sync after cooldown expires");
            assertEquals(twoHoursAgo, status.getLastSyncTime(), "Should return correct last sync time");
            assertEquals(2, status.getHoursSinceLastSync(), "Should calculate correct hours since last sync");
            assertNotNull(status.getMessage(), "Should have informative message even when allowed");
            assertTrue(status.getMessage().contains("Last sync was 2 hours ago"), "Should contain sync time info");
        }

        @Test
        @DisplayName("Should record SyrianCars sync time correctly")
        void shouldRecordSyrianCarsSyncTimeCorrectly() {
            LocalDateTime beforeSync = LocalDateTime.now().minusSeconds(1);

            apiSyncTrackingService.recordSyrianCarsSync();

            LocalDateTime afterSync = LocalDateTime.now().plusSeconds(1);
            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            LocalDateTime recordedTime = lastSyncTimes.get("SYRIANCARS");

            assertNotNull(recordedTime, "Sync time should be recorded");
            assertTrue(recordedTime.isAfter(beforeSync) && recordedTime.isBefore(afterSync),
                "Recorded time should be within expected range");
        }
    }

    @Nested
    @DisplayName("All Sync Statuses Tests")
    class AllSyncStatusesTests {

        @Test
        @DisplayName("Should return all sync statuses when no syncs have occurred")
        void shouldReturnAllSyncStatusesWhenNoSyncs() {
            Map<String, ApiSyncTrackingService.SyncStatus> allStatuses = apiSyncTrackingService.getAllSyncStatuses();

            assertNotNull(allStatuses, "All statuses map should not be null");
            assertEquals(2, allStatuses.size(), "Should contain statuses for both APIs");

            assertTrue(allStatuses.containsKey("carquery"), "Should contain CarQuery status");
            assertTrue(allStatuses.containsKey("syriancars"), "Should contain SyrianCars status");

            // Both should be allowed initially
            assertTrue(allStatuses.get("carquery").isAllowed(), "CarQuery should be allowed initially");
            assertTrue(allStatuses.get("syriancars").isAllowed(), "SyrianCars should be allowed initially");
        }

        @Test
        @DisplayName("Should return correct statuses after syncs have occurred")
        void shouldReturnCorrectStatusesAfterSyncs() {
            // Record syncs for both APIs
            apiSyncTrackingService.recordCarQuerySync();
            apiSyncTrackingService.recordSyrianCarsSync();

            Map<String, ApiSyncTrackingService.SyncStatus> allStatuses = apiSyncTrackingService.getAllSyncStatuses();

            assertNotNull(allStatuses, "All statuses map should not be null");
            assertEquals(2, allStatuses.size(), "Should contain statuses for both APIs");

            // Both should be blocked after recent syncs (within cooldown periods)
            assertFalse(allStatuses.get("carquery").isAllowed(), "CarQuery should be blocked within cooldown period");
            assertFalse(allStatuses.get("syriancars").isAllowed(), "SyrianCars should be blocked within cooldown period");

            // Both should have last sync times
            assertNotNull(allStatuses.get("carquery").getLastSyncTime(), "CarQuery should have last sync time");
            assertNotNull(allStatuses.get("syriancars").getLastSyncTime(), "SyrianCars should have last sync time");
        }
    }

    @Nested
    @DisplayName("Edge Cases and Boundary Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle concurrent sync recordings correctly")
        void shouldHandleConcurrentSyncRecordings() {
            // This tests the thread-safety of the ConcurrentHashMap
            assertDoesNotThrow(() -> {
                // Simulate concurrent access
                for (int i = 0; i < 10; i++) {
                    apiSyncTrackingService.recordCarQuerySync();
                    apiSyncTrackingService.recordSyrianCarsSync();
                }
            }, "Should handle concurrent sync recordings without exceptions");

            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            assertNotNull(lastSyncTimes.get("CARQUERY"), "CarQuery sync time should be recorded");
            assertNotNull(lastSyncTimes.get("SYRIANCARS"), "SyrianCars sync time should be recorded");
        }

        @Test
        @DisplayName("Should calculate hours correctly at boundary conditions")
        void shouldCalculateHoursCorrectlyAtBoundaries() {
            // Test exactly at cooldown boundary
            LocalDateTime exactlyTwoHoursAgo = LocalDateTime.now().minusHours(2);
            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            lastSyncTimes.put("CARQUERY", exactlyTwoHoursAgo);

            ApiSyncTrackingService.SyncStatus status = apiSyncTrackingService.checkCarQuerySyncStatus();

            assertTrue(status.isAllowed(), "Should allow sync exactly at cooldown boundary");
            assertEquals(2, status.getHoursSinceLastSync(), "Should calculate exactly 2 hours");
        }

        @Test
        @DisplayName("Should handle very recent sync times correctly")
        void shouldHandleVeryRecentSyncTimes() {
            // Test with sync time just seconds ago - cooldown is 1 hour so should block
            LocalDateTime secondsAgo = LocalDateTime.now().minusSeconds(30);
            Map<String, LocalDateTime> lastSyncTimes = getLastSyncTimes();
            lastSyncTimes.put("SYRIANCARS", secondsAgo);

            ApiSyncTrackingService.SyncStatus status = apiSyncTrackingService.checkSyrianCarsSyncStatus();

            assertFalse(status.isAllowed(), "Should block very recent syncs when within cooldown period");
            assertEquals(0, status.getHoursSinceLastSync(), "Should show 0 hours for very recent sync");
        }
    }

    /**
     * Helper method to access the private lastSyncTimes field
     */
    @SuppressWarnings("unchecked")
    private Map<String, LocalDateTime> getLastSyncTimes() {
        return (Map<String, LocalDateTime>) ReflectionTestUtils.getField(apiSyncTrackingService, "lastSyncTimes");
    }
}
