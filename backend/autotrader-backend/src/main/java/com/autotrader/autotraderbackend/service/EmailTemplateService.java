package com.autotrader.autotraderbackend.service;

import org.springframework.stereotype.Service;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.yaml.snakeyaml.Yaml;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Optional;

/**
 * Service for managing email templates and their metadata.
 * Provides centralized template management and validation.
 */
@Service
public class EmailTemplateService {

    private static final Logger logger = LoggerFactory.getLogger(EmailTemplateService.class);

    @Autowired
    private ResourceLoader resourceLoader;

    /**
     * Setter for resource loader (used in tests).
     */
    public void setResourceLoader(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    private Map<String, Object> templateRegistry;
    private Map<String, Object> templateConfig;

    /**
     * Initialize template registry and configuration.
     */
    public void initializeTemplates() {
        try {
            // Load template registry
            Resource registryResource = new ClassPathResource("templates/emails/config/template-registry.yml");
            Yaml yaml = new Yaml();
            try (InputStream inputStream = registryResource.getInputStream()) {
                templateRegistry = yaml.load(inputStream);
            }

            // Load template configuration
            Resource configResource = new ClassPathResource("templates/emails/config/email-templates-config.yml");
            try (InputStream inputStream = configResource.getInputStream()) {
                templateConfig = yaml.load(inputStream);
            }
        } catch (Exception e) {
            // Log error but don't fail initialization
            logger.error("Failed to load template configuration", e);
        }
    }

    /**
     * Get template path by name.
     */
    public Optional<String> getTemplatePath(String templateName) {
        if (templateRegistry == null) {
            initializeTemplates();
        }

                   try {
               @SuppressWarnings("unchecked")
               Map<String, Object> templates = (Map<String, Object>) templateRegistry.get("templates");
               
               if (templates.containsKey(templateName)) {
                   @SuppressWarnings("unchecked")
                   Map<String, Object> template = (Map<String, Object>) templates.get(templateName);
                   return Optional.of((String) template.get("path"));
               }
        } catch (Exception e) {
            logger.error("Error getting template path for template: {}", templateName, e);
        }
        
        return Optional.empty();
    }

    /**
     * Get template metadata by name.
     */
    public Optional<Map<String, Object>> getTemplateMetadata(String templateName) {
        if (templateRegistry == null) {
            initializeTemplates();
        }

                   try {
               @SuppressWarnings("unchecked")
               Map<String, Object> templates = (Map<String, Object>) templateRegistry.get("templates");
               
               if (templates.containsKey(templateName)) {
                   @SuppressWarnings("unchecked")
                   Map<String, Object> template = (Map<String, Object>) templates.get(templateName);
                   return Optional.of(template);
               }
        } catch (Exception e) {
            logger.error("Error getting template metadata for template: {}", templateName, e);
        }
        
        return Optional.empty();
    }

    /**
     * Get all templates in a category.
     */
    public List<String> getTemplatesByCategory(String category) {
        if (templateRegistry == null) {
            initializeTemplates();
        }

        List<String> templates = new ArrayList<>();
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> categories = (Map<String, Object>) templateRegistry.get("categories");
            
            if (categories.containsKey(category)) {
                @SuppressWarnings("unchecked")
                Map<String, Object> categoryInfo = (Map<String, Object>) categories.get(category);
                @SuppressWarnings("unchecked")
                List<String> categoryTemplates = (List<String>) categoryInfo.get("templates");
                templates.addAll(categoryTemplates);
            }
        } catch (Exception e) {
            System.err.println("Error getting templates by category: " + e.getMessage());
        }
        
        return templates;
    }

    /**
     * Get all available template categories.
     */
    public List<String> getTemplateCategories() {
        if (templateRegistry == null) {
            initializeTemplates();
        }

        List<String> categories = new ArrayList<>();
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> categoriesMap = (Map<String, Object>) templateRegistry.get("categories");
            categories.addAll(categoriesMap.keySet());
        } catch (Exception e) {
            System.err.println("Error getting template categories: " + e.getMessage());
        }
        
        return categories;
    }

    /**
     * Validate template exists and has required variables.
     */
    public boolean validateTemplate(String templateName, Map<String, Object> variables) {
        Optional<Map<String, Object>> metadata = getTemplateMetadata(templateName);
        
        if (metadata.isEmpty()) {
            return false;
        }

        @SuppressWarnings("unchecked")
        List<String> requiredVariables = (List<String>) metadata.get().get("variables");
        
        if (requiredVariables == null) {
            return true; // No required variables specified
        }

        // Check if all required variables are provided
        for (String requiredVar : requiredVariables) {
            if (!variables.containsKey(requiredVar)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get template configuration.
     */
    public Map<String, Object> getTemplateConfig() {
        if (templateConfig == null) {
            initializeTemplates();
        }
        return templateConfig != null ? templateConfig : new HashMap<>();
    }

    /**
     * Check if template supports a specific language.
     */
    public boolean supportsLanguage(String templateName, String language) {
        Optional<Map<String, Object>> metadata = getTemplateMetadata(templateName);
        
        if (metadata.isEmpty()) {
            return false;
        }

        @SuppressWarnings("unchecked")
        List<String> supportedLanguages = (List<String>) metadata.get().get("languages");
        
        return supportedLanguages != null && supportedLanguages.contains(language);
    }

    /**
     * Get all templates with their metadata.
     */
    public Map<String, Map<String, Object>> getAllTemplates() {
        if (templateRegistry == null) {
            initializeTemplates();
        }

        Map<String, Map<String, Object>> allTemplates = new HashMap<>();
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> templates = (Map<String, Object>) templateRegistry.get("templates");
            
            for (String templateName : templates.keySet()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> template = (Map<String, Object>) templates.get(templateName);
                allTemplates.put(templateName, template);
            }
        } catch (Exception e) {
            System.err.println("Error getting all templates: " + e.getMessage());
        }
        
        return allTemplates;
    }
}
