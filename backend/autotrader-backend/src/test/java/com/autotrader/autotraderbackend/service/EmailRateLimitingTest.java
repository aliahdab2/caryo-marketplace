package com.autotrader.autotraderbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;

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
        lenient().when(emailTemplateBuilder.template(anyString())).thenReturn(emailTemplateBuilder);
        lenient().when(emailTemplateBuilder.language(anyString())).thenReturn(emailTemplateBuilder);
        lenient().when(emailTemplateBuilder.user(anyString(), anyString())).thenReturn(emailTemplateBuilder);
        lenient().when(emailTemplateBuilder.website(anyString(), anyString())).thenReturn(emailTemplateBuilder);
        lenient().when(emailTemplateBuilder.withLanguage()).thenReturn(emailTemplateBuilder);
        
        EmailTemplateBuilder.EmailTemplateData templateData = new EmailTemplateBuilder.EmailTemplateData(
            "welcome", "en", Map.of("userName", "testuser", "userEmail", "test@example.com")
        );
        lenient().when(emailTemplateBuilder.build()).thenReturn(templateData);
        
        // Mock EmailTemplateService behavior
        lenient().when(emailTemplateService.getTemplatePath(anyString())).thenReturn(Optional.of("welcome.html"));
        lenient().when(emailTemplateService.getTemplateMetadata(anyString())).thenReturn(Optional.of(Map.of("path", "welcome.html")));
        
        // Mock EmailContentValidationService behavior
        EmailContentValidationService.ValidationResult validResult = new EmailContentValidationService.ValidationResult();
        lenient().when(contentValidationService.validateEmailContent(anyString(), anyString(), anyString())).thenReturn(validResult);
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
        
        // Simulate sending 20 emails by manually adding timestamps
        // This simulates the real scenario where emails are sent over time
        
        // Get access to the timestamps
        @SuppressWarnings("unchecked")
        Map<String, List<LocalDateTime>> userEmailTimestamps = 
            (Map<String, List<LocalDateTime>>) ReflectionTestUtils.getField(emailService, "userEmailTimestamps");
        
        List<LocalDateTime> timestamps = userEmailTimestamps.computeIfAbsent(userEmail, k -> new ArrayList<>());
        
        // Clear any existing timestamps
        timestamps.clear();
        
        // Add 20 timestamps spread over the last hour (simulating emails sent over time)
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < 20; i++) {
            // Add timestamps from 0 to 59 minutes ago (within the hour)
            LocalDateTime timestamp = now.minus(Duration.ofMinutes(i));
            timestamps.add(timestamp);
        }
        
        // Now check if the 21st email would be rate limited
        // The hourly limit is 20, so with 20 existing timestamps, the 21st should be rate limited
        // We need to check this without calling isRateLimited (which would add another timestamp)
        // So we'll check the internal logic directly
        
        // The rate limiting logic checks if hourlyCount >= MAX_EMAILS_PER_HOUR
        // With 20 timestamps, hourlyCount = 20, which equals the limit
        // So the 21st email should be rate limited
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
