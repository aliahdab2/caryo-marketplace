package com.autotrader.autotraderbackend.constants;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for EmailTemplateConstants.
 * Ensures all constants are properly defined and accessible.
 */
class EmailTemplateConstantsTest {

    @Test
    void testTemplateCategories() {
        // Then
        assertNotNull(EmailTemplateConstants.CATEGORY_USER_MANAGEMENT);
        assertEquals("user-management", EmailTemplateConstants.CATEGORY_USER_MANAGEMENT);
        
        assertNotNull(EmailTemplateConstants.CATEGORY_NOTIFICATIONS);
        assertEquals("notifications", EmailTemplateConstants.CATEGORY_NOTIFICATIONS);
        
        assertNotNull(EmailTemplateConstants.CATEGORY_COMMUNICATION);
        assertEquals("communication", EmailTemplateConstants.CATEGORY_COMMUNICATION);
        
        assertNotNull(EmailTemplateConstants.CATEGORY_MARKETING);
        assertEquals("marketing", EmailTemplateConstants.CATEGORY_MARKETING);
        
        assertNotNull(EmailTemplateConstants.CATEGORY_BASE);
        assertEquals("base", EmailTemplateConstants.CATEGORY_BASE);
    }

    @Test
    void testUserManagementTemplates() {
        // Then
        assertNotNull(EmailTemplateConstants.TEMPLATE_WELCOME);
        assertEquals("welcome", EmailTemplateConstants.TEMPLATE_WELCOME);
        
        assertNotNull(EmailTemplateConstants.TEMPLATE_WELCOME_ENHANCED);
        assertEquals("welcome-enhanced", EmailTemplateConstants.TEMPLATE_WELCOME_ENHANCED);
        
        assertNotNull(EmailTemplateConstants.TEMPLATE_PASSWORD_RESET);
        assertEquals("password-reset", EmailTemplateConstants.TEMPLATE_PASSWORD_RESET);
        
        assertNotNull(EmailTemplateConstants.TEMPLATE_PASSWORD_RESET_CONFIRMATION);
        assertEquals("password-reset-confirmation", EmailTemplateConstants.TEMPLATE_PASSWORD_RESET_CONFIRMATION);
    }

    @Test
    void testNotificationTemplates() {
        // Then
        assertNotNull(EmailTemplateConstants.TEMPLATE_LISTING_APPROVED);
        assertEquals("listing-approved", EmailTemplateConstants.TEMPLATE_LISTING_APPROVED);
        
        assertNotNull(EmailTemplateConstants.TEMPLATE_LISTING_APPROVED_IMPROVED);
        assertEquals("listing-approved-improved", EmailTemplateConstants.TEMPLATE_LISTING_APPROVED_IMPROVED);
        
        assertNotNull(EmailTemplateConstants.TEMPLATE_LISTING_EXPIRED);
        assertEquals("listing-expired", EmailTemplateConstants.TEMPLATE_LISTING_EXPIRED);
        
        assertNotNull(EmailTemplateConstants.TEMPLATE_LISTING_RENEWAL);
        assertEquals("listing-renewal", EmailTemplateConstants.TEMPLATE_LISTING_RENEWAL);
    }

    @Test
    void testCommunicationTemplates() {
        // Then
        assertNotNull(EmailTemplateConstants.TEMPLATE_CONTACT_FORM);
        assertEquals("contact-form", EmailTemplateConstants.TEMPLATE_CONTACT_FORM);
        
        assertNotNull(EmailTemplateConstants.TEMPLATE_CONTACT_CONFIRMATION);
        assertEquals("contact-confirmation", EmailTemplateConstants.TEMPLATE_CONTACT_CONFIRMATION);
        
        assertNotNull(EmailTemplateConstants.TEMPLATE_CONTACT_CONFIRMATION_IMPROVED);
        assertEquals("contact-confirmation-improved", EmailTemplateConstants.TEMPLATE_CONTACT_CONFIRMATION_IMPROVED);
    }

    @Test
    void testBaseTemplates() {
        // Then
        assertNotNull(EmailTemplateConstants.TEMPLATE_BASE_EMAIL);
        assertEquals("base-email", EmailTemplateConstants.TEMPLATE_BASE_EMAIL);
    }

    @Test
    void testLanguages() {
        // Then
        assertNotNull(EmailTemplateConstants.LANGUAGE_ENGLISH);
        assertEquals("en", EmailTemplateConstants.LANGUAGE_ENGLISH);
        
        assertNotNull(EmailTemplateConstants.LANGUAGE_ARABIC);
        assertEquals("ar", EmailTemplateConstants.LANGUAGE_ARABIC);
    }

