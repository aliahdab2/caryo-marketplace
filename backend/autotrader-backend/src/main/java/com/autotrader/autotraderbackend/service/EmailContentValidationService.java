package com.autotrader.autotraderbackend.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.ArrayList;

/**
 * Service for validating email content before sending.
 * Provides spam detection, content filtering, and security checks.
 */
@Service
@Slf4j
public class EmailContentValidationService {

    // Spam keywords that might trigger rejection
    private static final List<String> SPAM_KEYWORDS = List.of(
        "buy now", "limited time", "act now", "click here", "free money",
        "make money fast", "lose weight", "viagra", "casino", "lottery",
        "urgent", "exclusive offer", "once in a lifetime", "guaranteed"
    );

    // Suspicious patterns
    private static final Pattern SUSPICIOUS_URLS = Pattern.compile(
        "https?://(?:[a-zA-Z0-9-]+\\.)*[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}(?:/[^\\s]*)?"
    );

    private static final Pattern EXCESSIVE_CAPS = Pattern.compile("[A-Z]{5,}");
    private static final Pattern EXCESSIVE_PUNCTUATION = Pattern.compile("[!]{3,}|[?]{3,}");

    /**
     * Validate email content for spam and security issues.
     */
    public ValidationResult validateEmailContent(String subject, String content, String recipient) {
        ValidationResult result = new ValidationResult();
        
        // Check for empty content
        if (!StringUtils.hasText(subject) || !StringUtils.hasText(content)) {
            result.addError("Email subject and content cannot be empty");
            return result;
        }

        // Check for spam keywords
        checkSpamKeywords(subject, content, result);
        
        // Check for suspicious patterns
        checkSuspiciousPatterns(subject, content, result);
        
        // Check content length
        checkContentLength(subject, content, result);
        
        // Check for malicious content
        checkMaliciousContent(content, result);
        
        // Log validation results
        if (!result.isValid()) {
            log.warn("Email content validation failed for recipient: {}. Errors: {}", 
                recipient, result.getErrors());
        } else {
            log.debug("Email content validation passed for recipient: {}", recipient);
        }
        
        return result;
    }

    private void checkSpamKeywords(String subject, String content, ValidationResult result) {
        String combinedText = (subject + " " + content).toLowerCase();
        
        for (String keyword : SPAM_KEYWORDS) {
            if (combinedText.contains(keyword.toLowerCase())) {
                result.addError("Content contains potential spam keyword: " + keyword);
            }
        }
    }

    private void checkSuspiciousPatterns(String subject, String content, ValidationResult result) {
        String combinedText = subject + " " + content;
        
        // Check for excessive caps
        if (EXCESSIVE_CAPS.matcher(combinedText).find()) {
            result.addWarning("Content contains excessive capital letters");
        }
        
        // Check for excessive punctuation
        if (EXCESSIVE_PUNCTUATION.matcher(combinedText).find()) {
            result.addWarning("Content contains excessive punctuation");
        }
    }

    private void checkContentLength(String subject, String content, ValidationResult result) {
        if (subject.length() > 100) {
            result.addError("Subject line too long (max 100 characters)");
        }
        
        if (content.length() > 10000) {
            result.addError("Email content too long (max 10,000 characters)");
        }
    }

    private void checkMaliciousContent(String content, ValidationResult result) {
        // Check for potential XSS attempts
        if (content.contains("<script>") || content.contains("javascript:")) {
            result.addError("Content contains potentially malicious code");
        }
        
        // Check for excessive links
        long linkCount = SUSPICIOUS_URLS.matcher(content).results().count();
        if (linkCount > 10) {
            result.addWarning("Content contains many links (" + linkCount + ")");
        }
    }

    /**
     * Result of email content validation.
     */
    public static class ValidationResult {
        private final List<String> errors = new ArrayList<>();
        private final List<String> warnings = new ArrayList<>();

        public void addError(String error) {
            errors.add(error);
        }

        public void addWarning(String warning) {
            warnings.add(warning);
        }

        public boolean isValid() {
            return errors.isEmpty();
        }

        public List<String> getErrors() {
            return new ArrayList<>(errors);
        }

        public List<String> getWarnings() {
            return new ArrayList<>(warnings);
        }

        public boolean hasWarnings() {
            return !warnings.isEmpty();
        }
    }
}
