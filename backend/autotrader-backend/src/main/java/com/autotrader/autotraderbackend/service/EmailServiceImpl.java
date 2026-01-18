package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.service.email.EmailContentHelper;
import com.autotrader.autotraderbackend.service.email.EmailRateLimitService;
import com.autotrader.autotraderbackend.service.email.EmailSecurityService;
import com.autotrader.autotraderbackend.service.email.EmailValidationService;
import com.autotrader.autotraderbackend.util.ArabicTextUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Implementation of EmailService using Spring Mail and Thymeleaf.
 * Delegates to specialized services for rate limiting, validation, security, and content generation.
 */
@Service
@Slf4j
@EnableAsync
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MessageService messageService;
    private final EmailRateLimitService rateLimitService;
    private final EmailValidationService validationService;
    private final EmailSecurityService securityService;
    private final EmailContentHelper contentHelper;

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

    public EmailServiceImpl(
            JavaMailSender mailSender,
            TemplateEngine templateEngine,
            MessageService messageService,
            EmailRateLimitService rateLimitService,
            EmailValidationService validationService,
            EmailSecurityService securityService,
            EmailContentHelper contentHelper) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.messageService = messageService;
        this.rateLimitService = rateLimitService;
        this.validationService = validationService;
        this.securityService = securityService;
        this.contentHelper = contentHelper;
    }

    @Override
    public void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        sendTemplatedEmail(to, subject, templateName, variables, defaultLanguage);
    }

    @Async("emailTaskExecutor")
    public void sendTemplatedEmailAsync(String to, String subject, String templateName, Map<String, Object> variables) {
        sendTemplatedEmail(to, subject, templateName, variables, defaultLanguage);
    }

    @Async("emailTaskExecutor")
    public void sendTemplatedEmailAsync(String to, String subject, String templateName, Map<String, Object> variables, String language) {
        sendTemplatedEmail(to, subject, templateName, variables, language);
    }

    @Override
    public void sendTemplatedEmail(String to, String subject, String templateName, Map<String, Object> variables, String language) {
        validationService.validateTemplatedEmailInputs(to, subject, templateName, language);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(ArabicTextUtils.encodeForEmailSubject(subject));

            Context context = createTemplateContext(language, variables);
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

    private Context createTemplateContext(String language, Map<String, Object> variables) {
        Context context = new Context();
        context.setLocale(java.util.Locale.forLanguageTag(ArabicTextUtils.getLocaleForLanguage(language)));

        context.setVariable("websiteName", contentHelper.getWebsiteName(language));
        context.setVariable("websiteUrl", websiteUrl);
        context.setVariable("supportEmail", websiteSupportEmail);
        context.setVariable("supportPhone", websiteSupportPhone);
        context.setVariable("language", language);
        context.setVariable("t", new TranslationHelper(messageService, language));
        context.setVariable("currentYear", java.time.Year.now().getValue());

        if (variables != null) {
            variables.forEach((key, value) -> {
                if (value instanceof String) {
                    context.setVariable(key, ArabicTextUtils.normalizeArabicText((String) value));
                } else {
                    context.setVariable(key, value);
                }
            });
        }

        return context;
    }

    @Override
    public void sendSimpleEmail(String to, String subject, String text) {
        validationService.validateSimpleEmailInputs(to, subject, text);

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
        if (!validationService.validateListingEmailInputs(seller, listing, language)) {
            return;
        }

        Map<String, Object> variables = buildListingVariables(seller, listing, language);
        String subject = messageService.getLocalizedMessage("email.listing_approved.subject", language);
        sendTemplatedEmail(seller.getEmail(), subject, "listing-approved", variables, language);
    }

    @Override
    public void sendListingExpiredEmail(User seller, CarListing listing) {
        sendListingExpiredEmail(seller, listing, defaultLanguage);
    }

    @Override
    public void sendListingExpiredEmail(User seller, CarListing listing, String language) {
        if (!validationService.validateListingEmailInputs(seller, listing, language)) {
            return;
        }

        Map<String, Object> variables = buildListingVariables(seller, listing, language);
        String subject = messageService.getLocalizedMessage("email.listing_expired.subject", language);
        sendTemplatedEmail(seller.getEmail(), subject, "listing-expired", variables, language);
    }

    @Override
    public void sendListingRenewalEmail(User seller, CarListing listing, int renewalDays) {
        sendListingRenewalEmail(seller, listing, renewalDays, defaultLanguage);
    }

    @Override
    public void sendListingRenewalEmail(User seller, CarListing listing, int renewalDays, String language) {
        if (!validationService.validateListingEmailInputs(seller, listing, language)) {
            return;
        }
        validationService.validateRenewalDays(renewalDays);

        Map<String, Object> variables = buildListingVariables(seller, listing, language);
        variables.put("renewalDays", renewalDays);
        String subject = messageService.getLocalizedMessage("email.listing_renewal.subject", language);
        sendTemplatedEmail(seller.getEmail(), subject, "listing-renewal", variables, language);
    }

    @Override
    public void sendWelcomeEmail(User user) {
        sendWelcomeEmail(user, defaultLanguage);
    }

    @Override
    public void sendWelcomeEmail(User user, String language) {
        if (!validationService.validateUserEmailInputs(user, language)) {
            return;
        }

        if (rateLimitService.isAnyRateLimitExceeded(user.getEmail())) {
            log.warn("Rate limit exceeded, skipping welcome email for user: {}", user.getEmail());
            return;
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", user.getUsername());
        variables.put("userEmail", user.getEmail());

        Map<String, Object> subjectParams = new HashMap<>();
        subjectParams.put("websiteName", contentHelper.getWebsiteName(language));
        String subject = messageService.getLocalizedMessage("email.welcome.subject", language, subjectParams);

        sendTemplatedEmailAsync(user.getEmail(), subject, "welcome", variables, language);
    }

    @Override
    public void sendEmailVerificationEmail(User user, String verificationToken) {
        sendEmailVerificationEmail(user, verificationToken, defaultLanguage);
    }

    @Override
    public void sendEmailVerificationEmail(User user, String verificationToken, String language) {
        if (!validationService.validateUserEmailInputs(user, language)) {
            return;
        }

        if (verificationToken == null || verificationToken.trim().isEmpty()) {
            log.error("Cannot send email verification: verification token is null or empty for user: {}", user.getEmail());
            return;
        }

        if (rateLimitService.isGlobalRateLimited()) {
            log.warn("Global rate limit exceeded, skipping email verification for user: {}", user.getEmail());
            return;
        }

        try {
            String verificationUrl = contentHelper.buildVerificationUrl(verificationToken);

            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", user.getUsername());
            variables.put("userEmail", user.getEmail());
            variables.put("verificationUrl", verificationUrl);
            variables.put("verificationToken", verificationToken);
            variables.put("websiteName", contentHelper.getWebsiteName(language));
            variables.put("websiteUrl", websiteUrl);
            variables.put("supportEmail", websiteSupportEmail);
            variables.put("language", language);
            variables.put("t", new TranslationHelper(messageService, language));
            variables.put("currentYear", java.time.Year.now().getValue());

            Map<String, Object> subjectParams = new HashMap<>();
            subjectParams.put("websiteName", contentHelper.getWebsiteName(language));
            String subject = messageService.getLocalizedMessage("email.account_verification.subject", language, subjectParams);

            sendTemplatedEmail(user.getEmail(), subject, "user-management/email-verification", variables, language);
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
        validationService.validateContactFormInputs(name, email, message, language);

        Map<String, Object> variables = new HashMap<>();
        variables.put("senderName", name);
        variables.put("senderEmail", email);
        variables.put("message", message);
        variables.put("timestamp", java.time.LocalDateTime.now());

        Map<String, Object> subjectParams = new HashMap<>();
        subjectParams.put("name", name);
        String subject = messageService.getLocalizedMessage("email.contact_form.subject", language, subjectParams);

        sendTemplatedEmail(websiteSupportEmail, subject, "contact-form", variables, language);
    }

    @Override
    public void sendContactFormConfirmation(String name, String email) {
        sendContactFormConfirmation(name, email, defaultLanguage);
    }

    @Override
    public void sendContactFormConfirmation(String name, String email, String language) {
        validationService.validateContactFormConfirmationInputs(name, email, language);

        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", name);
        variables.put("supportEmail", websiteSupportEmail);

        String subject = messageService.getLocalizedMessage("email.contact_confirmation.subject", language);
        sendTemplatedEmail(email, subject, "contact-confirmation", variables, language);
    }

    @Override
    public void sendContactFormConfirmationEmail(String name, String email, String language) {
        sendContactFormConfirmation(name, email, language);
    }

    @Override
    public void sendContactFormNotificationEmail(String name, String email, String subject, String message, String language) {
        sendContactFormEmail(name, email, message, language);
    }

    @Override
    public void sendListingSoldEmail(User seller, CarListing listing) {
        sendListingSoldEmail(seller, listing, defaultLanguage);
    }

    @Override
    public void sendListingSoldEmail(User seller, CarListing listing, String language) {
        if (!validationService.validateListingEmailInputs(seller, listing, language)) {
            return;
        }

        Map<String, Object> variables = buildListingVariables(seller, listing, language);
        String subject = messageService.getLocalizedMessage("email.listing_sold.subject", language);
        sendTemplatedEmail(seller.getEmail(), subject, "listing-sold", variables, language);
    }

    @Override
    public void sendListingArchivedByAdminEmail(User seller, CarListing listing, String reason) {
        sendListingArchivedByAdminEmail(seller, listing, reason, defaultLanguage);
    }

    @Override
    public void sendListingArchivedByAdminEmail(User seller, CarListing listing, String reason, String language) {
        if (!validationService.validateListingEmailInputs(seller, listing, language)) {
            return;
        }

        Map<String, Object> variables = buildListingVariables(seller, listing, language);
        variables.put("reason", reason != null ? reason : contentHelper.getDefaultReason(language));

        String subject = messageService.getLocalizedMessage("email.listing_archived.subject", language);
        sendTemplatedEmail(seller.getEmail(), subject, "listing-archived-by-admin", variables, language);
    }

    @Override
    public void sendListingFeedbackRequestEmail(User seller, CarListing listing) {
        sendListingFeedbackRequestEmail(seller, listing, defaultLanguage);
    }

    @Override
    public void sendListingFeedbackRequestEmail(User seller, CarListing listing, String language) {
        if (!validationService.validateListingEmailInputs(seller, listing, language)) {
            return;
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", seller.getUsername());
        variables.put("listingTitle", contentHelper.getListingTitle(listing, language));
        variables.put("listingId", listing.getId());
        variables.put("feedbackUrl", contentHelper.buildFeedbackUrl(listing.getId()));

        String subject = messageService.getLocalizedMessage("email.listing_feedback.subject", language);
        sendTemplatedEmail(seller.getEmail(), subject, "listing-feedback-request", variables, language);
    }

    @Override
    public boolean isEmailServiceHealthy() {
        try {
            MimeMessage testMessage = mailSender.createMimeMessage();
            if (testMessage == null) {
                log.warn("Email service health check failed: Cannot create MimeMessage");
                return false;
            }

            if (templateEngine == null) {
                log.warn("Email service health check failed: Template engine is null");
                return false;
            }

            log.debug("Email service health check passed");
            return true;
        } catch (Exception e) {
            log.error("Email service health check failed", e);
            return false;
        }
    }

    @Override
    public void sendNewsletterConfirmationEmail(String email, String confirmationUrl, String unsubscribeUrl) {
        sendNewsletterConfirmationEmail(email, confirmationUrl, unsubscribeUrl, "en");
    }

    @Override
    public void sendNewsletterConfirmationEmail(String email, String confirmationUrl, String unsubscribeUrl, String language) {
        try {
            validationService.validateNewsletterEmailInputs(email, language);

            Map<String, Object> variables = new HashMap<>();
            variables.put("email", email);
            variables.put("confirmationUrl", confirmationUrl);
            variables.put("unsubscribeUrl", unsubscribeUrl);
            variables.put("websiteName", contentHelper.getWebsiteName(language));
            variables.put("websiteUrl", websiteUrl);
            variables.put("supportEmail", supportEmail);

            Map<String, Object> subjectParams = new HashMap<>();
            subjectParams.put("websiteName", contentHelper.getWebsiteName(language));
            String subject = messageService.getLocalizedMessage("email.newsletter_confirmation.subject", language, subjectParams);

            sendTemplatedEmail(email, subject, "newsletter-confirmation", variables, language);
            log.info("Newsletter confirmation email sent to: {} in language: {}", email, language);

        } catch (Exception e) {
            log.error("Failed to send newsletter confirmation email to: {} in language: {}", email, language, e);
            throw new EmailSendException("Failed to send newsletter confirmation email", e);
        }
    }

    @Override
    public void sendNewsletterWelcomeEmail(String email, String unsubscribeUrl) {
        sendNewsletterWelcomeEmail(email, unsubscribeUrl, "en");
    }

    @Override
    public void sendNewsletterWelcomeEmail(String email, String unsubscribeUrl, String language) {
        try {
            validationService.validateNewsletterEmailInputs(email, language);

            Map<String, Object> variables = new HashMap<>();
            variables.put("email", email);
            variables.put("unsubscribeUrl", unsubscribeUrl);
            variables.put("websiteName", contentHelper.getWebsiteName(language));
            variables.put("websiteUrl", websiteUrl);
            variables.put("supportEmail", supportEmail);

            Map<String, Object> subjectParams = new HashMap<>();
            subjectParams.put("websiteName", contentHelper.getWebsiteName(language));
            String subject = messageService.getLocalizedMessage("email.newsletter_welcome.subject", language, subjectParams);

            sendTemplatedEmail(email, subject, "newsletter-welcome", variables, language);
            log.info("Newsletter welcome email sent to: {} in language: {}", email, language);

        } catch (Exception e) {
            log.error("Failed to send newsletter welcome email to: {} in language: {}", email, language, e);
            throw new EmailSendException("Failed to send newsletter welcome email", e);
        }
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String username, String resetUrl) {
        sendPasswordResetEmail(toEmail, username, resetUrl, defaultLanguage);
    }

    @Override
    @Retryable(
        retryFor = {Exception.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendPasswordResetEmail(String toEmail, String username, String resetUrl, String language) {
        try {
            validationService.validatePasswordResetInputs(toEmail, username, resetUrl);

            if (!validationService.isLanguageSupported(language)) {
                language = defaultLanguage;
            }

            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", username);
            variables.put("resetUrl", resetUrl);

            String subject = messageService.getLocalizedMessage("email.password_reset.subject", language);
            sendTemplatedEmail(toEmail, subject, "user-management/password-reset", variables, language);
            log.info("Password reset email sent successfully to: {} in language: {}", securityService.maskEmail(toEmail), language);

        } catch (Exception e) {
            log.error("Failed to send password reset email to: {} in language: {}", securityService.maskEmail(toEmail), language, e);
            throw new EmailSendException("Failed to send password reset email", e);
        }
    }

    @Recover
    public void recoverPasswordResetEmail(Exception ex, String toEmail, String username, String resetUrl) {
        log.error("All attempts to send password reset email failed for: {}. Error: {}",
            securityService.maskEmail(toEmail), ex.getMessage());
        throw new EmailSendException("Failed to send password reset email after all retry attempts", ex);
    }

    @Override
    public void sendPasswordResetConfirmationEmail(String toEmail, String username) {
        sendPasswordResetConfirmationEmail(toEmail, username, defaultLanguage);
    }

    @Override
    @Retryable(
        retryFor = {Exception.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendPasswordResetConfirmationEmail(String toEmail, String username, String language) {
        try {
            if (toEmail == null || toEmail.trim().isEmpty() || username == null || username.trim().isEmpty()) {
                throw new IllegalArgumentException("Email and username are required");
            }

            if (!validationService.isLanguageSupported(language)) {
                language = defaultLanguage;
            }

            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", username);

            String subject = messageService.getLocalizedMessage("email.password_reset_confirmation.subject", language);
            sendTemplatedEmail(toEmail, subject, "user-management/password-reset-confirmation", variables, language);
            log.info("Password reset confirmation email sent successfully to: {} in language: {}", securityService.maskEmail(toEmail), language);

        } catch (Exception e) {
            log.error("Failed to send password reset confirmation email to: {} in language: {}", securityService.maskEmail(toEmail), language, e);
            throw new EmailSendException("Failed to send password reset confirmation email", e);
        }
    }

    @Recover
    public void recoverPasswordResetConfirmationEmail(Exception ex, String toEmail, String username) {
        log.error("All attempts to send password reset confirmation email failed for: {}. Error: {}",
            securityService.maskEmail(toEmail), ex.getMessage());
        throw new EmailSendException("Failed to send password reset confirmation email after all retry attempts", ex);
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
        subjectParams.put("websiteName", contentHelper.getWebsiteName(language));
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
        subjectParams.put("websiteName", contentHelper.getWebsiteName(language));
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
        subjectParams.put("websiteName", contentHelper.getWebsiteName(language));
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
        subjectParams.put("websiteName", contentHelper.getWebsiteName(language));
        String subject = messageService.getLocalizedMessage("email.email_change.subject", language, subjectParams);

        sendTemplatedEmail(newEmail, subject, "emails/user-management/email-change-confirmation", variables, language);
    }

    private Map<String, Object> buildListingVariables(User seller, CarListing listing, String language) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", seller.getUsername());
        variables.put("listingTitle", contentHelper.getListingTitle(listing, language));
        variables.put("listingId", listing.getId());
        variables.put("listingUrl", contentHelper.buildListingUrl(listing.getId()));
        return variables;
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
