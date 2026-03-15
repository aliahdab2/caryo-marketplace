package com.caryo.marketplace.constants;

/**
 * Constants for email template names and categories.
 * Centralizes template naming to avoid magic strings.
 */
public final class EmailTemplateConstants {

    private EmailTemplateConstants() {
        // Prevent instantiation
    }

    // Template Categories
    public static final String CATEGORY_USER_MANAGEMENT = "user-management";
    public static final String CATEGORY_NOTIFICATIONS = "notifications";
    public static final String CATEGORY_COMMUNICATION = "communication";
    public static final String CATEGORY_MARKETING = "marketing";
    public static final String CATEGORY_BASE = "base";

    // User Management Templates
    public static final String TEMPLATE_WELCOME = "welcome";
    public static final String TEMPLATE_WELCOME_ENHANCED = "welcome-enhanced";
    public static final String TEMPLATE_PASSWORD_RESET = "password-reset";
    public static final String TEMPLATE_PASSWORD_RESET_CONFIRMATION = "password-reset-confirmation";

    // Notification Templates
    public static final String TEMPLATE_LISTING_APPROVED = "listing-approved";
    public static final String TEMPLATE_LISTING_APPROVED_IMPROVED = "listing-approved-improved";
    public static final String TEMPLATE_LISTING_EXPIRED = "listing-expired";
    public static final String TEMPLATE_LISTING_RENEWAL = "listing-renewal";

    // Communication Templates
    public static final String TEMPLATE_CONTACT_FORM = "contact-form";
    public static final String TEMPLATE_CONTACT_CONFIRMATION = "contact-confirmation";
    public static final String TEMPLATE_CONTACT_CONFIRMATION_IMPROVED = "contact-confirmation-improved";

    // Base Templates
    public static final String TEMPLATE_BASE_EMAIL = "base-email";

    // Supported Languages
    public static final String LANGUAGE_ENGLISH = "en";
    public static final String LANGUAGE_ARABIC = "ar";

    // Template Variables
    public static final String VAR_USER_NAME = "userName";
    public static final String VAR_USER_EMAIL = "userEmail";
    public static final String VAR_WEBSITE_NAME = "websiteName";
    public static final String VAR_WEBSITE_URL = "websiteUrl";
    public static final String VAR_LANGUAGE = "language";
    public static final String VAR_RESET_URL = "resetUrl";
    public static final String VAR_EXPIRY_HOURS = "expiryHours";
    public static final String VAR_LOGIN_URL = "loginUrl";
    public static final String VAR_LISTING_TITLE = "listingTitle";
    public static final String VAR_LISTING_URL = "listingUrl";
    public static final String VAR_RENEWAL_URL = "renewalUrl";
    public static final String VAR_EXPIRY_DATE = "expiryDate";
    public static final String VAR_SENDER_NAME = "senderName";
    public static final String VAR_SENDER_EMAIL = "senderEmail";
    public static final String VAR_MESSAGE = "message";
    public static final String VAR_TIMESTAMP = "timestamp";
    public static final String VAR_SUPPORT_EMAIL = "supportEmail";
}
