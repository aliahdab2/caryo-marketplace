package com.caryo.marketplace.service;

import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.User;

import java.util.Map;

/**
 * Email service interface for sending various types of emails.
 * Supports templated emails, simple text emails, and listing-related notifications.
 */
public interface EmailService {

    /**
     * Send templated email with default language.
     */
    void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables);

    /**
     * Send templated email with specified language.
     */
    void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables, String language);

    /**
     * Send simple text email.
     */
    void sendSimpleEmail(String to, String subject, String text);

    /**
     * Send listing approved email with default language.
     */
    void sendListingApprovedEmail(User seller, CarListing listing);

    /**
     * Send listing approved email with specified language.
     */
    void sendListingApprovedEmail(User seller, CarListing listing, String language);

    /**
     * Send listing expired email with default language.
     */
    void sendListingExpiredEmail(User seller, CarListing listing);

    /**
     * Send listing expired email with specified language.
     */
    void sendListingExpiredEmail(User seller, CarListing listing, String language);

    /**
     * Send password reset email with default language.
     */
    void sendPasswordResetEmail(String toEmail, String username, String resetUrl);

    /**
     * Send password reset email with specified language.
     */
    void sendPasswordResetEmail(String toEmail, String username, String resetUrl, String language);

    /**
     * Send password reset confirmation email with default language.
     */
    void sendPasswordResetConfirmationEmail(String toEmail, String username);

    /**
     * Send password reset confirmation email with specified language.
     */
    void sendPasswordResetConfirmationEmail(String toEmail, String username, String language);

    /**
     * Send listing renewal email with default language.
     */
    void sendListingRenewalEmail(User seller, CarListing listing, int renewalDays);

    /**
     * Send listing renewal email with specified language.
     */
    void sendListingRenewalEmail(User seller, CarListing listing, int renewalDays, String language);

    /**
     * Send contact form notification email.
     */
    void sendContactFormNotificationEmail(String name, String email, String subject, String message, String language);

    /**
     * Send contact form confirmation email.
     */
    void sendContactFormConfirmationEmail(String name, String email, String language);

    /**
     * Send contact form email (legacy method name).
     */
    void sendContactFormEmail(String name, String email, String message, String language);

    /**
     * Send contact form confirmation (legacy method name).
     */
    void sendContactFormConfirmation(String name, String email, String language);

    /**
     * Health check method to verify email service is working.
     */
    boolean isEmailServiceHealthy();

    /**
     * Send listing feedback request email.
     */
    void sendListingFeedbackRequestEmail(User seller, CarListing listing);

    /**
     * Send listing feedback request email with specified language.
     */
    void sendListingFeedbackRequestEmail(User seller, CarListing listing, String language);

    /**
     * Send welcome email with default language.
     */
    void sendWelcomeEmail(User user);

    /**
     * Send welcome email with specified language.
     */
    void sendWelcomeEmail(User user, String language);

    /**
     * Send email verification email to user.
     */
    void sendEmailVerificationEmail(User user, String verificationToken);

    /**
     * Send email verification email with specified language.
     */
    void sendEmailVerificationEmail(User user, String verificationToken, String language);

    /**
     * Send contact form email with default language.
     */
    void sendContactFormEmail(String name, String email, String message);

    /**
     * Send contact form confirmation with default language.
     */
    void sendContactFormConfirmation(String name, String email);

    /**
     * Send listing sold email with default language.
     */
    void sendListingSoldEmail(User seller, CarListing listing);

    /**
     * Send listing sold email with specified language.
     */
    void sendListingSoldEmail(User seller, CarListing listing, String language);

    /**
     * Send listing archived by admin email with default language.
     */
    void sendListingArchivedByAdminEmail(User seller, CarListing listing, String reason);

    /**
     * Send listing archived by admin email with specified language.
     */
    void sendListingArchivedByAdminEmail(User seller, CarListing listing, String reason, String language);

    /**
     * Send newsletter confirmation email with default parameters.
     */
    void sendNewsletterConfirmationEmail(String email, String confirmationUrl, String unsubscribeUrl);

    /**
     * Send newsletter confirmation email with specified language.
     */
    void sendNewsletterConfirmationEmail(String email, String confirmationUrl, String unsubscribeUrl, String language);

    /**
     * Send newsletter welcome email with default language.
     */
    void sendNewsletterWelcomeEmail(String email, String unsubscribeUrl);

    /**
     * Send newsletter welcome email with specified language.
     */
    void sendNewsletterWelcomeEmail(String email, String unsubscribeUrl, String language);

    /**
     * Send user registration confirmation email.
     */
    void sendRegistrationConfirmationEmail(String email, String username, String confirmationUrl);

    /**
     * Send user registration confirmation email with specified language.
     */
    void sendRegistrationConfirmationEmail(String email, String username, String confirmationUrl, String language);

    /**
     * Send account verification email.
     */
    void sendAccountVerificationEmail(String email, String username, String verificationUrl);

    /**
     * Send account verification email with specified language.
     */
    void sendAccountVerificationEmail(String email, String username, String verificationUrl, String language);

    /**
     * Send email change confirmation.
     */
    void sendEmailChangeConfirmation(String oldEmail, String newEmail, String confirmationUrl);

    /**
     * Send email change confirmation with specified language.
     */
    void sendEmailChangeConfirmation(String oldEmail, String newEmail, String confirmationUrl, String language);

    /**
     * Send security alert email.
     */
    void sendSecurityAlertEmail(String email, String username, String alertType, String details);

    /**
     * Send security alert email with specified language.
     */
    void sendSecurityAlertEmail(String email, String username, String alertType, String details, String language);
}
