package com.autotrader.autotraderbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Service for tracking email delivery status and statistics.
 * Provides insights into email sending success rates and failures.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailDeliveryTrackingService {
    
    // Email delivery statistics
    private final AtomicLong totalEmailsSent = new AtomicLong(0);
    private final AtomicLong totalEmailsSucceeded = new AtomicLong(0);
    private final AtomicLong totalEmailsFailed = new AtomicLong(0);
    
    // Email type statistics
    private final Map<String, AtomicLong> emailTypeStats = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> emailTypeFailures = new ConcurrentHashMap<>();
    
    // Recent email attempts (for debugging)
    private final Map<String, EmailAttempt> recentAttempts = new ConcurrentHashMap<>();
    
    /**
     * Record successful email send.
     */
    public void recordEmailSuccess(String emailType, String recipient, String templateName) {
        totalEmailsSent.incrementAndGet();
        totalEmailsSucceeded.incrementAndGet();
        
        emailTypeStats.computeIfAbsent(emailType, k -> new AtomicLong(0)).incrementAndGet();
        
        // Store recent attempt
        String key = generateKey(recipient, emailType);
        recentAttempts.put(key, new EmailAttempt(
            recipient, emailType, templateName, true, null, LocalDateTime.now()
        ));
        
        log.debug("Email sent successfully: type={}, recipient={}, template={}", 
                 emailType, maskEmail(recipient), templateName);
    }
    
    /**
     * Record failed email send.
     */
    public void recordEmailFailure(String emailType, String recipient, String templateName, String errorMessage) {
        totalEmailsSent.incrementAndGet();
        totalEmailsFailed.incrementAndGet();
        
        emailTypeFailures.computeIfAbsent(emailType, k -> new AtomicLong(0)).incrementAndGet();
        
        // Store recent attempt
        String key = generateKey(recipient, emailType);
        recentAttempts.put(key, new EmailAttempt(
            recipient, emailType, templateName, false, errorMessage, LocalDateTime.now()
        ));
        
        log.warn("Email send failed: type={}, recipient={}, template={}, error={}", 
                emailType, maskEmail(recipient), templateName, errorMessage);
    }
    
    /**
     * Get email delivery statistics.
     */
    public EmailDeliveryStats getDeliveryStats() {
        return new EmailDeliveryStats(
            totalEmailsSent.get(),
            totalEmailsSucceeded.get(),
            totalEmailsFailed.get(),
            calculateSuccessRate(),
            new ConcurrentHashMap<>(emailTypeStats),
            new ConcurrentHashMap<>(emailTypeFailures)
        );
    }
    
    /**
     * Get statistics for a specific email type.
     */
    public EmailTypeStats getStatsForEmailType(String emailType) {
        long sent = emailTypeStats.getOrDefault(emailType, new AtomicLong(0)).get();
        long failed = emailTypeFailures.getOrDefault(emailType, new AtomicLong(0)).get();
        long succeeded = sent - failed;
        
        return new EmailTypeStats(emailType, sent, succeeded, failed, calculateSuccessRate(succeeded, sent));
    }
    
    /**
     * Check if recent email attempt was successful.
     */
    public boolean wasRecentEmailSuccessful(String recipient, String emailType) {
        String key = generateKey(recipient, emailType);
        EmailAttempt attempt = recentAttempts.get(key);
        return attempt != null && attempt.isSuccess();
    }
    
    /**
     * Get recent email attempt details.
     */
    public EmailAttempt getRecentEmailAttempt(String recipient, String emailType) {
        String key = generateKey(recipient, emailType);
        return recentAttempts.get(key);
    }
    
    /**
     * Reset all statistics (for testing purposes).
     */
    public void resetStats() {
        totalEmailsSent.set(0);
        totalEmailsSucceeded.set(0);
        totalEmailsFailed.set(0);
        emailTypeStats.clear();
        emailTypeFailures.clear();
        recentAttempts.clear();
        
        log.info("Email delivery statistics reset");
    }
    
    /**
     * Calculate overall success rate.
     */
    private double calculateSuccessRate() {
        long total = totalEmailsSent.get();
        if (total == 0) return 0.0;
        
        return (double) totalEmailsSucceeded.get() / total * 100.0;
    }
    
    /**
     * Calculate success rate for specific numbers.
     */
    private double calculateSuccessRate(long succeeded, long total) {
        if (total == 0) return 0.0;
        return (double) succeeded / total * 100.0;
    }
    
    /**
     * Generate unique key for email attempt tracking.
     */
    private String generateKey(String recipient, String emailType) {
        return recipient.toLowerCase() + ":" + emailType;
    }
    
    /**
     * Mask email address for privacy.
     */
    private String maskEmail(String email) {
        if (email == null || email.length() < 3) return "***";
        
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) return "***";
        
        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        
        if (localPart.length() <= 2) {
            return "*".repeat(localPart.length()) + domain;
        }
        
        return localPart.charAt(0) + "*".repeat(localPart.length() - 2) + 
               localPart.charAt(localPart.length() - 1) + domain;
    }
    
    /**
     * Email delivery statistics data class.
     */
    public static class EmailDeliveryStats {
        private final long totalSent;
        private final long totalSucceeded;
        private final long totalFailed;
        private final double successRate;
        private final Map<String, AtomicLong> typeStats;
        private final Map<String, AtomicLong> typeFailures;
        
        public EmailDeliveryStats(long totalSent, long totalSucceeded, long totalFailed, 
                                double successRate, Map<String, AtomicLong> typeStats, 
                                Map<String, AtomicLong> typeFailures) {
            this.totalSent = totalSent;
            this.totalSucceeded = totalSucceeded;
            this.totalFailed = totalFailed;
            this.successRate = successRate;
            this.typeStats = typeStats;
            this.typeFailures = typeFailures;
        }
        
        // Getters
        public long getTotalSent() { return totalSent; }
        public long getTotalSucceeded() { return totalSucceeded; }
        public long getTotalFailed() { return totalFailed; }
        public double getSuccessRate() { return successRate; }
        public Map<String, AtomicLong> getTypeStats() { return typeStats; }
        public Map<String, AtomicLong> getTypeFailures() { return typeFailures; }
    }
    
    /**
     * Email type statistics data class.
     */
    public static class EmailTypeStats {
        private final String emailType;
        private final long totalSent;
        private final long totalSucceeded;
        private final long totalFailed;
        private final double successRate;
        
        public EmailTypeStats(String emailType, long totalSent, long totalSucceeded, 
                            long totalFailed, double successRate) {
            this.emailType = emailType;
            this.totalSent = totalSent;
            this.totalSucceeded = totalSucceeded;
            this.totalFailed = totalFailed;
            this.successRate = successRate;
        }
        
        // Getters
        public String getEmailType() { return emailType; }
        public long getTotalSent() { return totalSent; }
        public long getTotalSucceeded() { return totalSucceeded; }
        public long getTotalFailed() { return totalFailed; }
        public double getSuccessRate() { return successRate; }
    }
    
    /**
     * Email attempt record.
     */
    public static class EmailAttempt {
        private final String recipient;
        private final String emailType;
        private final String templateName;
        private final boolean success;
        private final String errorMessage;
        private final LocalDateTime timestamp;
        
        public EmailAttempt(String recipient, String emailType, String templateName, 
                          boolean success, String errorMessage, LocalDateTime timestamp) {
            this.recipient = recipient;
            this.emailType = emailType;
            this.templateName = templateName;
            this.success = success;
            this.errorMessage = errorMessage;
            this.timestamp = timestamp;
        }
        
        // Getters
        public String getRecipient() { return recipient; }
        public String getEmailType() { return emailType; }
        public String getTemplateName() { return templateName; }
        public boolean isSuccess() { return success; }
        public String getErrorMessage() { return errorMessage; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
