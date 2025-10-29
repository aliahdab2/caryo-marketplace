package com.autotrader.autotraderbackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;

/**
 * Service for validating email templates and their configurations.
 * Provides comprehensive validation for template metadata, variables, and structure.
 */
@Service
public class EmailTemplateValidationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailTemplateValidationService.class);

    @Autowired
    private EmailTemplateService emailTemplateService;

    /**
     * Validation result containing validation status and issues.
     */
    public static class ValidationResult {
        private final boolean valid;
        private final List<String> issues;
        private final List<String> warnings;

        public ValidationResult(boolean valid, List<String> issues, List<String> warnings) {
            this.valid = valid;
            this.issues = issues;
            this.warnings = warnings;
        }

        public boolean isValid() {
            return valid;
        }

        public List<String> getIssues() {
            return issues;
        }

        public List<String> getWarnings() {
            return warnings;
        }

        public boolean hasIssues() {
            return !issues.isEmpty();
        }

        public boolean hasWarnings() {
            return !warnings.isEmpty();
        }
    }

    /**
     * Validate a template with provided variables.
     */
    public ValidationResult validateTemplate(String templateName, Map<String, Object> variables) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // Check if template exists
        Optional<Map<String, Object>> metadata = emailTemplateService.getTemplateMetadata(templateName);
        if (metadata.isEmpty()) {
            issues.add("Template '" + templateName + "' not found in registry");
            return new ValidationResult(false, issues, warnings);
        }

        Map<String, Object> templateMetadata = metadata.get();

        // Validate required variables
        @SuppressWarnings("unchecked")
        List<String> requiredVariables = (List<String>) templateMetadata.get("variables");
        if (requiredVariables != null) {
            for (String requiredVar : requiredVariables) {
                if (!variables.containsKey(requiredVar)) {
                    issues.add("Missing required variable: " + requiredVar);
                } else if (variables.get(requiredVar) == null) {
                    warnings.add("Variable '" + requiredVar + "' is null");
                }
            }
        }

        // Validate language support
        String language = (String) variables.get("language");
        if (language != null) {
            @SuppressWarnings("unchecked")
            List<String> supportedLanguages = (List<String>) templateMetadata.get("languages");
            if (supportedLanguages != null && !supportedLanguages.contains(language)) {
                issues.add("Language '" + language + "' not supported by template '" + templateName + "'");
            }
        }

        // Validate template path
        Optional<String> templatePath = emailTemplateService.getTemplatePath(templateName);
        if (templatePath.isEmpty()) {
            issues.add("Template path not found for template: " + templateName);
        }

        // Validate variable types
        validateVariableTypes(templateName, variables, issues, warnings);

        return new ValidationResult(issues.isEmpty(), issues, warnings);
    }

    /**
     * Validate all templates in the registry.
     */
    public ValidationResult validateAllTemplates() {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        Map<String, Map<String, Object>> allTemplates = emailTemplateService.getAllTemplates();

        for (String templateName : allTemplates.keySet()) {
            Map<String, Object> metadata = allTemplates.get(templateName);

            // Validate template metadata structure
            validateTemplateMetadata(templateName, metadata, issues, warnings);

            // Validate template path
            Optional<String> templatePath = emailTemplateService.getTemplatePath(templateName);
            if (templatePath.isEmpty()) {
                issues.add("Template path not found for template: " + templateName);
            }
        }

        return new ValidationResult(issues.isEmpty(), issues, warnings);
    }

    /**
     * Validate template metadata structure.
     */
    private void validateTemplateMetadata(String templateName, Map<String, Object> metadata,
                                        List<String> issues, List<String> warnings) {

        // Check required fields
        if (!metadata.containsKey("path")) {
            issues.add("Template '" + templateName + "' missing required field: path");
        }
        if (!metadata.containsKey("description")) {
            warnings.add("Template '" + templateName + "' missing description");
        }
        if (!metadata.containsKey("category")) {
            issues.add("Template '" + templateName + "' missing required field: category");
        }
        if (!metadata.containsKey("variables")) {
            warnings.add("Template '" + templateName + "' missing variables definition");
        }
        if (!metadata.containsKey("languages")) {
            warnings.add("Template '" + templateName + "' missing languages definition");
        }

        // Validate category
        String category = (String) metadata.get("category");
        if (category != null) {
            List<String> validCategories = emailTemplateService.getTemplateCategories();
            if (!validCategories.contains(category)) {
                issues.add("Template '" + templateName + "' has invalid category: " + category);
            }
        }

        // Validate languages
        @SuppressWarnings("unchecked")
        List<String> languages = (List<String>) metadata.get("languages");
        if (languages != null) {
            for (String language : languages) {
                if (!language.equals("en") && !language.equals("ar")) {
                    issues.add("Template '" + templateName + "' has unsupported language: " + language);
                }
            }
        }
    }

    /**
     * Validate variable types and values.
     */
    private void validateVariableTypes(String templateName, Map<String, Object> variables,
                                     List<String> issues, List<String> warnings) {

        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            String varName = entry.getKey();
            Object varValue = entry.getValue();

            // Check for empty strings
            if (varValue instanceof String && ((String) varValue).trim().isEmpty()) {
                warnings.add("Variable '" + varName + "' is empty");
            }

            // Check for very long strings
            if (varValue instanceof String && ((String) varValue).length() > 1000) {
                warnings.add("Variable '" + varName + "' is very long (" + ((String) varValue).length() + " characters)");
            }

            // Check for invalid URLs
            if (varName.toLowerCase().contains("url") && varValue instanceof String) {
                String url = (String) varValue;
                if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
                    warnings.add("Variable '" + varName + "' may not be a valid URL: " + url);
                }
            }

            // Check for invalid emails
            if (varName.toLowerCase().contains("email") && varValue instanceof String) {
                String email = (String) varValue;
                if (!email.contains("@")) {
                    warnings.add("Variable '" + varName + "' may not be a valid email: " + email);
                }
            }
        }
    }

    /**
     * Validate template categories.
     */
    public ValidationResult validateCategories() {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        List<String> categories = emailTemplateService.getTemplateCategories();
        Map<String, Map<String, Object>> allTemplates = emailTemplateService.getAllTemplates();

        // Check if all templates have valid categories
        for (String templateName : allTemplates.keySet()) {
            Map<String, Object> metadata = allTemplates.get(templateName);
            String category = (String) metadata.get("category");

            if (category == null) {
                issues.add("Template '" + templateName + "' missing category");
            } else if (!categories.contains(category)) {
                issues.add("Template '" + templateName + "' has invalid category: " + category);
            }
        }

        return new ValidationResult(issues.isEmpty(), issues, warnings);
    }

    /**
     * Get validation summary for all templates.
     */
    public String getValidationSummary() {
        ValidationResult allTemplatesResult = validateAllTemplates();
        ValidationResult categoriesResult = validateCategories();

        StringBuilder summary = new StringBuilder();
        summary.append("Email Template Validation Summary\n");
        summary.append("================================\n\n");

        summary.append("All Templates Validation: ").append(allTemplatesResult.isValid() ? "PASS" : "FAIL").append("\n");
        if (allTemplatesResult.hasIssues()) {
            summary.append("Issues:\n");
            for (String issue : allTemplatesResult.getIssues()) {
                summary.append("  - ").append(issue).append("\n");
            }
        }
        if (allTemplatesResult.hasWarnings()) {
            summary.append("Warnings:\n");
            for (String warning : allTemplatesResult.getWarnings()) {
                summary.append("  - ").append(warning).append("\n");
            }
        }

        summary.append("\nCategories Validation: ").append(categoriesResult.isValid() ? "PASS" : "FAIL").append("\n");
        if (categoriesResult.hasIssues()) {
            summary.append("Issues:\n");
            for (String issue : categoriesResult.getIssues()) {
                summary.append("  - ").append(issue).append("\n");
            }
        }

        return summary.toString();
    }
}
