package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.constants.EmailTemplateConstants;
import com.autotrader.autotraderbackend.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for the email template system.
 * Tests real template loading, validation, and email sending.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.mail.host=localhost",
    "spring.mail.port=1025",
    "spring.mail.username=test",
    "spring.mail.password=test",
    "app.email.from=test@example.com",
    "app.email.support=support@example.com",
    "app.website.name=AutoTrader",
    "app.website.name.ar=أوتو تريدر",
    "app.website.url=http://localhost:3000"
})
class EmailTemplateIntegrationTest {

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Autowired
    private EmailTemplateBuilder emailTemplateBuilder;

    @Autowired
    private EmailService emailService;

    @Test
    void testTemplateRegistryLoading() {
        // When
        emailTemplateService.initializeTemplates();

        // Then
        assertNotNull(emailTemplateService.getTemplateCategories());
        assertTrue(emailTemplateService.getTemplateCategories().contains("user-management"));
        assertTrue(emailTemplateService.getTemplateCategories().contains("notifications"));
        assertTrue(emailTemplateService.getTemplateCategories().contains("communication"));
    }

    @Test
    void testWelcomeTemplateMetadata() {
        // When
        Optional<Map<String, Object>> metadata = emailTemplateService.getTemplateMetadata("welcome");

        // Then
        assertTrue(metadata.isPresent());
        Map<String, Object> templateMetadata = metadata.get();
        assertEquals("Welcome email for new users", templateMetadata.get("description"));
        assertEquals("user-management", templateMetadata.get("category"));
        assertEquals("user-management/welcome.html", templateMetadata.get("path"));
        
        @SuppressWarnings("unchecked")
        var variables = (java.util.List<String>) templateMetadata.get("variables");
        assertNotNull(variables);
        assertTrue(variables.contains("userName"));
        assertTrue(variables.contains("userEmail"));
        assertTrue(variables.contains("websiteName"));
        assertTrue(variables.contains("websiteUrl"));
    }

    @Test
    void testPasswordResetTemplateMetadata() {
        // When
        Optional<Map<String, Object>> metadata = emailTemplateService.getTemplateMetadata("password-reset");

        // Then
        assertTrue(metadata.isPresent());
        Map<String, Object> templateMetadata = metadata.get();
        assertEquals("Password reset email with secure token", templateMetadata.get("description"));
        assertEquals("user-management", templateMetadata.get("category"));
        
        @SuppressWarnings("unchecked")
        var variables = (java.util.List<String>) templateMetadata.get("variables");
        assertNotNull(variables);
        assertTrue(variables.contains("userName"));
        assertTrue(variables.contains("resetUrl"));
        assertTrue(variables.contains("websiteName"));
        assertTrue(variables.contains("expiryHours"));
    }

    @Test
    void testTemplateValidation() {
        // Given
        Map<String, Object> validVariables = Map.of(
            "userName", "testuser",
            "userEmail", "test@example.com",
            "websiteName", "AutoTrader",
            "websiteUrl", "http://localhost:3000",
            "language", "en"
        );

        Map<String, Object> invalidVariables = Map.of(
            "userName", "testuser"
            // Missing required variables
        );

        // When & Then
        assertTrue(emailTemplateService.validateTemplate("welcome", validVariables));
        assertFalse(emailTemplateService.validateTemplate("welcome", invalidVariables));
    }

    @Test
    void testLanguageSupport() {
        // When & Then
        assertTrue(emailTemplateService.supportsLanguage("welcome", "en"));
        assertTrue(emailTemplateService.supportsLanguage("welcome", "ar"));
        assertFalse(emailTemplateService.supportsLanguage("welcome", "fr"));
    }

    @Test
    void testEmailTemplateBuilder_WelcomeTemplate() {
        // When
        EmailTemplateBuilder.EmailTemplateData templateData = emailTemplateBuilder
            .template(EmailTemplateConstants.TEMPLATE_WELCOME)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .withLanguage()
            .build();

        // Then
        assertNotNull(templateData);
        assertEquals("welcome", templateData.getTemplateName());
        assertEquals("en", templateData.getLanguage());
        
        Map<String, Object> variables = templateData.getVariables();
        assertEquals("testuser", variables.get("userName"));
        assertEquals("test@example.com", variables.get("userEmail"));
        assertEquals("AutoTrader", variables.get("websiteName"));
        assertEquals("http://localhost:3000", variables.get("websiteUrl"));
        assertEquals("en", variables.get("language"));
    }

