package com.autotrader.autotraderbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting service for public (unauthenticated) file uploads.
 * Limits uploads by IP address to prevent abuse.
 */
@Service
@Slf4j
public class PublicUploadRateLimitService {

    private static final int MAX_UPLOADS_PER_HOUR = 10;
    private static final int TIME_WINDOW_MINUTES = 60;

    // Map: IP address -> List of upload timestamps
    private final Map<String, List<LocalDateTime>> uploadTimestamps = new ConcurrentHashMap<>();

    /**
     * Check if an IP address can upload (hasn't exceeded rate limit)
     * 
     * @param ipAddress The client's IP address
     * @return true if upload is allowed, false if rate limited
     */
    public boolean canUpload(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return false;
        }
        
        cleanupOldTimestamps(ipAddress);
        
        List<LocalDateTime> timestamps = uploadTimestamps.getOrDefault(ipAddress, new ArrayList<>());
        boolean allowed = timestamps.size() < MAX_UPLOADS_PER_HOUR;
        
        if (!allowed) {
            log.warn("Rate limit exceeded for IP: {} - {} uploads in last hour", 
                    maskIp(ipAddress), timestamps.size());
        }
        
        return allowed;
    }

    /**
     * Record an upload from an IP address
     * 
     * @param ipAddress The client's IP address
     */
    public void recordUpload(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return;
        }
        
        cleanupOldTimestamps(ipAddress);
        
        uploadTimestamps.computeIfAbsent(ipAddress, k -> new ArrayList<>())
                .add(LocalDateTime.now());
        
        log.debug("Recorded upload for IP: {}. Total in last hour: {}", 
                maskIp(ipAddress), uploadTimestamps.get(ipAddress).size());
    }

    /**
     * Get remaining uploads allowed for an IP
     * 
     * @param ipAddress The client's IP address
     * @return Number of remaining uploads allowed
     */
    public int getRemainingUploads(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return 0;
        }
        
        cleanupOldTimestamps(ipAddress);
        
        int used = uploadTimestamps.getOrDefault(ipAddress, new ArrayList<>()).size();
        return Math.max(0, MAX_UPLOADS_PER_HOUR - used);
    }

    /**
     * Remove timestamps older than the time window
     */
    private void cleanupOldTimestamps(String ipAddress) {
        List<LocalDateTime> timestamps = uploadTimestamps.get(ipAddress);
        if (timestamps == null) {
            return;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(TIME_WINDOW_MINUTES);
        timestamps.removeIf(timestamp -> timestamp.isBefore(cutoff));

        if (timestamps.isEmpty()) {
            uploadTimestamps.remove(ipAddress);
        }
    }

    /**
     * Mask IP address for logging (privacy)
     */
    private String maskIp(String ipAddress) {
        if (ipAddress == null) return "unknown";
        if (ipAddress.contains(".")) {
            // IPv4: show first two octets
            String[] parts = ipAddress.split("\\.");
            if (parts.length >= 2) {
                return parts[0] + "." + parts[1] + ".x.x";
            }
        }
        // IPv6 or other: show first 8 chars
        return ipAddress.length() > 8 ? ipAddress.substring(0, 8) + "..." : ipAddress;
    }

    /**
     * Clear all rate limits (for testing)
     */
    public void clearAll() {
        uploadTimestamps.clear();
    }
}
