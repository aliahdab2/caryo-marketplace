package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.springframework.util.StringUtils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;
import java.util.List;

/**
 * Implementation of EmailService using Spring Mail and Thymeleaf.
 * Supports configurable website names and multi-language email templates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    @Value("${app.email.from}")
    private String fromEmail;
    
    @Value("${app.email.support}")
    private String supportEmail;
    
    @Value("${app.website.name}")
    private String websiteName;
    
    @Value("${app.website.name.ar}")
    private String websiteNameAr;
    
    @Value("${app.website.url}")
    private String websiteUrl;
    
    @Value("${app.website.support-email}")
    private String websiteSupportEmail;
    
    @Value("${app.website.support-phone}")
    private String websiteSupportPhone;
    
    @Value("${app.email.default-language:en}")
    private String defaultLanguage;
    
    @Value("${app.email.supported-languages:en,ar}")
    private String supportedLanguages;
    
    private static final List<String> SUPPORTED_LANGUAGES = Arrays.asList("en", "ar");

    @Override
    public void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        sendTemplatedEmail(to, subject, templateName, variables, defaultLanguage);
    }

    @Override
    public void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables, String language) {
        // Validate inputs
        validateEmailInputs(to, subject, templateName, language);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            
            Context context = new Context();
            if (variables != null) {
                variables.forEach(context::setVariable);
            }
            
            // Add website configuration variables
            context.setVariable("websiteName", getWebsiteName(language));
            context.setVariable("websiteUrl", websiteUrl);
            context.setVariable("supportEmail", websiteSupportEmail);
            context.setVariable("supportPhone", websiteSupportPhone);
            context.setVariable("language", language);
            
            String htmlContent = templateEngine.process(templateName, context);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Templated email sent successfully to: {} (language: {}, template: {})", to, language, templateName);
            
        } catch (MessagingException e) {
            log.error("Failed to send templated email to: {} (language: {}, template: {})", to, language, templateName, e);
            throw new EmailSendException("Failed to send email", e);
        } catch (Exception e) {
            log.error("Unexpected error sending templated email to: {} (language: {}, template: {})", to, language, templateName, e);
            throw new EmailSendException("Unexpected error sending email", e);
        }
    }

    @Override
    public void sendSimpleEmail(String to, String subject, String text) {
        // Validate inputs
        validateSimpleEmailInputs(to, subject, text);
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            
            mailSender.send(message);
            log.info("Simple email sent successfully to: {}", to);
            
        } catch (Exception e) {
            log.error("Failed to send simple email to: {}", to, e);
            throw new EmailSendException("Failed to send simple email", e);
        }
    }

    @Override
    public void sendListingApprovedEmail(User seller, CarListing listing) {
        sendListingApprovedEmail(seller, listing, defaultLanguage);
    }

    @Override
    public void sendListingApprovedEmail(User seller, CarListing listing, String language) {
        if (!validateListingEmailInputs(seller, listing, language)) {
            return;
        }
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", seller.getUsername());
        variables.put("listingTitle", getListingTitle(listing, language));
        variables.put("listingId", listing.getId());
        variables.put("listingUrl", websiteUrl + "/listings/" + listing.getId());
        
        String subject = language.equals("ar") ? 
            "تمت الموافقة على إعلانك!" : 
            "Your listing has been approved!";
        
        sendTemplatedEmail(
            seller.getEmail(),
            subject,
            "listing-approved",
            variables,
            language
        );
    }

    @Override
    public void sendListingExpiredEmail(User seller, CarListing listing) {
        sendListingExpiredEmail(seller, listing, defaultLanguage);
    }

    @Override
    public void sendListingExpiredEmail(User seller, CarListing listing, String language) {
        if (!validateListingEmailInputs(seller, listing, language)) {
            return;
        }
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", seller.getUsername());
        variables.put("listingTitle", getListingTitle(listing, language));
        variables.put("listingId", listing.getId());
        variables.put("listingUrl", websiteUrl + "/listings/" + listing.getId());
        
        String subject = language.equals("ar") ? 
            "انتهت صلاحية إعلانك" : 
            "Your listing has expired";
        
        sendTemplatedEmail(
            seller.getEmail(),
            subject,
            "listing-expired",
            variables,
            language
        );
    }

    @Override
    public void sendListingRenewalEmail(User seller, CarListing listing, int renewalDays) {
        sendListingRenewalEmail(seller, listing, renewalDays, defaultLanguage);
    }

    @Override
    public void sendListingRenewalEmail(User seller, CarListing listing, int renewalDays, String language) {
        if (!validateListingEmailInputs(seller, listing, language)) {
            return;
        }
        validateRenewalDays(renewalDays);
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", seller.getUsername());
        variables.put("listingTitle", getListingTitle(listing, language));
        variables.put("listingId", listing.getId());
        variables.put("listingUrl", websiteUrl + "/listings/" + listing.getId());
        variables.put("renewalDays", renewalDays);
        
        String subject = language.equals("ar") ? 
            "تم تجديد إعلانك" : 
            "Your listing has been renewed";
        
        sendTemplatedEmail(
            seller.getEmail(),
            subject,
            "listing-renewal",
            variables,
            language
        );
    }

    @Override
    public void sendWelcomeEmail(User user) {
        sendWelcomeEmail(user, defaultLanguage);
    }

    @Override
    public void sendWelcomeEmail(User user, String language) {
        if (!validateUserEmailInputs(user, language)) {
            return;
        }
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", user.getUsername());
        variables.put("userEmail", user.getEmail());
        
        String subject = language.equals("ar") ? 
            "مرحباً بك في " + getWebsiteName(language) + "!" : 
            "Welcome to " + getWebsiteName(language) + "!";
        
        sendTemplatedEmail(
            user.getEmail(),
            subject,
            "welcome",
            variables,
            language
        );
    }

    @Override
    public void sendContactFormEmail(String name, String email, String message) {
        sendContactFormEmail(name, email, message, defaultLanguage);
    }

    @Override
    public void sendContactFormEmail(String name, String email, String message, String language) {
        validateContactFormInputs(name, email, message, language);
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("senderName", name);
        variables.put("senderEmail", email);
        variables.put("message", message);
        variables.put("timestamp", java.time.LocalDateTime.now());
        
        String subject = language.equals("ar") ? 
            "رسالة جديدة من " + name : 
            "New contact form submission from " + name;
        
        sendTemplatedEmail(
            websiteSupportEmail,
            subject,
            "contact-form",
            variables,
            language
        );
    }

    @Override
    public void sendContactFormConfirmation(String name, String email) {
        sendContactFormConfirmation(name, email, defaultLanguage);
    }

    @Override
    public void sendContactFormConfirmation(String name, String email, String language) {
        validateContactFormConfirmationInputs(name, email, language);
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", name);
        variables.put("supportEmail", websiteSupportEmail);
        
        String subject = language.equals("ar") ? 
            "شكراً لك على التواصل معنا" : 
            "Thank you for contacting us";
        
        sendTemplatedEmail(
            email,
            subject,
            "contact-confirmation",
            variables,
            language
        );
    }
    
    @Override
    public void sendListingSoldEmail(User seller, CarListing listing) {
        sendListingSoldEmail(seller, listing, defaultLanguage);
    }

    @Override
    public void sendListingSoldEmail(User seller, CarListing listing, String language) {
        if (!validateListingEmailInputs(seller, listing, language)) {
            return;
        }
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", seller.getUsername());
        variables.put("listingTitle", getListingTitle(listing, language));
        variables.put("listingId", listing.getId());
        variables.put("listingUrl", websiteUrl + "/listings/" + listing.getId());
        
        String subject = language.equals("ar") ? 
            "تأكيد بيع إعلانك" : 
            "Your listing has been marked as sold";
        
        sendTemplatedEmail(
            seller.getEmail(),
            subject,
            "listing-sold",
            variables,
            language
        );
    }
    
    @Override
    public void sendListingArchivedByAdminEmail(User seller, CarListing listing, String reason) {
        sendListingArchivedByAdminEmail(seller, listing, reason, defaultLanguage);
    }

    @Override
    public void sendListingArchivedByAdminEmail(User seller, CarListing listing, String reason, String language) {
        if (!validateListingEmailInputs(seller, listing, language)) {
            return;
        }
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", seller.getUsername());
        variables.put("listingTitle", getListingTitle(listing, language));
        variables.put("listingId", listing.getId());
        variables.put("listingUrl", websiteUrl + "/listings/" + listing.getId());
        variables.put("reason", reason != null ? reason : (language.equals("ar") ? "غير محدد" : "No specific reason provided"));
        
        String subject = language.equals("ar") ? 
            "تم أرشفة إعلانك من قبل الإدارة" : 
            "Your listing has been archived by admin";
        
        sendTemplatedEmail(
            seller.getEmail(),
            subject,
            "listing-archived-by-admin",
            variables,
            language
        );
    }
    
    @Override
    public void sendListingFeedbackRequestEmail(User seller, CarListing listing) {
        sendListingFeedbackRequestEmail(seller, listing, defaultLanguage);
    }

    @Override
    public void sendListingFeedbackRequestEmail(User seller, CarListing listing, String language) {
        if (!validateListingEmailInputs(seller, listing, language)) {
            return;
        }
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", seller.getUsername());
        variables.put("listingTitle", getListingTitle(listing, language));
        variables.put("listingId", listing.getId());
        variables.put("feedbackUrl", websiteUrl + "/feedback?listing=" + listing.getId());
        
        String subject = language.equals("ar") ? 
            "شاركنا تجربتك - تقييم خدماتنا" : 
            "Share your experience - Rate our services";
        
        sendTemplatedEmail(
            seller.getEmail(),
            subject,
            "listing-feedback-request",
            variables,
            language
        );
    }
    
    /**
     * Get website name based on language.
     */
    private String getWebsiteName(String language) {
        return language.equals("ar") ? websiteNameAr : websiteName;
    }
    
    /**
     * Helper method to generate a listing title for emails based on language.
     */
    private String getListingTitle(CarListing listing, String language) {
        if (listing == null) {
            return language.equals("ar") ? "إعلان غير معروف" : "Unknown Listing";
        }
        
        StringBuilder title = new StringBuilder();
        
        if (listing.getBrandNameEn() != null) {
            title.append(listing.getBrandNameEn());
        }
        
        if (listing.getModelNameEn() != null) {
            if (title.length() > 0) title.append(" ");
            title.append(listing.getModelNameEn());
        }
        
        if (listing.getModelYear() != null) {
            if (title.length() > 0) title.append(" ");
            title.append(listing.getModelYear());
        }
        
        if (listing.getPrice() != null) {
            if (title.length() > 0) title.append(" - ");
            title.append("$").append(listing.getPrice());
        }
        
        return title.length() > 0 ? title.toString() : 
            (language.equals("ar") ? "إعلان سيارة" : "Car Listing");
    }
    
    /**
     * Validate email inputs for templated emails.
     */
    private void validateEmailInputs(String to, String subject, String templateName, String language) {
        if (!StringUtils.hasText(to)) {
            throw new IllegalArgumentException("Email recipient cannot be null or empty");
        }
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("Email subject cannot be null or empty");
        }
        if (!StringUtils.hasText(templateName)) {
            throw new IllegalArgumentException("Template name cannot be null or empty");
        }
        if (!SUPPORTED_LANGUAGES.contains(language)) {
            throw new IllegalArgumentException("Unsupported language: " + language + ". Supported languages: " + SUPPORTED_LANGUAGES);
        }
    }
    
    /**
     * Validate inputs for simple emails.
     */
    private void validateSimpleEmailInputs(String to, String subject, String text) {
        if (!StringUtils.hasText(to)) {
            throw new IllegalArgumentException("Email recipient cannot be null or empty");
        }
        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("Email subject cannot be null or empty");
        }
        if (!StringUtils.hasText(text)) {
            throw new IllegalArgumentException("Email text cannot be null or empty");
        }
    }
    
    /**
     * Validate inputs for listing emails.
     * @return true if inputs are valid, false otherwise
     */
    private boolean validateListingEmailInputs(User seller, CarListing listing, String language) {
        if (seller == null) {
            log.warn("Cannot send listing email: seller is null");
            return false;
        }
        if (seller.getEmail() == null || seller.getEmail().trim().isEmpty()) {
            log.warn("Cannot send listing email: seller email is null or empty for user: {}", seller.getUsername());
            return false;
        }
        if (listing == null) {
            log.warn("Cannot send listing email: listing is null");
            return false;
        }
        if (!SUPPORTED_LANGUAGES.contains(language)) {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }
        return true;
    }
    
    /**
     * Validate inputs for user emails.
     * @return true if inputs are valid, false otherwise
     */
    private boolean validateUserEmailInputs(User user, String language) {
        if (user == null) {
            log.warn("Cannot send user email: user is null");
            return false;
        }
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            log.warn("Cannot send user email: user email is null or empty for user: {}", user.getUsername());
            return false;
        }
        if (!SUPPORTED_LANGUAGES.contains(language)) {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }
        return true;
    }
    
    /**
     * Validate inputs for contact form emails.
     */
    private void validateContactFormInputs(String name, String email, String message, String language) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Contact form name cannot be null or empty");
        }
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Contact form email cannot be null or empty");
        }
        if (!StringUtils.hasText(message)) {
            throw new IllegalArgumentException("Contact form message cannot be null or empty");
        }
        if (!SUPPORTED_LANGUAGES.contains(language)) {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }
    }
    
    /**
     * Validate inputs for contact form confirmation emails.
     */
    private void validateContactFormConfirmationInputs(String name, String email, String language) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Contact form confirmation name cannot be null or empty");
        }
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Contact form confirmation email cannot be null or empty");
        }
        if (!SUPPORTED_LANGUAGES.contains(language)) {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }
    }
    
    /**
     * Validate renewal days.
     */
    private void validateRenewalDays(int renewalDays) {
        if (renewalDays <= 0) {
            throw new IllegalArgumentException("Renewal days must be positive, got: " + renewalDays);
        }
        if (renewalDays > 365) {
            throw new IllegalArgumentException("Renewal days cannot exceed 365, got: " + renewalDays);
        }
    }
    
    /**
     * Send newsletter confirmation email.
     */
    @Override
    public void sendNewsletterConfirmationEmail(String email, String confirmationUrl, String unsubscribeUrl) {
        sendNewsletterConfirmationEmail(email, confirmationUrl, unsubscribeUrl, "en");
    }
    
    /**
     * Send newsletter confirmation email with specified language.
     */
    @Override
    public void sendNewsletterConfirmationEmail(String email, String confirmationUrl, String unsubscribeUrl, String language) {
        try {
            validateNewsletterEmailInputs(email, language);
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("email", email);
            variables.put("confirmationUrl", confirmationUrl);
            variables.put("unsubscribeUrl", unsubscribeUrl);
            variables.put("websiteName", "en".equals(language) ? websiteName : websiteNameAr);
            variables.put("websiteUrl", websiteUrl);
            variables.put("supportEmail", supportEmail);
            
            String subject = "en".equals(language) 
                ? "Confirm Your Newsletter Subscription - " + websiteName
                : "تأكيد الاشتراك في النشرة الإخبارية - " + websiteNameAr;
            
            sendTemplatedEmail(email, subject, "newsletter-confirmation", variables, language);
            log.info("Newsletter confirmation email sent to: {} in language: {}", email, language);
            
        } catch (Exception e) {
            log.error("Failed to send newsletter confirmation email to: {} in language: {}", email, language, e);
            throw new EmailSendException("Failed to send newsletter confirmation email", e);
        }
    }
    
    /**
     * Send newsletter welcome email after confirmation.
     */
    @Override
    public void sendNewsletterWelcomeEmail(String email, String unsubscribeUrl) {
        sendNewsletterWelcomeEmail(email, unsubscribeUrl, "en");
    }
    
    /**
     * Send newsletter welcome email after confirmation with specified language.
     */
    @Override
    public void sendNewsletterWelcomeEmail(String email, String unsubscribeUrl, String language) {
        try {
            validateNewsletterEmailInputs(email, language);
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("email", email);
            variables.put("unsubscribeUrl", unsubscribeUrl);
            variables.put("websiteName", "en".equals(language) ? websiteName : websiteNameAr);
            variables.put("websiteUrl", websiteUrl);
            variables.put("supportEmail", supportEmail);
            
            String subject = "en".equals(language)
                ? "Welcome to " + websiteName + " Newsletter!"
                : "مرحباً بك في نشرة " + websiteNameAr + " الإخبارية!";
            
            sendTemplatedEmail(email, subject, "newsletter-welcome", variables, language);
            log.info("Newsletter welcome email sent to: {} in language: {}", email, language);
            
        } catch (Exception e) {
            log.error("Failed to send newsletter welcome email to: {} in language: {}", email, language, e);
            throw new EmailSendException("Failed to send newsletter welcome email", e);
        }
    }
    
    /**
     * Validate inputs for newsletter emails.
     */
    private void validateNewsletterEmailInputs(String email, String language) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Newsletter email cannot be null or empty");
        }
        if (!SUPPORTED_LANGUAGES.contains(language)) {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }
    }
    
    /**
     * Custom exception for email sending errors.
     */
    public static class EmailSendException extends RuntimeException {
        public EmailSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
} 