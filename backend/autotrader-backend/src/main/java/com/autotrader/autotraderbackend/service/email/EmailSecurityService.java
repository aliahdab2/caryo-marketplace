package com.autotrader.autotraderbackend.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Service responsible for email security operations.
 * Handles content security scanning, email masking for logs, and other security concerns.
 */
@Service
@Slf4j
public class EmailSecurityService {

    private static final String[] SUSPICIOUS_PATTERNS = {
        "<script", "javascript:", "onclick=", "onerror=",
        "eval(", "document.cookie", "window.location",
        "onload=", "onmouseover=", "onfocus=", "onblur=",
        "data:text/html", "base64,", "vbscript:"
    };

    /**
     * Check for suspicious content in email body.
     * Detects potential XSS attacks, malicious scripts, etc.
     *
     * @param content the content to check
     * @return true if suspicious content detected, false otherwise
     */
    public boolean containsSuspiciousContent(String content) {
        if (!StringUtils.hasText(content)) {
            return false;
        }

        String lowerContent = content.toLowerCase();
        for (String pattern : SUSPICIOUS_PATTERNS) {
            if (lowerContent.contains(pattern)) {
                log.warn("Suspicious content detected: pattern '{}' found", pattern);
                return true;
            }
        }

        return false;
    }

    /**
     * Mask email address for logging (privacy protection).
     * Example: "john.doe@example.com" -> "j******e@example.com"
     *
     * @param email the email to mask
     * @return masked email address
     */
    public String maskEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return "invalid-email";
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "invalid-email";
        }

        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);

        if (localPart.length() <= 2) {
            return "*".repeat(localPart.length()) + domain;
        }

        return localPart.charAt(0) +
               "*".repeat(localPart.length() - 2) +
               localPart.charAt(localPart.length() - 1) +
               domain;
    }

    /**
     * Sanitize email content by removing potentially dangerous elements.
     *
     * @param content the content to sanitize
     * @return sanitized content
     */
    public String sanitizeContent(String content) {
        if (!StringUtils.hasText(content)) {
            return content;
        }

        String sanitized = content;

        // Remove script tags and their content
        sanitized = sanitized.replaceAll("(?i)<script[^>]*>.*?</script>", "");

        // Remove event handlers
        sanitized = sanitized.replaceAll("(?i)\\s+on\\w+\\s*=\\s*[\"'][^\"']*[\"']", "");
        sanitized = sanitized.replaceAll("(?i)\\s+on\\w+\\s*=\\s*[^\\s>]+", "");

        // Remove javascript: and vbscript: protocols
        sanitized = sanitized.replaceAll("(?i)javascript:", "");
        sanitized = sanitized.replaceAll("(?i)vbscript:", "");

        // Remove data: URLs with potentially dangerous content
        sanitized = sanitized.replaceAll("(?i)data:text/html[^\"'\\s>]*", "");

        return sanitized;
    }

    /**
     * Check if an email address appears to be from a known throwaway/temporary email service.
     *
     * @param email the email to check
     * @return true if appears to be throwaway email
     */
    public boolean isThrowawayEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }

        String lowerEmail = email.toLowerCase();
        String[] throwawayDomains = {
            "tempmail.com", "throwaway.email", "guerrillamail.com",
            "10minutemail.com", "mailinator.com", "temp-mail.org",
            "fakeinbox.com", "trashmail.com", "yopmail.com"
        };

        for (String domain : throwawayDomains) {
            if (lowerEmail.endsWith("@" + domain)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Log suspicious email attempt with masked details.
     *
     * @param email the email address (will be masked)
     * @param reason the reason for flagging
     */
    public void logSuspiciousActivity(String email, String reason) {
        log.warn("Suspicious email activity detected: {} for email: {}",
            reason, maskEmail(email));
    }

    /**
     * Validate that an email doesn't contain injection attempts.
     *
     * @param email the email to check
     * @return true if safe, false if injection attempt detected
     */
    public boolean isSafeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }

        // Check for newline injection
        if (email.contains("\n") || email.contains("\r")) {
            log.warn("Email header injection attempt detected");
            return false;
        }

        // Check for multiple @ symbols
        if (email.indexOf('@') != email.lastIndexOf('@')) {
            log.warn("Multiple @ symbols in email");
            return false;
        }

        // Check for other control characters
        for (char c : email.toCharArray()) {
            if (Character.isISOControl(c)) {
                log.warn("Control character in email address");
                return false;
            }
        }

        return true;
    }
}
