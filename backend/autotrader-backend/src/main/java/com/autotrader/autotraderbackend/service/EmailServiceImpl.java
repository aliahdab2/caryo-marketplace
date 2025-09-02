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
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.retry.annotation.Recover;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import com.autotrader.autotraderbackend.util.ArabicTextUtils;
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;
import java.util.List;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;

/**
 * Implementation of EmailService using Spring Mail and Thymeleaf.
 * Supports configurable website names and multi-language email templates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@EnableAsync
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MessageService messageService;
    
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
    
    // Rate limiting configuration
    private static final int MAX_EMAILS_PER_MINUTE = 5;
    private static final int MAX_EMAILS_PER_HOUR = 20;
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(1);
    private static final Duration HOURLY_RATE_LIMIT_WINDOW = Duration.ofHours(1);
    
    // Rate limiting storage
    private final Map<String, List<LocalDateTime>> userEmailTimestamps = new ConcurrentHashMap<>();
    private final Map<String, List<LocalDateTime>> globalEmailTimestamps = new ConcurrentHashMap<>();
    
    /**
     * Check if user is rate limited for emails.
     */
    private boolean isRateLimited(String userIdentifier) {
        LocalDateTime now = LocalDateTime.now();
        
        // Clean old timestamps
        userEmailTimestamps.computeIfPresent(userIdentifier, (key, timestamps) -> {
            timestamps.removeIf(timestamp -> Duration.between(timestamp, now).compareTo(RATE_LIMIT_WINDOW) > 0);
            return timestamps;
        });
        
        // Check minute limit
        List<LocalDateTime> userTimestamps = userEmailTimestamps.computeIfAbsent(userIdentifier, k -> new ArrayList<>());
        if (userTimestamps.size() >= MAX_EMAILS_PER_MINUTE) {
            log.warn("Rate limit exceeded for user: {} - {} emails in last minute", userIdentifier, userTimestamps.size());
            return true;
        }
        
        // Check hourly limit (excluding the current timestamp that's about to be added)
        long hourlyCount = userTimestamps.stream()
            .filter(timestamp -> Duration.between(timestamp, now).compareTo(HOURLY_RATE_LIMIT_WINDOW) <= 0)
            .count();
        if (hourlyCount >= MAX_EMAILS_PER_HOUR) {
            log.warn("Hourly rate limit exceeded for user: {} - {} emails in last hour", userIdentifier, hourlyCount);
            return true;
        }
        
        // Add current timestamp
        userTimestamps.add(now);
        return false;
    }
    
    /**
     * Check if global rate limit is exceeded.
     */
    private boolean isGlobalRateLimited() {
        LocalDateTime now = LocalDateTime.now();
        String globalKey = "global";
        
        // Clean old timestamps
        globalEmailTimestamps.computeIfPresent(globalKey, (key, timestamps) -> {
            timestamps.removeIf(timestamp -> Duration.between(timestamp, now).compareTo(RATE_LIMIT_WINDOW) > 0);
            return timestamps;
        });
        
        List<LocalDateTime> globalTimestamps = globalEmailTimestamps.computeIfAbsent(globalKey, k -> new ArrayList<>());
        if (globalTimestamps.size() >= MAX_EMAILS_PER_MINUTE * 10) { // 10x user limit
            log.warn("Global rate limit exceeded - {} emails in last minute", globalTimestamps.size());
            return true;
        }
        
        globalTimestamps.add(now);
        return false;
    }

    @Override
    public void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        sendTemplatedEmail(to, subject, templateName, variables, defaultLanguage);
    }

    /**
     * Send templated email asynchronously.
     * This method runs in a separate thread to avoid blocking the main application.
     */
    @Async("emailTaskExecutor")
    public void sendTemplatedEmailAsync(String to, String subject, String templateName, Map<String, Object> variables) {
        sendTemplatedEmail(to, subject, templateName, variables, defaultLanguage);
    }

    /**
     * Send templated email asynchronously with language support.
     * This method runs in a separate thread to avoid blocking the main application.
     */
    @Async("emailTaskExecutor")
    public void sendTemplatedEmailAsync(String to, String subject, String templateName, Map<String, Object> variables, String language) {
        sendTemplatedEmail(to, subject, templateName, variables, language);
    }

    @Override
    public void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables, String language) {
        // Validate inputs
        validateEmailInputs(to, subject, templateName, language);
        
        // For templated emails, we skip content validation since templates are predefined and safe
        // Content validation is more appropriate for user-generated content in simple emails
        log.debug("Skipping content validation for templated email to: {} (template: {})", to, templateName);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            
            // Use centralized Arabic text encoding utility
            helper.setSubject(ArabicTextUtils.encodeForEmailSubject(subject));
            
            // Let MimeMessageHelper handle encoding properly - don't override headers
            // The helper with UTF-8 charset should handle Arabic text correctly
            
            Context context = new Context();
            // Set UTF-8 locale for proper character handling using centralized utility
            context.setLocale(java.util.Locale.forLanguageTag(ArabicTextUtils.getLocaleForLanguage(language)));
            
            // Add website configuration variables with proper Arabic text normalization
            context.setVariable("websiteName", getWebsiteName(language));
            context.setVariable("websiteUrl", websiteUrl);
            context.setVariable("supportEmail", websiteSupportEmail);
            context.setVariable("supportPhone", websiteSupportPhone);
            context.setVariable("language", language);
            
            // Add translation function to context for use in templates
            context.setVariable("t", new TranslationHelper(messageService, language));
            context.setVariable("currentYear", java.time.Year.now().getValue());
            
            // Add and normalize all Arabic text in variables if present
            if (variables != null) {
                variables.entrySet().forEach(entry -> {
                    if (entry.getValue() instanceof String) {
                        String normalizedValue = ArabicTextUtils.normalizeArabicText((String) entry.getValue());
                        context.setVariable(entry.getKey(), normalizedValue);
                    } else {
                        context.setVariable(entry.getKey(), entry.getValue());
                    }
                });
            }
            
            String htmlContent = templateEngine.process(templateName, context);
            
            // Ensure HTML content is properly encoded
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
        
        String subject = messageService.getLocalizedMessage("email.listing_approved.subject", language);
        
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
        
        String subject = messageService.getLocalizedMessage("email.listing_expired.subject", language);
        
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
        
        String subject = messageService.getLocalizedMessage("email.listing_renewal.subject", language);
        
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
        
        // Check rate limiting
        if (isGlobalRateLimited()) {
            log.warn("Global rate limit exceeded, skipping welcome email for user: {}", user.getEmail());
            return;
        }
        
        if (isRateLimited(user.getEmail())) {
            log.warn("Rate limit exceeded for user: {}, skipping welcome email", user.getEmail());
            return;
        }
        
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", user.getUsername());
        variables.put("userEmail", user.getEmail());
        
        Map<String, Object> subjectParams = new HashMap<>();
        subjectParams.put("websiteName", getWebsiteName(language));
        String subject = messageService.getLocalizedMessage("email.welcome.subject", language, subjectParams);
        
        sendTemplatedEmailAsync(
            user.getEmail(),
            subject,
            "welcome",
            variables,
            language
        );
    }

    @Override
    public void sendEmailVerificationEmail(User user, String verificationToken) {
        sendEmailVerificationEmail(user, verificationToken, defaultLanguage);
    }

    @Override
    public void sendEmailVerificationEmail(User user, String verificationToken, String language) {
        if (!validateUserEmailInputs(user, language)) {
            return;
        }
        
        if (verificationToken == null || verificationToken.trim().isEmpty()) {
            log.error("Cannot send email verification: verification token is null or empty for user: {}", user.getEmail());
            return;
        }
        
        // Check rate limiting
        if (isGlobalRateLimited()) {
            log.warn("Global rate limit exceeded, skipping email verification for user: {}", user.getEmail());
            return;
        }

        try {
            // Build verification URL
            String verificationUrl = websiteUrl + "/auth/verify-email?token=" + verificationToken;
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", user.getUsername());
            variables.put("userEmail", user.getEmail());
            variables.put("verificationUrl", verificationUrl);
            variables.put("verificationToken", verificationToken);
            variables.put("websiteName", getWebsiteName(language));
            variables.put("websiteUrl", websiteUrl);
            variables.put("supportEmail", websiteSupportEmail);
            variables.put("language", language);
            
            // Add translation helper
            variables.put("t", new TranslationHelper(messageService, language));
            variables.put("currentYear", java.time.Year.now().getValue());
            
            Map<String, Object> subjectParams = new HashMap<>();
            subjectParams.put("websiteName", getWebsiteName(language));
            String subject = messageService.getLocalizedMessage("email.account_verification.subject", language, subjectParams);
            
            sendTemplatedEmail(
                user.getEmail(),
                subject,
                "user-management/email-verification",
                variables,
                language
            );
            
            log.info("Email verification sent successfully to user: {} ({})", user.getUsername(), user.getEmail());
            
        } catch (Exception e) {
            log.error("Failed to send email verification to user: {} ({}). Error: {}", 
                     user.getUsername(), user.getEmail(), e.getMessage());
            throw new EmailSendException("Failed to send email verification email", e);
        }
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
        
        Map<String, Object> subjectParams = new HashMap<>();
        subjectParams.put("name", name);
        String subject = messageService.getLocalizedMessage("email.contact_form.subject", language, subjectParams);
        
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
        
        String subject = messageService.getLocalizedMessage("email.contact_confirmation.subject", language);
        
        sendTemplatedEmail(
            email,
            subject,
            "contact-confirmation",
            variables,
            language
        );
    }

    @Override
    public void sendContactFormConfirmationEmail(String name, String email, String language) {
        // Delegate to the existing method
        sendContactFormConfirmation(name, email, language);
    }

    @Override
    public void sendContactFormNotificationEmail(String name, String email, String subject, String message, String language) {
        // Delegate to the existing method - the existing method takes name, email, message, language
        // but the interface expects name, email, subject, message, language
        // We'll use the message parameter and ignore the separate subject for now
        sendContactFormEmail(name, email, message, language);
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
        
        String subject = messageService.getLocalizedMessage("email.listing_sold.subject", language);
        
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
        
        String subject = messageService.getLocalizedMessage("email.listing_archived.subject", language);
        
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
        
        String subject = messageService.getLocalizedMessage("email.listing_feedback.subject", language);
        
        sendTemplatedEmail(
            seller.getEmail(),
            subject,
            "listing-feedback-request",
            variables,
            language
        );
    }
    
    /**
     * Get website name based on language with proper Arabic text normalization.
     */
    private String getWebsiteName(String language) {
        String name = language.equals("ar") ? websiteNameAr : websiteName;
        
        if (name == null) {
            return language.equals("ar") ? "كاريو" : "Caryo Marketplace";
        }
        
        // Use centralized Arabic text normalization
        return ArabicTextUtils.normalizeArabicText(name);
    }
    
    /**
     * Health check method to verify email service is working
     */
    public boolean isEmailServiceHealthy() {
        try {
            // Test basic mail sender connectivity
            MimeMessage testMessage = mailSender.createMimeMessage();
            if (testMessage == null) {
                log.warn("Email service health check failed: Cannot create MimeMessage");
                return false;
            }
            
            // Test template engine with a simple context
            Context context = new Context();
            context.setVariable("testVariable", "test");
            
            // Test basic template processing (this will work with existing templates)
            if (templateEngine == null) {
                log.warn("Email service health check failed: Template engine is null");
                return false;
            }
            
            log.debug("Email service health check passed - mail sender and template engine are available");
            return true;
        } catch (Exception e) {
            log.error("Email service health check failed", e);
            return false;
        }
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
            
            Map<String, Object> subjectParams = new HashMap<>();
            subjectParams.put("websiteName", "en".equals(language) ? websiteName : websiteNameAr);
            String subject = messageService.getLocalizedMessage("email.newsletter_confirmation.subject", language, subjectParams);
            
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
            
            Map<String, Object> subjectParams = new HashMap<>();
            subjectParams.put("websiteName", "en".equals(language) ? websiteName : websiteNameAr);
            String subject = messageService.getLocalizedMessage("email.newsletter_welcome.subject", language, subjectParams);
            
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
     * Send password reset email with default language.
     */
    @Override
    public void sendPasswordResetEmail(String toEmail, String username, String resetUrl) {
        sendPasswordResetEmail(toEmail, username, resetUrl, defaultLanguage);
    }
    
    /**
     * Send password reset email with retry logic and specified language.
     */
    @Override
    @Retryable(
        retryFor = {Exception.class}, 
        maxAttempts = 3, 
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendPasswordResetEmail(String toEmail, String username, String resetUrl, String language) {
        try {
            if (!StringUtils.hasText(toEmail) || !StringUtils.hasText(username) || !StringUtils.hasText(resetUrl)) {
                throw new IllegalArgumentException("Email, username, and reset URL are required");
            }
            
            if (!SUPPORTED_LANGUAGES.contains(language)) {
                language = defaultLanguage;
            }
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", username);
            variables.put("resetUrl", resetUrl);
            
            String subject = messageService.getLocalizedMessage("email.password_reset.subject", language);
            
            sendTemplatedEmail(toEmail, subject, "user-management/password-reset", variables, language);
            log.info("Password reset email sent successfully to: {} in language: {}", maskEmail(toEmail), language);
            
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {} in language: {}", maskEmail(toEmail), language, e);
            throw new EmailSendException("Failed to send password reset email", e);
        }
    }
    
    /**
     * Recovery method for password reset email sending failures.
     */
    @Recover
    public void recoverPasswordResetEmail(Exception ex, String toEmail, String username, String resetUrl) {
        log.error("All attempts to send password reset email failed for: {}. Error: {}", 
            maskEmail(toEmail), ex.getMessage());
        throw new EmailSendException("Failed to send password reset email after all retry attempts", ex);
    }

    /**
     * Send password reset confirmation email with default language.
     */
    @Override
    public void sendPasswordResetConfirmationEmail(String toEmail, String username) {
        sendPasswordResetConfirmationEmail(toEmail, username, defaultLanguage);
    }
    
    /**
     * Send password reset confirmation email with retry logic and specified language.
     */
    @Override
    @Retryable(
        retryFor = {Exception.class}, 
        maxAttempts = 3, 
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendPasswordResetConfirmationEmail(String toEmail, String username, String language) {
        try {
            // Input validation
            if (!StringUtils.hasText(toEmail) || !StringUtils.hasText(username)) {
                throw new IllegalArgumentException("Email and username are required");
            }
            
            if (!SUPPORTED_LANGUAGES.contains(language)) {
                language = defaultLanguage;
            }
            
            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", username);
            
            String subject = messageService.getLocalizedMessage("email.password_reset_confirmation.subject", language);
            
            sendTemplatedEmail(toEmail, subject, "user-management/password-reset-confirmation", variables, language);
            log.info("Password reset confirmation email sent successfully to: {} in language: {}", maskEmail(toEmail), language);
            
        } catch (Exception e) {
            log.error("Failed to send password reset confirmation email to: {} in language: {}", maskEmail(toEmail), language, e);
            throw new EmailSendException("Failed to send password reset confirmation email", e);
        }
    }
    
    /**
     * Recovery method for password reset confirmation email sending failures.
     */
    @Recover
    public void recoverPasswordResetConfirmationEmail(Exception ex, String toEmail, String username) {
        log.error("All attempts to send password reset confirmation email failed for: {}. Error: {}", 
            maskEmail(toEmail), ex.getMessage());
        throw new EmailSendException("Failed to send password reset confirmation email after all retry attempts", ex);
    }

    

    /**
     * Custom exception for email sending errors.
     */
    public static class EmailSendException extends RuntimeException {
        public EmailSendException(String message, Throwable cause) {
            super(message, cause);
        }
    }
    
    /**
     * Enhanced email sending with additional validation
     */
    private void sendSimpleEmailWithValidation(String toEmail, String subject, String body) {
        try {
            // Additional email format validation
            if (!isValidEmailFormat(toEmail)) {
                throw new IllegalArgumentException("Invalid email format: " + toEmail);
            }
            
            // Check for suspicious content
            if (containsSuspiciousContent(body)) {
                log.warn("Email body contains suspicious content for recipient: {}", maskEmail(toEmail));
            }
            
            sendSimpleEmail(toEmail, subject, body);
            
        } catch (Exception e) {
            log.error("Enhanced email validation failed for: {}", maskEmail(toEmail), e);
            throw e;
        }
    }
    
    /**
     * Mask email address for logging (privacy protection)
     */
    private String maskEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return "invalid-email";
        }
        
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "invalid-email";
        }
        
        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        
        if (localPart.length() <= 2) {
            return "*".repeat(localPart.length()) + domain;
        }
        
        return localPart.charAt(0) + "*".repeat(localPart.length() - 2) + localPart.charAt(localPart.length() - 1) + domain;
    }
    
    /**
     * Basic email format validation
     */
    private boolean isValidEmailFormat(String email) {
        return StringUtils.hasText(email) && 
               email.contains("@") && 
               email.contains(".") && 
               email.length() > 5 &&
               !email.startsWith("@") &&
               !email.endsWith("@");
    }
    
    /**
     * Check for suspicious content in email body
     */
    private boolean containsSuspiciousContent(String body) {
        if (!StringUtils.hasText(body)) {
            return false;
        }
        
        String lowerBody = body.toLowerCase();
        String[] suspiciousPatterns = {
            "<script", "javascript:", "onclick=", "onerror=", 
            "eval(", "document.cookie", "window.location"
        };
        
        for (String pattern : suspiciousPatterns) {
            if (lowerBody.contains(pattern)) {
                return true;
            }
        }
        
        return false;
    }

    @Override
    public void sendRegistrationConfirmationEmail(String email, String username, String confirmationUrl) {
        sendRegistrationConfirmationEmail(email, username, confirmationUrl, "en");
    }

    @Override
    public void sendRegistrationConfirmationEmail(String email, String username, String confirmationUrl, String language) {
        Map<String, Object> variables = Map.of(
            "username", username,
            "confirmationUrl", confirmationUrl
        );

        Map<String, Object> subjectParams = new HashMap<>();
        subjectParams.put("websiteName", getWebsiteName(language));
        String subject = messageService.getLocalizedMessage("email.registration_confirmation.subject", language, subjectParams);

        sendTemplatedEmail(email, subject, "emails/user-management/registration-confirmation", variables, language);
    }

    @Override
    public void sendAccountVerificationEmail(String email, String username, String verificationUrl) {
        sendAccountVerificationEmail(email, username, verificationUrl, "en");
    }

    @Override
    public void sendAccountVerificationEmail(String email, String username, String verificationUrl, String language) {
        Map<String, Object> variables = Map.of(
            "username", username,
            "verificationUrl", verificationUrl
        );

        Map<String, Object> subjectParams = new HashMap<>();
        subjectParams.put("websiteName", getWebsiteName(language));
        String subject = messageService.getLocalizedMessage("email.account_verification.subject", language, subjectParams);

        sendTemplatedEmail(email, subject, "emails/user-management/account-verification", variables, language);
    }

    @Override
    public void sendSecurityAlertEmail(String email, String username, String alertType, String details) {
        sendSecurityAlertEmail(email, username, alertType, details, "en");
    }

    @Override
    public void sendSecurityAlertEmail(String email, String username, String alertType, String details, String language) {
        Map<String, Object> variables = Map.of(
            "username", username,
            "alertType", alertType,
            "details", details
        );

        Map<String, Object> subjectParams = new HashMap<>();
        subjectParams.put("websiteName", getWebsiteName(language));
        String subject = messageService.getLocalizedMessage("email.security_alert.subject", language, subjectParams);

        sendTemplatedEmail(email, subject, "emails/security/security-alert", variables, language);
    }

    @Override
    public void sendEmailChangeConfirmation(String oldEmail, String newEmail, String confirmationUrl) {
        sendEmailChangeConfirmation(oldEmail, newEmail, confirmationUrl, "en");
    }

    @Override
    public void sendEmailChangeConfirmation(String oldEmail, String newEmail, String confirmationUrl, String language) {
        Map<String, Object> variables = Map.of(
            "oldEmail", oldEmail,
            "newEmail", newEmail,
            "confirmationUrl", confirmationUrl
        );

        Map<String, Object> subjectParams = new HashMap<>();
        subjectParams.put("websiteName", getWebsiteName(language));
        String subject = messageService.getLocalizedMessage("email.email_change.subject", language, subjectParams);

        sendTemplatedEmail(newEmail, subject, "emails/user-management/email-change-confirmation", variables, language);
    }
} 