    @Test
    void testEmailTemplateBuilder_PasswordResetTemplate() {
        // When
        EmailTemplateBuilder.EmailTemplateData templateData = emailTemplateBuilder
            .template(EmailTemplateConstants.TEMPLATE_PASSWORD_RESET)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .passwordReset("http://localhost:3000/reset?token=abc123", 24)
            .withLanguage()
            .build();

        // Then
        assertNotNull(templateData);
        assertEquals("password-reset", templateData.getTemplateName());
        
        Map<String, Object> variables = templateData.getVariables();
        assertEquals("http://localhost:3000/reset?token=abc123", variables.get("resetUrl"));
        assertEquals(24, variables.get("expiryHours"));
    }

    @Test
    void testEmailTemplateBuilder_ArabicLanguage() {
        // When
        EmailTemplateBuilder.EmailTemplateData templateData = emailTemplateBuilder
            .template(EmailTemplateConstants.TEMPLATE_WELCOME)
            .language(EmailTemplateConstants.LANGUAGE_ARABIC)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .withLanguage()
            .build();

        // Then
        assertNotNull(templateData);
        assertEquals("ar", templateData.getLanguage());
        assertEquals("ar", templateData.getVariables().get("language"));
    }

    @Test
    void testTemplateCategories() {
        // When
        var userManagementTemplates = emailTemplateService.getTemplatesByCategory("user-management");
        var notificationTemplates = emailTemplateService.getTemplatesByCategory("notifications");
        var communicationTemplates = emailTemplateService.getTemplatesByCategory("communication");

        // Then
        assertNotNull(userManagementTemplates);
        assertTrue(userManagementTemplates.contains("welcome"));
        assertTrue(userManagementTemplates.contains("password-reset"));
        assertTrue(userManagementTemplates.contains("password-reset-confirmation"));

        assertNotNull(notificationTemplates);
        assertTrue(notificationTemplates.contains("listing-approved"));
        assertTrue(notificationTemplates.contains("listing-expired"));
        assertTrue(notificationTemplates.contains("listing-renewal"));

        assertNotNull(communicationTemplates);
        assertTrue(communicationTemplates.contains("contact-form"));
        assertTrue(communicationTemplates.contains("contact-confirmation"));
    }

    @Test
    void testAllTemplatesRetrieval() {
        // When
        Map<String, Map<String, Object>> allTemplates = emailTemplateService.getAllTemplates();

        // Then
        assertNotNull(allTemplates);
        assertTrue(allTemplates.size() > 0);
        
        // Check that we have templates from all categories
        assertTrue(allTemplates.containsKey("welcome"));
        assertTrue(allTemplates.containsKey("password-reset"));
        assertTrue(allTemplates.containsKey("listing-approved"));
        assertTrue(allTemplates.containsKey("contact-form"));
        assertTrue(allTemplates.containsKey("base-email"));
    }

    @Test
    void testTemplatePathResolution() {
        // When
        Optional<String> welcomePath = emailTemplateService.getTemplatePath("welcome");
        Optional<String> passwordResetPath = emailTemplateService.getTemplatePath("password-reset");
        Optional<String> nonExistentPath = emailTemplateService.getTemplatePath("non-existent");

        // Then
        assertTrue(welcomePath.isPresent());
        assertEquals("user-management/welcome.html", welcomePath.get());
        
        assertTrue(passwordResetPath.isPresent());
        assertEquals("user-management/password-reset.html", passwordResetPath.get());
        
        assertFalse(nonExistentPath.isPresent());
    }

    @Test
    void testEmailTemplateBuilder_ContactFormTemplate() {
        // When
        EmailTemplateBuilder.EmailTemplateData templateData = emailTemplateBuilder
            .template(EmailTemplateConstants.TEMPLATE_CONTACT_FORM)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .contactForm("John Doe", "john@example.com", "Hello, I have a question")
            .build();

        // Then
        assertNotNull(templateData);
        assertEquals("contact-form", templateData.getTemplateName());
        
        Map<String, Object> variables = templateData.getVariables();
        assertEquals("John Doe", variables.get("senderName"));
        assertEquals("john@example.com", variables.get("senderEmail"));
        assertEquals("Hello, I have a question", variables.get("message"));
        assertNotNull(variables.get("timestamp"));
    }

    @Test
    void testEmailTemplateBuilder_ListingTemplate() {
        // When
        EmailTemplateBuilder.EmailTemplateData templateData = emailTemplateBuilder
            .template(EmailTemplateConstants.TEMPLATE_LISTING_APPROVED)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .listing("2020 Toyota Camry", "http://localhost:3000/listings/123")
            .withLanguage()
            .build();

        // Then
        assertNotNull(templateData);
        assertEquals("listing-approved", templateData.getTemplateName());
        
        Map<String, Object> variables = templateData.getVariables();
        assertEquals("2020 Toyota Camry", variables.get("listingTitle"));
        assertEquals("http://localhost:3000/listings/123", variables.get("listingUrl"));
    }
}
