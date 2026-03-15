package com.caryo.marketplace.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for rate limiting user reports.
 * Prevents abuse by limiting the number of reports a user can submit.
 */
@Service
@Slf4j
public class ReportRateLimitService {

    private static final int MAX_REPORTS_PER_DAY = 5;
    private static final int TIME_WINDOW_HOURS = 24;

    // Map: userId -> List of report timestamps
    private final Map<Long, java.util.List<LocalDateTime>> reportTimestamps = new ConcurrentHashMap<>();

    /**
     * Check if user can submit a report (hasn't exceeded rate limit)
     */
    public boolean canSubmitReport(Long userId) {
        cleanupOldTimestamps(userId);
        
        java.util.List<LocalDateTime> timestamps = reportTimestamps.getOrDefault(userId, new java.util.ArrayList<>());
        
        return timestamps.size() < MAX_REPORTS_PER_DAY;
    }

    /**
     * Record a report submission
     */
    public void recordReport(Long userId) {
        cleanupOldTimestamps(userId);
        
        reportTimestamps.computeIfAbsent(userId, k -> new java.util.ArrayList<>())
                .add(LocalDateTime.now());
        
        log.debug("Recorded report for user {}. Total in last 24h: {}", 
                userId, reportTimestamps.get(userId).size());
    }

    /**
     * Get remaining reports for a user
     */
    public int getRemainingReports(Long userId) {
        cleanupOldTimestamps(userId);
        
        int used = reportTimestamps.getOrDefault(userId, new java.util.ArrayList<>()).size();
        return Math.max(0, MAX_REPORTS_PER_DAY - used);
    }

    /**
     * Get time until next report is available
     */
    public LocalDateTime getNextAvailableTime(Long userId) {
        cleanupOldTimestamps(userId);
        
        java.util.List<LocalDateTime> timestamps = reportTimestamps.get(userId);
        if (timestamps == null || timestamps.isEmpty()) {
            return LocalDateTime.now();
        }
        
        // Return the oldest timestamp + 24 hours
        return timestamps.get(0).plusHours(TIME_WINDOW_HOURS);
    }

    /**
     * Remove timestamps older than 24 hours
     */
    private void cleanupOldTimestamps(Long userId) {
        java.util.List<LocalDateTime> timestamps = reportTimestamps.get(userId);
        if (timestamps == null) {
            return;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusHours(TIME_WINDOW_HOURS);
        timestamps.removeIf(timestamp -> timestamp.isBefore(cutoff));

        if (timestamps.isEmpty()) {
            reportTimestamps.remove(userId);
        }
    }

    /**
     * Clear all rate limits (for testing)
     */
    public void clearAll() {
        reportTimestamps.clear();
    }
}

