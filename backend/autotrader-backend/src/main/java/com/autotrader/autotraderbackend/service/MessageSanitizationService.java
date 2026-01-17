package com.autotrader.autotraderbackend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

/**
 * Service for sanitizing user-generated content to prevent XSS attacks
 * Simple implementation that removes/escapes dangerous HTML/JavaScript
 *
 * For production, consider using OWASP Java HTML Sanitizer library:
 * https://github.com/OWASP/java-html-sanitizer
 */
@Slf4j
@Service
public class MessageSanitizationService {

    // Pattern to detect potential XSS attempts
    private static final Pattern SCRIPT_PATTERN = Pattern.compile("<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern IFRAME_PATTERN = Pattern.compile("<iframe[^>]*>.*?</iframe>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern OBJECT_PATTERN = Pattern.compile("<object[^>]*>.*?</object>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern EMBED_PATTERN = Pattern.compile("<embed[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern FORM_PATTERN = Pattern.compile("<form[^>]*>.*?</form>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern INPUT_PATTERN = Pattern.compile("<input[^>]*>", Pattern.CASE_INSENSITIVE);

    // Pattern for event handlers (onclick, onerror, etc.)
    private static final Pattern EVENT_HANDLER_PATTERN = Pattern.compile("\\s+on\\w+\\s*=", Pattern.CASE_INSENSITIVE);

    // Pattern for javascript: protocol
    private static final Pattern JAVASCRIPT_PROTOCOL = Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE);

    /**
     * Sanitize message content to prevent XSS attacks
     * @param content The raw user input
     * @return Sanitized content safe for storage and display
     */
    public String sanitize(String content) {
        if (content == null || content.trim().isEmpty()) {
            return content;
        }

        String sanitized = content;

        // Remove dangerous tags
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = IFRAME_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = OBJECT_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = EMBED_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = FORM_PATTERN.matcher(sanitized).replaceAll("");
        sanitized = INPUT_PATTERN.matcher(sanitized).replaceAll("");

        // Remove event handlers
        sanitized = EVENT_HANDLER_PATTERN.matcher(sanitized).replaceAll(" data-removed=");

        // Remove javascript: protocol
        sanitized = JAVASCRIPT_PROTOCOL.matcher(sanitized).replaceAll("removed:");

        // Escape HTML special characters
        sanitized = escapeHtml(sanitized);

        // Log if content was modified (potential attack attempt)
        if (!sanitized.equals(content)) {
            log.warn("Content sanitization applied - potential XSS attempt detected. " +
                "Original length: {}, Sanitized length: {}", content.length(), sanitized.length());
        }

        return sanitized;
    }

    /**
     * Escape HTML special characters
     */
    private String escapeHtml(String input) {
        if (input == null) {
            return null;
        }

        return input
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
            .replace("/", "&#x2F;");
    }

    /**
     * Check if content contains potential XSS patterns
     * Useful for additional validation
     */
    public boolean containsSuspiciousContent(String content) {
        if (content == null) {
            return false;
        }

        return SCRIPT_PATTERN.matcher(content).find()
            || IFRAME_PATTERN.matcher(content).find()
            || OBJECT_PATTERN.matcher(content).find()
            || EVENT_HANDLER_PATTERN.matcher(content).find()
            || JAVASCRIPT_PROTOCOL.matcher(content).find();
    }
}