    @Test
    void testTemplateVariables() {
        // Then
        assertNotNull(EmailTemplateConstants.VAR_USER_NAME);
        assertEquals("userName", EmailTemplateConstants.VAR_USER_NAME);
        
        assertNotNull(EmailTemplateConstants.VAR_USER_EMAIL);
        assertEquals("userEmail", EmailTemplateConstants.VAR_USER_EMAIL);
        
        assertNotNull(EmailTemplateConstants.VAR_WEBSITE_NAME);
        assertEquals("websiteName", EmailTemplateConstants.VAR_WEBSITE_NAME);
        
        assertNotNull(EmailTemplateConstants.VAR_WEBSITE_URL);
        assertEquals("websiteUrl", EmailTemplateConstants.VAR_WEBSITE_URL);
        
        assertNotNull(EmailTemplateConstants.VAR_LANGUAGE);
        assertEquals("language", EmailTemplateConstants.VAR_LANGUAGE);
        
        assertNotNull(EmailTemplateConstants.VAR_RESET_URL);
        assertEquals("resetUrl", EmailTemplateConstants.VAR_RESET_URL);
        
        assertNotNull(EmailTemplateConstants.VAR_EXPIRY_HOURS);
        assertEquals("expiryHours", EmailTemplateConstants.VAR_EXPIRY_HOURS);
        
        assertNotNull(EmailTemplateConstants.VAR_LOGIN_URL);
        assertEquals("loginUrl", EmailTemplateConstants.VAR_LOGIN_URL);
        
        assertNotNull(EmailTemplateConstants.VAR_LISTING_TITLE);
        assertEquals("listingTitle", EmailTemplateConstants.VAR_LISTING_TITLE);
        
        assertNotNull(EmailTemplateConstants.VAR_LISTING_URL);
        assertEquals("listingUrl", EmailTemplateConstants.VAR_LISTING_URL);
        
        assertNotNull(EmailTemplateConstants.VAR_RENEWAL_URL);
        assertEquals("renewalUrl", EmailTemplateConstants.VAR_RENEWAL_URL);
        
        assertNotNull(EmailTemplateConstants.VAR_EXPIRY_DATE);
        assertEquals("expiryDate", EmailTemplateConstants.VAR_EXPIRY_DATE);
        
        assertNotNull(EmailTemplateConstants.VAR_SENDER_NAME);
        assertEquals("senderName", EmailTemplateConstants.VAR_SENDER_NAME);
        
        assertNotNull(EmailTemplateConstants.VAR_SENDER_EMAIL);
        assertEquals("senderEmail", EmailTemplateConstants.VAR_SENDER_EMAIL);
        
        assertNotNull(EmailTemplateConstants.VAR_MESSAGE);
        assertEquals("message", EmailTemplateConstants.VAR_MESSAGE);
        
        assertNotNull(EmailTemplateConstants.VAR_TIMESTAMP);
        assertEquals("timestamp", EmailTemplateConstants.VAR_TIMESTAMP);
        
        assertNotNull(EmailTemplateConstants.VAR_SUPPORT_EMAIL);
        assertEquals("supportEmail", EmailTemplateConstants.VAR_SUPPORT_EMAIL);
    }

    @Test
    void testConstantsAreFinal() {
        // Test that constants are final and cannot be modified
        // This is a compile-time check, but we can verify the values are consistent
        
        // All template names should be unique
        assertNotEquals(EmailTemplateConstants.TEMPLATE_WELCOME, EmailTemplateConstants.TEMPLATE_PASSWORD_RESET);
        assertNotEquals(EmailTemplateConstants.TEMPLATE_WELCOME, EmailTemplateConstants.TEMPLATE_LISTING_APPROVED);
        assertNotEquals(EmailTemplateConstants.TEMPLATE_PASSWORD_RESET, EmailTemplateConstants.TEMPLATE_CONTACT_FORM);
        
        // All variable names should be unique
        assertNotEquals(EmailTemplateConstants.VAR_USER_NAME, EmailTemplateConstants.VAR_USER_EMAIL);
        assertNotEquals(EmailTemplateConstants.VAR_WEBSITE_NAME, EmailTemplateConstants.VAR_WEBSITE_URL);
        assertNotEquals(EmailTemplateConstants.VAR_RESET_URL, EmailTemplateConstants.VAR_LOGIN_URL);
        
        // Languages should be different
        assertNotEquals(EmailTemplateConstants.LANGUAGE_ENGLISH, EmailTemplateConstants.LANGUAGE_ARABIC);
    }

    @Test
    void testConstantsArePublic() {
        // Test that constants are accessible
        // This is a compile-time check, but we can verify access
        
        // Categories
        assertNotNull(EmailTemplateConstants.CATEGORY_USER_MANAGEMENT);
        assertNotNull(EmailTemplateConstants.CATEGORY_NOTIFICATIONS);
        assertNotNull(EmailTemplateConstants.CATEGORY_COMMUNICATION);
        
        // Templates
        assertNotNull(EmailTemplateConstants.TEMPLATE_WELCOME);
        assertNotNull(EmailTemplateConstants.TEMPLATE_PASSWORD_RESET);
        assertNotNull(EmailTemplateConstants.TEMPLATE_LISTING_APPROVED);
        
        // Variables
        assertNotNull(EmailTemplateConstants.VAR_USER_NAME);
        assertNotNull(EmailTemplateConstants.VAR_WEBSITE_NAME);
        assertNotNull(EmailTemplateConstants.VAR_LANGUAGE);
        
        // Languages
        assertNotNull(EmailTemplateConstants.LANGUAGE_ENGLISH);
        assertNotNull(EmailTemplateConstants.LANGUAGE_ARABIC);
    }
}
