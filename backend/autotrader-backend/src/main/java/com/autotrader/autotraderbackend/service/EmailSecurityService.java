package com.autotrader.autotraderbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Service for email security validations and rate limiting.
 * Prevents email abuse and validates email content.
 */
@Service
@Slf4j
public class EmailSecurityService {
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );
    
    private static final Pattern SUSPICIOUS_CONTENT_PATTERN = Pattern.compile(
        "(?i).*(script|javascript|onclick|onerror|eval|alert|confirm|prompt).*"
    );
    
    private static final Set<String> BLOCKED_DOMAINS = Set.of(
        "tempmail.org", "10minutemail.com", "guerrillamail.com"
    );
    
    // Rate limiting - max 5 emails per email address per hour
    private static final int MAX_EMAILS_PER_HOUR = 5;
    private final ConcurrentHashMap<String, RateLimitInfo> rateLimitMap = new ConcurrentHashMap<>();
    
    /**
     * Validate email address format and domain.
     */
    public boolean isValidEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }
        
        if (!EMAIL_PATTERN.matcher(email.trim().toLowerCase()).matches()) {
            log.warn("Invalid email format: {}", email);
            return false;
        }
        
        String domain = email.substring(email.indexOf('@') + 1).toLowerCase();
        if (BLOCKED_DOMAINS.contains(domain)) {
            log.warn("Blocked domain detected: {}", domain);
            return false;
        }
        
        return true;
    }
    
    /**
     * Check for suspicious content in email messages.
     */
    public boolean containsSuspiciousContent(String content) {
        if (!StringUtils.hasText(content)) {
            return false;
        }
        
        boolean suspicious = SUSPICIOUS_CONTENT_PATTERN.matcher(content).matches();
        if (suspicious) {
            log.warn("Suspicious content detected in email: {}", 
                content.length() > 100 ? content.substring(0, 100) + "..." : content);
        }
        
        return suspicious;
    }
    
    /**
     * Check rate limit for email address.
     */
    public boolean isRateLimited(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        RateLimitInfo info = rateLimitMap.computeIfAbsent(normalizedEmail, 
            k -> new RateLimitInfo());
        
        LocalDateTime now = LocalDateTime.now();
        
        // Reset counter if more than an hour has passed
        if (ChronoUnit.HOURS.between(info.getFirstEmailTime(), now) >= 1) {
            info.reset(now);
        }
        
        if (info.getEmailCount().get() >= MAX_EMAILS_PER_HOUR) {
            log.warn("Rate limit exceeded for email: {}", normalizedEmail);
            return true;
        }
        
        info.getEmailCount().incrementAndGet();
        return false;
    }
    
    /**
     * Sanitize email content to prevent XSS.
     */
    public String sanitizeContent(String content) {
        if (!StringUtils.hasText(content)) {
            return content;
        }
        
        return content
            .replaceAll("<script[^>]*>.*?</script>", "")
            .replaceAll("javascript:", "")
            .replaceAll("on\\w+\\s*=", "")
            .trim();
    }
    
    /**
     * Validate all aspects of an email before sending.
     */
    public EmailValidationResult validateEmail(String to, String subject, String content) {
        if (!isValidEmail(to)) {
            return EmailValidationResult.invalid("Invalid email address");
        }
        
        if (isRateLimited(to)) {
            return EmailValidationResult.rateLimited("Rate limit exceeded");
        }
        
        if (containsSuspiciousContent(content) || containsSuspiciousContent(subject)) {
            return EmailValidationResult.suspicious("Suspicious content detected");
        }
        
        return EmailValidationResult.valid();
    }
    
    /**
     * Rate limit information for an email address.
     */
    private static class RateLimitInfo {
        private LocalDateTime firstEmailTime = LocalDateTime.now();
        private AtomicInteger emailCount = new AtomicInteger(0);
        
        public LocalDateTime getFirstEmailTime() {
            return firstEmailTime;
        }
        
        public AtomicInteger getEmailCount() {
            return emailCount;
        }
        
        public void reset(LocalDateTime newTime) {
            this.firstEmailTime = newTime;
            this.emailCount.set(0);
        }
    }
    
    /**
     * Result of email validation.
     */
    public static class EmailValidationResult {
        private final boolean valid;
        private final String reason;
        private final ValidationStatus status;
        
        private EmailValidationResult(boolean valid, String reason, ValidationStatus status) {
            this.valid = valid;
            this.reason = reason;
            this.status = status;
        }
        
        public static EmailValidationResult valid() {
            return new EmailValidationResult(true, null, ValidationStatus.VALID);
        }
        
        public static EmailValidationResult invalid(String reason) {
            return new EmailValidationResult(false, reason, ValidationStatus.INVALID);
        }
        
        public static EmailValidationResult rateLimited(String reason) {
            return new EmailValidationResult(false, reason, ValidationStatus.RATE_LIMITED);
        }
        
        public static EmailValidationResult suspicious(String reason) {
            return new EmailValidationResult(false, reason, ValidationStatus.SUSPICIOUS);
        }
        
        public boolean isValid() { return valid; }
        public String getReason() { return reason; }
        public ValidationStatus getStatus() { return status; }
    }
    
    public enum ValidationStatus {
        VALID, INVALID, RATE_LIMITED, SUSPICIOUS
    }
}