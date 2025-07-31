package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;

import java.util.Map;

/**
 * Service interface for sending emails.
 * Supports both simple text emails and templated HTML emails with multi-language support.
 */
public interface EmailService {
    
    /**
     * Send a templated email using Thymeleaf.
     * 
     * @param to recipient email address
     * @param subject email subject
     * @param templateName name of the Thymeleaf template (without .html extension)
     * @param variables template variables
     */
    void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables);
    
    /**
     * Send a templated email with language support.
     * 
     * @param to recipient email address
     * @param subject email subject
     * @param templateName name of the Thymeleaf template (without .html extension)
     * @param variables template variables
     * @param language language code (en, ar)
     */
    void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables, String language);
    
    /**
     * Send a simple text email.
     * 
     * @param to recipient email address
     * @param subject email subject
     * @param text email body text
     */
    void sendSimpleEmail(String to, String subject, String text);
    
    /**
     * Send listing approved notification to seller.
     * 
     * @param seller the seller user
     * @param listing the approved listing
     */
    void sendListingApprovedEmail(User seller, CarListing listing);
    
    /**
     * Send listing approved notification to seller with specified language.
     * 
     * @param seller the seller user
     * @param listing the approved listing
     * @param language language code (en, ar)
     */
    void sendListingApprovedEmail(User seller, CarListing listing, String language);
    
    /**
     * Send listing expired notification to seller.
     * 
     * @param seller the seller user
     * @param listing the expired listing
     */
    void sendListingExpiredEmail(User seller, CarListing listing);
    
    /**
     * Send listing expired notification to seller with specified language.
     * 
     * @param seller the seller user
     * @param listing the expired listing
     * @param language language code (en, ar)
     */
    void sendListingExpiredEmail(User seller, CarListing listing, String language);
    
    /**
     * Send listing renewal initiated notification to seller.
     * 
     * @param seller the seller user
     * @param listing the listing being renewed
     * @param renewalDays number of days for renewal
     */
    void sendListingRenewalEmail(User seller, CarListing listing, int renewalDays);
    
    /**
     * Send listing renewal initiated notification to seller with specified language.
     * 
     * @param seller the seller user
     * @param listing the listing being renewed
     * @param renewalDays number of days for renewal
     * @param language language code (en, ar)
     */
    void sendListingRenewalEmail(User seller, CarListing listing, int renewalDays, String language);
    
    /**
     * Send welcome email to new user.
     * 
     * @param user the new user
     */
    void sendWelcomeEmail(User user);
    
    /**
     * Send welcome email to new user with specified language.
     * 
     * @param user the new user
     * @param language language code (en, ar)
     */
    void sendWelcomeEmail(User user, String language);
    
    /**
     * Send contact form submission to support team.
     * 
     * @param name sender name
     * @param email sender email
     * @param message sender message
     */
    void sendContactFormEmail(String name, String email, String message);
    
    /**
     * Send contact form submission to support team with specified language.
     * 
     * @param name sender name
     * @param email sender email
     * @param message sender message
     * @param language language code (en, ar)
     */
    void sendContactFormEmail(String name, String email, String message, String language);
    
    /**
     * Send contact form confirmation to sender.
     * 
     * @param name sender name
     * @param email sender email
     */
    void sendContactFormConfirmation(String name, String email);
    
    /**
     * Send contact form confirmation to sender with specified language.
     * 
     * @param name sender name
     * @param email sender email
     * @param language language code (en, ar)
     */
    void sendContactFormConfirmation(String name, String email, String language);
    
    /**
     * Send listing sold confirmation email to seller.
     * 
     * @param seller the seller user
     * @param listing the sold listing
     */
    void sendListingSoldEmail(User seller, CarListing listing);
    
    /**
     * Send listing sold confirmation email to seller with specified language.
     * 
     * @param seller the seller user
     * @param listing the sold listing
     * @param language language code (en, ar)
     */
    void sendListingSoldEmail(User seller, CarListing listing, String language);
    
    /**
     * Send listing archived by admin notification to seller.
     * 
     * @param seller the seller user
     * @param listing the archived listing
     * @param reason optional reason for archiving
     */
    void sendListingArchivedByAdminEmail(User seller, CarListing listing, String reason);
    
    /**
     * Send listing archived by admin notification to seller with specified language.
     * 
     * @param seller the seller user
     * @param listing the archived listing
     * @param reason optional reason for archiving
     * @param language language code (en, ar)
     */
    void sendListingArchivedByAdminEmail(User seller, CarListing listing, String reason, String language);
    
    /**
     * Send feedback request email to seller after listing is sold.
     * 
     * @param seller the seller user
     * @param listing the sold listing
     */
    void sendListingFeedbackRequestEmail(User seller, CarListing listing);
    
    /**
     * Send feedback request email to seller after listing is sold with specified language.
     * 
     * @param seller the seller user
     * @param listing the sold listing
     * @param language language code (en, ar)
     */
    void sendListingFeedbackRequestEmail(User seller, CarListing listing, String language);
} 