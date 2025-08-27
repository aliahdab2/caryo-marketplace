package com.autotrader.autotraderbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for email rate limiting functionality.
 * Tests both user-specific and global rate limiting.
 */
@ExtendWith(MockitoExtension.class)
class EmailRateLimitingTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private MessageService messageService;

    @Mock
    private EmailTemplateService emailTemplateService;

    @Mock
    private EmailTemplateBuilder emailTemplateBuilder;

    @Mock
    private EmailContentValidationService contentValidationService;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailServiceImpl(mailSender, templateEngine, messageService, emailTemplateService, emailTemplateBuilder, contentValidationService);
        
        // Set configuration values
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@autotrader.com");
        ReflectionTestUtils.setField(emailService, "supportEmail", "support@autotrader.com");
        ReflectionTestUtils.setField(emailService, "websiteName", "AutoTrader");
        ReflectionTestUtils.setField(emailService, "websiteNameAr", "أوتو تريدر");
        ReflectionTestUtils.setField(emailService, "websiteUrl", "http://localhost:3000");
        ReflectionTestUtils.setField(emailService, "websiteSupportEmail", "support@autotrader.com");
        ReflectionTestUtils.setField(emailService, "websiteSupportPhone", "+963-XXX-XXXX");
        ReflectionTestUtils.setField(emailService, "defaultLanguage", "en");
        
        // Mock EmailTemplateBuilder behavior
        when(emailTemplateBuilder.template(anyString())).thenReturn(emailTemplateBuilder);
        when(emailTemplateBuilder.language(anyString())).thenReturn(emailTemplateBuilder);
        when(emailTemplateBuilder.user(anyString(), anyString())).thenReturn(emailTemplateBuilder);
        when(emailTemplateBuilder.website(anyString(), anyString())).thenReturn(emailTemplateBuilder);
        when(emailTemplateBuilder.withLanguage()).thenReturn(emailTemplateBuilder);
        
        EmailTemplateBuilder.EmailTemplateData templateData = new EmailTemplateBuilder.EmailTemplateData(
            "welcome", "en", Map.of("userName", "testuser", "userEmail", "test@example.com")
        );
        when(emailTemplateBuilder.build()).thenReturn(templateData);
        
        // Mock EmailTemplateService behavior
        when(emailTemplateService.getTemplatePath(anyString())).thenReturn(Optional.of("welcome.html"));
        when(emailTemplateService.getTemplateMetadata(anyString())).thenReturn(Optional.of(Map.of("path", "welcome.html")));
        
        // Mock EmailContentValidationService behavior
        EmailContentValidationService.ValidationResult validResult = new EmailContentValidationService.ValidationResult();
        when(contentValidationService.validateEmailContent(anyString(), anyString(), anyString())).thenReturn(validResult);
    }

    @Test
    void testRateLimitingConstants() {
        // Test that rate limiting constants are properly set
        assertEquals(5, ReflectionTestUtils.getField(emailService, "MAX_EMAILS_PER_MINUTE"));
        assertEquals(20, ReflectionTestUtils.getField(emailService, "MAX_EMAILS_PER_HOUR"));
        assertEquals(Duration.ofMinutes(1), ReflectionTestUtils.getField(emailService, "RATE_LIMIT_WINDOW"));
        assertEquals(Duration.ofHours(1), ReflectionTestUtils.getField(emailService, "HOURLY_RATE_LIMIT_WINDOW"));
    }

    @Test
    void testUserRateLimiting_WithinLimits() {
        // Test that user can send emails within rate limits
        String userEmail = "test@example.com";
        
        // Send 5 emails (within the 5 per minute limit)
        for (int i = 0; i < 5; i++) {
            assertFalse(isUserRateLimited(userEmail));
        }
    }

    @Test
    void testUserRateLimiting_ExceedMinuteLimit() {
        // Test that user is rate limited after exceeding minute limit
        String userEmail = "test@example.com";
        
        // Send 5 emails (at the limit)
        for (int i = 0; i < 5; i++) {
            assertFalse(isUserRateLimited(userEmail));
        }
        
        // 6th email should be rate limited
        assertTrue(isUserRateLimited(userEmail));
    }

    @Test
    void testUserRateLimiting_ExceedHourlyLimit() {
        // Test that user is rate limited after exceeding hourly limit
        String userEmail = "test@example.com";
        
        // Send 20 emails (at the hourly limit)
        for (int i = 0; i < 20; i++) {
            assertFalse(isUserRateLimited(userEmail));
        }
        
        // 21st email should be rate limited
        assertTrue(isUserRateLimited(userEmail));
    }

    @Test
    void testGlobalRateLimiting_WithinLimits() {
        // Test that global rate limiting works within limits
        // Global limit is 10x user limit = 50 emails per minute
        
        // Send 50 emails (within global limit)
        for (int i = 0; i < 50; i++) {
            assertFalse(isGlobalRateLimited());
        }
    }

    @Test
    void testGlobalRateLimiting_ExceedLimit() {
        // Test that global rate limiting works when exceeded
        // Global limit is 10x user limit = 50 emails per minute
        
        // Send 50 emails (at the global limit)
        for (int i = 0; i < 50; i++) {
            assertFalse(isGlobalRateLimited());
        }
        
        // 51st email should be globally rate limited
        assertTrue(isGlobalRateLimited());
    }

    @Test
    void testRateLimiting_UserIsolation() {
        // Test that different users have separate rate limits
        String user1Email = "user1@example.com";
        String user2Email = "user2@example.com";
        
        // User 1 sends 5 emails (at limit)
        for (int i = 0; i < 5; i++) {
            assertFalse(isUserRateLimited(user1Email));
        }
        
        // User 1 should be rate limited
        assertTrue(isUserRateLimited(user1Email));
        
        // User 2 should NOT be rate limited (separate counter)
        assertFalse(isUserRateLimited(user2Email));
    }

    @Test
    void testRateLimiting_TimestampCleanup() {
        // Test that old timestamps are cleaned up
        String userEmail = "test@example.com";
        
        // Send 5 emails
        for (int i = 0; i < 5; i++) {
            assertFalse(isUserRateLimited(userEmail));
        }
        
        // Should be rate limited
        assertTrue(isUserRateLimited(userEmail));
        
        // Manually add old timestamps to simulate cleanup scenario
        @SuppressWarnings("unchecked")
        Map<String, List<LocalDateTime>> userEmailTimestamps = 
            (Map<String, List<LocalDateTime>>) ReflectionTestUtils.getField(emailService, "userEmailTimestamps");
        
        List<LocalDateTime> timestamps = userEmailTimestamps.get(userEmail);
        assertNotNull(timestamps);
        
        // Add old timestamp (more than 1 minute ago)
        timestamps.add(LocalDateTime.now().minus(Duration.ofMinutes(2)));
        
        // Should still be rate limited due to recent timestamps
        assertTrue(isUserRateLimited(userEmail));
    }

    // Helper methods to access private rate limiting methods
    private boolean isUserRateLimited(String userEmail) {
        try {
            return (Boolean) ReflectionTestUtils.invokeMethod(
                emailService, "isRateLimited", userEmail);
        } catch (Exception e) {
            fail("Failed to invoke isRateLimited method: " + e.getMessage());
            return false;
        }
    }

    private boolean isGlobalRateLimited() {
        try {
            return (Boolean) ReflectionTestUtils.invokeMethod(
                emailService, "isGlobalRateLimited");
        } catch (Exception e) {
            fail("Failed to invoke isGlobalRateLimited method: " + e.getMessage());
            return false;
        }
    }
}
