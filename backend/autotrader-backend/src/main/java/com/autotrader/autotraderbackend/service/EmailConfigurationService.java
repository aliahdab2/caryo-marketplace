package com.autotrader.autotraderbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Service for email configuration validation and management.
 * Validates email templates and configuration on application startup.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailConfigurationService {

    private final TemplateEngine templateEngine;
    
    @Value("${app.email.from}")
    private String fromEmail;
    
    @Value("${app.email.support}")
    private String supportEmail;
    
    @Value("${app.website.name}")
    private String websiteName;
    
    @Value("${app.website.url}")
    private String websiteUrl;
    
    // List of required email templates
    private static final List<String> REQUIRED_TEMPLATES = Arrays.asList(
        "welcome",
        "password-reset",
        "password-reset-confirmation",
        "listing-approved",
        "listing-expired",
        "listing-renewal", 
        "listing-sold",
        "listing-archived-by-admin",
        "listing-feedback-request",
        "contact-form",
        "contact-confirmation",
        "newsletter-confirmation",
        "newsletter-welcome"
    );
    
    /**
     * Validate email configuration on application startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void validateEmailConfiguration() {
        log.info("Validating email configuration...");
        
        // Validate basic configuration
        validateBasicConfiguration();
        
        // Validate email templates
        validateEmailTemplates();
        
        log.info("Email configuration validation completed");
    }
    
    /**
     * Validate basic email configuration.
     */
    private void validateBasicConfiguration() {
        if (fromEmail == null || fromEmail.trim().isEmpty()) {
            log.warn("Email 'from' address is not configured");
        } else {
            log.info("Email from address: {}", fromEmail);
        }
        
        if (supportEmail == null || supportEmail.trim().isEmpty()) {
            log.warn("Support email address is not configured");
        } else {
            log.info("Support email address: {}", supportEmail);
        }
        
        if (websiteName == null || websiteName.trim().isEmpty()) {
            log.warn("Website name is not configured");
        } else {
            log.info("Website name: {}", websiteName);
        }
        
        if (websiteUrl == null || websiteUrl.trim().isEmpty()) {
            log.warn("Website URL is not configured");
        } else {
            log.info("Website URL: {}", websiteUrl);
        }
    }
    
    /**
     * Validate email templates exist and can be processed.
     */
    private void validateEmailTemplates() {
        log.info("Validating {} email templates...", REQUIRED_TEMPLATES.size());
        
        int validTemplates = 0;
        int invalidTemplates = 0;
        
        for (String templateName : REQUIRED_TEMPLATES) {
            try {
                // Test template processing with minimal context
                Context context = new Context();
                context.setVariable("websiteName", websiteName);
                context.setVariable("websiteUrl", websiteUrl);
                context.setVariable("supportEmail", supportEmail);
                context.setVariable("language", "en");
                
                // Try to process the template
                String result = templateEngine.process(templateName, context);
                
                if (result != null && !result.trim().isEmpty()) {
                    log.debug("Template '{}' validated successfully", templateName);
                    validTemplates++;
                } else {
                    log.warn("Template '{}' processed but returned empty result", templateName);
                    invalidTemplates++;
                }
                
            } catch (Exception e) {
                log.error("Template '{}' validation failed: {}", templateName, e.getMessage());
                invalidTemplates++;
            }
        }
        
        log.info("Template validation completed: {} valid, {} invalid", validTemplates, invalidTemplates);
        
        if (invalidTemplates > 0) {
            log.warn("Some email templates are missing or invalid. Email functionality may be impacted.");
        }
    }
    
    /**
     * Get email configuration summary.
     */
    public Map<String, Object> getConfigurationSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("fromEmail", fromEmail);
        summary.put("supportEmail", supportEmail);
        summary.put("websiteName", websiteName);
        summary.put("websiteUrl", websiteUrl);
        summary.put("requiredTemplates", REQUIRED_TEMPLATES);
        summary.put("templateCount", REQUIRED_TEMPLATES.size());
        
        return summary;
    }
    
    /**
     * Validate a specific template with given variables.
     */
    public boolean validateTemplate(String templateName, Map<String, Object> variables) {
        try {
            Context context = new Context();
            
            // Add default variables
            context.setVariable("websiteName", websiteName);
            context.setVariable("websiteUrl", websiteUrl);
            context.setVariable("supportEmail", supportEmail);
            context.setVariable("language", "en");
            
            // Add provided variables
            if (variables != null) {
                variables.forEach(context::setVariable);
            }
            
            String result = templateEngine.process(templateName, context);
            return result != null && !result.trim().isEmpty();
            
        } catch (Exception e) {
            log.error("Template validation failed for '{}': {}", templateName, e.getMessage());
            return false;
        }
    }
    
    /**
     * Get list of missing templates.
     */
    public List<String> getMissingTemplates() {
        return REQUIRED_TEMPLATES.stream()
            .filter(template -> !validateTemplate(template, null))
            .toList();
    }
    
    /**
     * Check if email service is properly configured.
     */
    public boolean isEmailServiceConfigured() {
        return fromEmail != null && !fromEmail.trim().isEmpty() &&
               supportEmail != null && !supportEmail.trim().isEmpty() &&
               websiteName != null && !websiteName.trim().isEmpty() &&
               websiteUrl != null && !websiteUrl.trim().isEmpty();
    }
}
