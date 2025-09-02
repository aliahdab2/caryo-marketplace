package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.constants.EmailTemplateConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Builder pattern for constructing email templates with proper validation.
 * Provides a fluent API for building email templates.
 */
@Component
public class EmailTemplateBuilder {

    @Autowired
    private EmailTemplateService templateService;

    private String templateName;
    private String language = EmailTemplateConstants.LANGUAGE_ENGLISH;
    private final Map<String, Object> variables = new HashMap<>();

    /**
     * Set the template name.
     */
    public EmailTemplateBuilder template(String templateName) {
        this.templateName = templateName;
        return this;
    }

    /**
     * Set the language.
     */
    public EmailTemplateBuilder language(String language) {
        this.language = language;
        return this;
    }

    /**
     * Add a variable to the template.
     */
    public EmailTemplateBuilder variable(String name, Object value) {
        variables.put(name, value);
        return this;
    }

    /**
     * Add user information variables.
     */
    public EmailTemplateBuilder user(String userName, String userEmail) {
        variables.put(EmailTemplateConstants.VAR_USER_NAME, userName);
        variables.put(EmailTemplateConstants.VAR_USER_EMAIL, userEmail);
        return this;
    }

    /**
     * Add website information variables.
     */
    public EmailTemplateBuilder website(String websiteName, String websiteUrl) {
        variables.put(EmailTemplateConstants.VAR_WEBSITE_NAME, websiteName);
        variables.put(EmailTemplateConstants.VAR_WEBSITE_URL, websiteUrl);
        return this;
    }

    /**
     * Add language variable.
     */
    public EmailTemplateBuilder withLanguage() {
        variables.put(EmailTemplateConstants.VAR_LANGUAGE, language);
        return this;
    }

    /**
     * Add password reset variables.
     */
    public EmailTemplateBuilder passwordReset(String resetUrl, int expiryHours) {
        variables.put(EmailTemplateConstants.VAR_RESET_URL, resetUrl);
        variables.put(EmailTemplateConstants.VAR_EXPIRY_HOURS, expiryHours);
        return this;
    }

    /**
     * Add listing variables.
     */
    public EmailTemplateBuilder listing(String listingTitle, String listingUrl) {
        variables.put(EmailTemplateConstants.VAR_LISTING_TITLE, listingTitle);
        variables.put(EmailTemplateConstants.VAR_LISTING_URL, listingUrl);
        return this;
    }

    /**
     * Add contact form variables.
     */
    public EmailTemplateBuilder contactForm(String senderName, String senderEmail, String message) {
        variables.put(EmailTemplateConstants.VAR_SENDER_NAME, senderName);
        variables.put(EmailTemplateConstants.VAR_SENDER_EMAIL, senderEmail);
        variables.put(EmailTemplateConstants.VAR_MESSAGE, message);
        variables.put(EmailTemplateConstants.VAR_TIMESTAMP, java.time.LocalDateTime.now());
        variables.put(EmailTemplateConstants.VAR_LANGUAGE, language);
        variables.put(EmailTemplateConstants.VAR_SUPPORT_EMAIL, "support@autotrader.com"); // Default support email
        return this;
    }

    /**
     * Build the email template data.
     */
    public EmailTemplateData build() {
        if (templateName == null) {
            throw new IllegalStateException("Template name must be set");
        }

        // Validate template exists
        if (!templateService.getTemplatePath(templateName).isPresent()) {
            throw new IllegalArgumentException("Template not found: " + templateName);
        }

        // Validate required variables
        if (!templateService.validateTemplate(templateName, variables)) {
            throw new IllegalArgumentException("Missing required variables for template: " + templateName);
        }

        // Validate language support
        if (!templateService.supportsLanguage(templateName, language)) {
            throw new IllegalArgumentException("Language not supported for template: " + templateName);
        }

        return new EmailTemplateData(templateName, language, new HashMap<>(variables));
    }

    /**
     * Data class for email template information.
     */
    public static class EmailTemplateData {
        private final String templateName;
        private final String language;
        private final Map<String, Object> variables;

        public EmailTemplateData(String templateName, String language, Map<String, Object> variables) {
            this.templateName = templateName;
            this.language = language;
            this.variables = variables;
        }

        public String getTemplateName() {
            return templateName;
        }

        public String getLanguage() {
            return language;
        }

        public Map<String, Object> getVariables() {
            return new HashMap<>(variables);
        }
    }
}
