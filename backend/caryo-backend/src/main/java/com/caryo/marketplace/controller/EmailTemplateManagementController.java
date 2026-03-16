package com.caryo.marketplace.controller;

import com.caryo.marketplace.service.EmailTemplateService;
import com.caryo.marketplace.service.EmailTemplateValidationService;
import com.caryo.marketplace.service.EmailTemplateValidationService.ValidationResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.Optional;

/**
 * REST controller for email template management.
 * Provides endpoints for template validation, listing, and configuration.
 */
@RestController
@RequestMapping("/api/v1/admin/email-templates")
@PreAuthorize("hasRole('ADMIN')")
public class EmailTemplateManagementController {

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Autowired
    private EmailTemplateValidationService validationService;

    /**
     * Get all templates with their metadata.
     */
    @GetMapping
    public ResponseEntity<Map<String, Map<String, Object>>> getAllTemplates() {
        Map<String, Map<String, Object>> templates = emailTemplateService.getAllTemplates();
        return ResponseEntity.ok(templates);
    }

    /**
     * Get template metadata by name.
     */
    @GetMapping("/{templateName}")
    public ResponseEntity<?> getTemplateMetadata(@PathVariable String templateName) {
        Optional<Map<String, Object>> metadata = emailTemplateService.getTemplateMetadata(templateName);

        if (metadata.isPresent()) {
            return ResponseEntity.ok(metadata.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get templates by category.
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<String>> getTemplatesByCategory(@PathVariable String category) {
        List<String> templates = emailTemplateService.getTemplatesByCategory(category);
        return ResponseEntity.ok(templates);
    }

    /**
     * Get all template categories.
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getTemplateCategories() {
        List<String> categories = emailTemplateService.getTemplateCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * Validate a specific template with variables.
     */
    @PostMapping("/{templateName}/validate")
    public ResponseEntity<ValidationResult> validateTemplate(
            @PathVariable String templateName,
            @RequestBody Map<String, Object> variables) {

        ValidationResult result = validationService.validateTemplate(templateName, variables);
        return ResponseEntity.ok(result);
    }

    /**
     * Validate all templates in the registry.
     */
    @GetMapping("/validate/all")
    public ResponseEntity<ValidationResult> validateAllTemplates() {
        ValidationResult result = validationService.validateAllTemplates();
        return ResponseEntity.ok(result);
    }

    /**
     * Validate template categories.
     */
    @GetMapping("/validate/categories")
    public ResponseEntity<ValidationResult> validateCategories() {
        ValidationResult result = validationService.validateCategories();
        return ResponseEntity.ok(result);
    }

    /**
     * Get validation summary.
     */
    @GetMapping("/validate/summary")
    public ResponseEntity<String> getValidationSummary() {
        String summary = validationService.getValidationSummary();
        return ResponseEntity.ok(summary);
    }

    /**
     * Check if template supports a specific language.
     */
    @GetMapping("/{templateName}/supports-language/{language}")
    public ResponseEntity<Boolean> supportsLanguage(
            @PathVariable String templateName,
            @PathVariable String language) {

        boolean supports = emailTemplateService.supportsLanguage(templateName, language);
        return ResponseEntity.ok(supports);
    }

    /**
     * Get template path.
     */
    @GetMapping("/{templateName}/path")
    public ResponseEntity<?> getTemplatePath(@PathVariable String templateName) {
        Optional<String> path = emailTemplateService.getTemplatePath(templateName);

        if (path.isPresent()) {
            return ResponseEntity.ok(Map.of("path", path.get()));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get template configuration.
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getTemplateConfig() {
        Map<String, Object> config = emailTemplateService.getTemplateConfig();
        return ResponseEntity.ok(config);
    }

    /**
     * Health check for email template system.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        try {
            List<String> categories = emailTemplateService.getTemplateCategories();
            Map<String, Map<String, Object>> templates = emailTemplateService.getAllTemplates();
            ValidationResult validation = validationService.validateAllTemplates();

            Map<String, Object> health = Map.of(
                "status", "healthy",
                "categories", categories.size(),
                "templates", templates.size(),
                "validation", Map.of(
                    "valid", validation.isValid(),
                    "issues", validation.getIssues().size(),
                    "warnings", validation.getWarnings().size()
                )
            );

            return ResponseEntity.ok(health);
        } catch (Exception e) {
            Map<String, Object> health = Map.of(
                "status", "unhealthy",
                "error", e.getMessage()
            );
            return ResponseEntity.status(500).body(health);
        }
    }
}
