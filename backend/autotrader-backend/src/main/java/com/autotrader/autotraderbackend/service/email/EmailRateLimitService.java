package com.autotrader.autotraderbackend.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service responsible for email rate limiting.
 * Tracks email sending patterns per user and globally to prevent abuse.
 */
@Service
@Slf4j
public class EmailRateLimitService {

    private static final int MAX_EMAILS_PER_MINUTE = 5;
    private static final int MAX_EMAILS_PER_HOUR = 20;
    private static final int GLOBAL_MULTIPLIER = 10;
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(1);
    private static final Duration HOURLY_RATE_LIMIT_WINDOW = Duration.ofHours(1);

    private final Map<String, List<LocalDateTime>> userEmailTimestamps = new ConcurrentHashMap<>();
    private final Map<String, List<LocalDateTime>> globalEmailTimestamps = new ConcurrentHashMap<>();

    /**
     * Check if a user is rate limited for emails.
     *
     * @param userIdentifier unique identifier for the user (usually email)
     * @return true if rate limited, false otherwise
     */
    public boolean isRateLimited(String userIdentifier) {
        LocalDateTime now = LocalDateTime.now();

        cleanOldTimestamps(userIdentifier, now);

        List<LocalDateTime> userTimestamps = userEmailTimestamps.computeIfAbsent(
            userIdentifier, k -> new ArrayList<>()
        );

        // Check minute limit
        if (userTimestamps.size() >= MAX_EMAILS_PER_MINUTE) {
            log.warn("Rate limit exceeded for user: {} - {} emails in last minute",
                userIdentifier, userTimestamps.size());
            return true;
        }

        // Check hourly limit
        long hourlyCount = userTimestamps.stream()
            .filter(timestamp -> Duration.between(timestamp, now).compareTo(HOURLY_RATE_LIMIT_WINDOW) <= 0)
            .count();

        if (hourlyCount >= MAX_EMAILS_PER_HOUR) {
            log.warn("Hourly rate limit exceeded for user: {} - {} emails in last hour",
                userIdentifier, hourlyCount);
            return true;
        }

        // Record this attempt
        userTimestamps.add(now);
        return false;
    }

    /**
     * Check if global rate limit is exceeded.
     *
     * @return true if global rate limit exceeded, false otherwise
     */
    public boolean isGlobalRateLimited() {
        LocalDateTime now = LocalDateTime.now();
        String globalKey = "global";

        cleanGlobalTimestamps(now);

        List<LocalDateTime> globalTimestamps = globalEmailTimestamps.computeIfAbsent(
            globalKey, k -> new ArrayList<>()
        );

        if (globalTimestamps.size() >= MAX_EMAILS_PER_MINUTE * GLOBAL_MULTIPLIER) {
            log.warn("Global rate limit exceeded - {} emails in last minute", globalTimestamps.size());
            return true;
        }

        globalTimestamps.add(now);
        return false;
    }

    /**
     * Check both user and global rate limits.
     *
     * @param userIdentifier unique identifier for the user
     * @return true if either limit is exceeded
     */
    public boolean isAnyRateLimitExceeded(String userIdentifier) {
        return isGlobalRateLimited() || isRateLimited(userIdentifier);
    }

    /**
     * Get remaining emails allowed for a user in the current minute.
     *
     * @param userIdentifier unique identifier for the user
     * @return number of emails remaining
     */
    public int getRemainingEmails(String userIdentifier) {
        LocalDateTime now = LocalDateTime.now();
        cleanOldTimestamps(userIdentifier, now);

        List<LocalDateTime> timestamps = userEmailTimestamps.get(userIdentifier);
        if (timestamps == null) {
            return MAX_EMAILS_PER_MINUTE;
        }
        return Math.max(0, MAX_EMAILS_PER_MINUTE - timestamps.size());
    }

    /**
     * Reset rate limit for a specific user.
     * Useful for testing or admin overrides.
     *
     * @param userIdentifier unique identifier for the user
     */
    public void resetUserRateLimit(String userIdentifier) {
        userEmailTimestamps.remove(userIdentifier);
        log.info("Rate limit reset for user: {}", userIdentifier);
    }

    /**
     * Reset all rate limits.
     * Useful for testing purposes.
     */
    public void resetAllRateLimits() {
        userEmailTimestamps.clear();
        globalEmailTimestamps.clear();
        log.info("All rate limits reset");
    }

    private void cleanOldTimestamps(String userIdentifier, LocalDateTime now) {
        userEmailTimestamps.computeIfPresent(userIdentifier, (key, timestamps) -> {
            timestamps.removeIf(timestamp ->
                Duration.between(timestamp, now).compareTo(RATE_LIMIT_WINDOW) > 0);
            return timestamps;
        });
    }

    private void cleanGlobalTimestamps(LocalDateTime now) {
        String globalKey = "global";
        globalEmailTimestamps.computeIfPresent(globalKey, (key, timestamps) -> {
            timestamps.removeIf(timestamp ->
                Duration.between(timestamp, now).compareTo(RATE_LIMIT_WINDOW) > 0);
            return timestamps;
        });
    }
}
