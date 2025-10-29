package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.Conversation;
import com.autotrader.autotraderbackend.exception.SecurityException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Map;

/**
 * Security service for messaging system to prevent abuse and ensure data integrity.
 * Implements rate limiting, content filtering, and security validations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MessageSecurityService {

    // Rate limiting configuration
    private static final int MAX_MESSAGES_PER_MINUTE = 10;
    private static final int MAX_ATTACHMENTS_PER_HOUR = 20;
    private static final int MAX_MESSAGE_LENGTH = 1000;
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(1);

    // Rate limiting storage
    private final Map<String, RateLimitInfo> userRateLimits = new ConcurrentHashMap<>();

    /**
     * Validate message security before sending
     */
    public void validateMessageSecurity(User sender, Conversation conversation, String content, MultipartFile[] files) {
        // Check rate limits
        checkRateLimit(sender.getId());

        // Validate conversation access
        validateConversationAccess(sender, conversation);

        // Content validation
        if (content != null) {
            validateMessageContent(content);
        }

        // File validation
        if (files != null && files.length > 0) {
            validateAttachments(sender.getId(), files);
        }

        log.debug("Message security validation passed for user {} in conversation {}",
                 sender.getId(), conversation.getId());
    }

    /**
     * Check if user has exceeded rate limits
     */
    private void checkRateLimit(Long userId) {
        String key = "user_" + userId;
        RateLimitInfo rateLimitInfo = userRateLimits.computeIfAbsent(key, k -> new RateLimitInfo());

        LocalDateTime now = LocalDateTime.now();

        // Reset counter if window has passed
        if (Duration.between(rateLimitInfo.getWindowStart(), now).compareTo(RATE_LIMIT_WINDOW) >= 0) {
            rateLimitInfo.reset(now);
        }

        // Check if limit exceeded
        if (rateLimitInfo.getMessageCount().get() >= MAX_MESSAGES_PER_MINUTE) {
            log.warn("Rate limit exceeded for user {}: {} messages in {} minutes",
                    userId, rateLimitInfo.getMessageCount().get(), RATE_LIMIT_WINDOW.toMinutes());
            throw new SecurityException("Message rate limit exceeded. Please wait before sending more messages.");
        }

        // Increment counter
        rateLimitInfo.getMessageCount().incrementAndGet();
    }

    /**
     * Validate user has access to conversation
     */
    private void validateConversationAccess(User user, Conversation conversation) {
        if (!conversation.isParticipant(user)) {
            log.warn("Unauthorized access attempt: User {} tried to send message in conversation {}",
                    user.getId(), conversation.getId());
            throw new SecurityException("Access denied: Not authorized to send messages in this conversation");
        }
    }

    /**
     * Validate message content for security issues
     */
    private void validateMessageContent(String content) {
        if (content.length() > MAX_MESSAGE_LENGTH) {
            throw new SecurityException("Message content exceeds maximum allowed length");
        }

        // Check for potential XSS or injection attempts
        if (containsSuspiciousContent(content)) {
            log.warn("Suspicious content detected in message: {}",
                    content.length() > 50 ? content.substring(0, 50) + "..." : content);
            throw new SecurityException("Message contains potentially harmful content");
        }
    }

    /**
     * Validate file attachments
     */
    private void validateAttachments(Long userId, MultipartFile[] files) {
        if (files.length > 5) {
            throw new SecurityException("Too many attachments. Maximum 5 files allowed per message.");
        }

        // Check attachment rate limit
        String key = "attachments_" + userId;
        RateLimitInfo attachmentLimit = userRateLimits.computeIfAbsent(key, k -> new RateLimitInfo());

        LocalDateTime now = LocalDateTime.now();
        if (Duration.between(attachmentLimit.getWindowStart(), now).toHours() >= 1) {
            attachmentLimit.reset(now);
        }

        if (attachmentLimit.getMessageCount().get() + files.length > MAX_ATTACHMENTS_PER_HOUR) {
            throw new SecurityException("Attachment upload limit exceeded. Please wait before uploading more files.");
        }

        attachmentLimit.getMessageCount().addAndGet(files.length);
    }

    /**
     * Check for suspicious content patterns
     */
    private boolean containsSuspiciousContent(String content) {
        String lowerContent = content.toLowerCase();

        // Basic XSS patterns
        String[] suspiciousPatterns = {
            "<script", "javascript:", "onload=", "onerror=", "onclick=",
            "eval(", "document.cookie", "window.location", "alert(",
            "confirm(", "prompt(", "<iframe", "<object", "<embed"
        };

        for (String pattern : suspiciousPatterns) {
            if (lowerContent.contains(pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Rate limit information holder
     */
    private static class RateLimitInfo {
        private final AtomicInteger messageCount = new AtomicInteger(0);
        private LocalDateTime windowStart = LocalDateTime.now();

        public AtomicInteger getMessageCount() {
            return messageCount;
        }

        public LocalDateTime getWindowStart() {
            return windowStart;
        }

        public void reset(LocalDateTime newStart) {
            messageCount.set(0);
            windowStart = newStart;
        }
    }
}
