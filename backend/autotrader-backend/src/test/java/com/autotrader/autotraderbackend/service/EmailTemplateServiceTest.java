package com.autotrader.autotraderbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.ClassPathResource;
import org.yaml.snakeyaml.Yaml;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailTemplateService.
 * Tests template registry loading, path resolution, and validation.
 */
@ExtendWith(MockitoExtension.class)
class EmailTemplateServiceTest {

    @Mock
    private ResourceLoader resourceLoader;

    private EmailTemplateService emailTemplateService;

    @BeforeEach
    void setUp() {
        // Create service instance
        emailTemplateService = new EmailTemplateService();
        
        // Mock the resource loader to return test YAML data
        String testRegistryYaml = """
            templates:
              welcome:
                path: "user-management/welcome.html"
                description: "Welcome email for new users"
                category: "user-management"
                variables: ["userName", "userEmail", "websiteName", "websiteUrl", "language"]
                languages: ["en", "ar"]
                features: ["responsive", "bilingual", "personalized"]
              password-reset:
                path: "user-management/password-reset.html"
                description: "Password reset email with secure token"
                category: "user-management"
                variables: ["userName", "resetUrl", "websiteName", "expiryHours", "language"]
                languages: ["en", "ar"]
                features: ["secure", "time-limited", "bilingual"]
            categories:
              user-management:
                description: "User account related emails"
                templates: ["welcome", "password-reset"]
                features: ["personalized", "secure", "bilingual"]
            features:
              responsive:
                description: "Mobile-friendly responsive design"
                css-classes: ["mobile-first", "flexible-layout"]
              bilingual:
                description: "Supports both English and Arabic"
                languages: ["en", "ar"]
                rtl-support: true
            """;
            
        String testConfigYaml = """
            email-templates:
              welcome:
                subject: "Welcome to {websiteName}!"
                description: "Welcome email for new users"
              password-reset:
                subject: "Password Reset Request"
                description: "Password reset email"
            template-settings:
              default-language: "en"
              branding:
                name: "AutoTrader"
                logo: "/images/logo.png"
            """;
        
        // Mock the registry resource
        ClassPathResource registryResource = mock(ClassPathResource.class);
        lenient().when(resourceLoader.getResource("classpath:templates/emails/config/template-registry.yml"))
            .thenReturn(registryResource);
        try {
            lenient().when(registryResource.getInputStream())
                .thenReturn(new ByteArrayInputStream(testRegistryYaml.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to mock registry resource", e);
        }
        
        // Mock the config resource
        ClassPathResource configResource = mock(ClassPathResource.class);
        lenient().when(resourceLoader.getResource("classpath:templates/emails/config/email-templates-config.yml"))
            .thenReturn(configResource);
        try {
            lenient().when(configResource.getInputStream())
                .thenReturn(new ByteArrayInputStream(testConfigYaml.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to mock config resource", e);
        }
        
        // Set the mocked resource loader
        emailTemplateService.setResourceLoader(resourceLoader);
        
        // Initialize the service
        emailTemplateService.initializeTemplates();
    }

    @Test
    void testGetTemplatePath_ExistingTemplate_ReturnsPath() {
        // Given
        String templateName = "welcome";

        // When
        Optional<String> result = emailTemplateService.getTemplatePath(templateName);

        // Then
        assertTrue(result.isPresent());
        assertEquals("user-management/welcome.html", result.get());
    }

    @Test
    void testGetTemplatePath_NonExistentTemplate_ReturnsEmpty() {
        // Given
        String templateName = "non-existent-template";

        // When
        Optional<String> result = emailTemplateService.getTemplatePath(templateName);

        // Then
        assertFalse(result.isPresent());
    }

    @Test
    void testGetTemplateMetadata_ExistingTemplate_ReturnsMetadata() {
        // Given
        String templateName = "welcome";

        // When
        Optional<Map<String, Object>> result = emailTemplateService.getTemplateMetadata(templateName);

        // Then
        assertTrue(result.isPresent());
        Map<String, Object> metadata = result.get();
        assertEquals("Welcome email for new users", metadata.get("description"));
        assertEquals("user-management", metadata.get("category"));
        
        @SuppressWarnings("unchecked")
        List<String> variables = (List<String>) metadata.get("variables");
        assertNotNull(variables);
        assertTrue(variables.contains("userName"));
        assertTrue(variables.contains("userEmail"));
        assertTrue(variables.contains("websiteName"));
        assertTrue(variables.contains("websiteUrl"));
    }

    @Test
    void testGetTemplateMetadata_NonExistentTemplate_ReturnsEmpty() {
        // Given
        String templateName = "non-existent-template";

        // When
        Optional<Map<String, Object>> result = emailTemplateService.getTemplateMetadata(templateName);

        // Then
        assertFalse(result.isPresent());
    }

    @Test
    void testGetTemplatesByCategory_UserManagement_ReturnsCorrectTemplates() {
        // When
        List<String> result = emailTemplateService.getTemplatesByCategory("user-management");

        // Then
        assertNotNull(result);
        assertTrue(result.contains("welcome"));
        assertTrue(result.contains("welcome-enhanced"));
        assertTrue(result.contains("password-reset"));
        assertTrue(result.contains("password-reset-confirmation"));
    }

    @Test
    void testGetTemplatesByCategory_Notifications_ReturnsCorrectTemplates() {
        // When
        List<String> result = emailTemplateService.getTemplatesByCategory("notifications");

        // Then
        assertNotNull(result);
        assertTrue(result.contains("listing-approved"));
        assertTrue(result.contains("listing-expired"));
        assertTrue(result.contains("listing-renewal"));
    }

    @Test
    void testGetTemplatesByCategory_NonExistentCategory_ReturnsEmptyList() {
        // When
        List<String> result = emailTemplateService.getTemplatesByCategory("non-existent-category");

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetTemplateCategories_ReturnsAllCategories() {
        // When
        List<String> result = emailTemplateService.getTemplateCategories();

        // Then
        assertNotNull(result);
        assertTrue(result.contains("user-management"));
        assertTrue(result.contains("notifications"));
        assertTrue(result.contains("communication"));
        assertTrue(result.contains("base"));
    }

    @Test
    void testValidateTemplate_ValidTemplateWithAllVariables_ReturnsTrue() {
        // Given
        String templateName = "welcome";
        Map<String, Object> variables = Map.of(
            "userName", "testuser",
            "userEmail", "test@example.com",
            "websiteName", "AutoTrader",
            "websiteUrl", "http://localhost:3000",
            "language", "en"
        );

        // When
        boolean result = emailTemplateService.validateTemplate(templateName, variables);

        // Then
        assertTrue(result);
    }

    @Test
    void testValidateTemplate_ValidTemplateWithMissingVariables_ReturnsFalse() {
        // Given
        String templateName = "welcome";
        Map<String, Object> variables = Map.of(
            "userName", "testuser"
            // Missing required variables
        );

        // When
        boolean result = emailTemplateService.validateTemplate(templateName, variables);

        // Then
        assertFalse(result);
    }

    @Test
    void testValidateTemplate_NonExistentTemplate_ReturnsFalse() {
        // Given
        String templateName = "non-existent-template";
        Map<String, Object> variables = Map.of("userName", "testuser");

        // When
        boolean result = emailTemplateService.validateTemplate(templateName, variables);

        // Then
        assertFalse(result);
    }

    @Test
    void testSupportsLanguage_EnglishLanguage_ReturnsTrue() {
        // Given
        String templateName = "welcome";
        String language = "en";

        // When
        boolean result = emailTemplateService.supportsLanguage(templateName, language);

        // Then
        assertTrue(result);
    }

    @Test
    void testSupportsLanguage_ArabicLanguage_ReturnsTrue() {
        // Given
        String templateName = "welcome";
        String language = "ar";

        // When
        boolean result = emailTemplateService.supportsLanguage(templateName, language);

        // Then
        assertTrue(result);
    }

    @Test
    void testSupportsLanguage_UnsupportedLanguage_ReturnsFalse() {
        // Given
        String templateName = "welcome";
        String language = "fr";

        // When
        boolean result = emailTemplateService.supportsLanguage(templateName, language);

        // Then
        assertFalse(result);
    }

    @Test
    void testSupportsLanguage_NonExistentTemplate_ReturnsFalse() {
        // Given
        String templateName = "non-existent-template";
        String language = "en";

        // When
        boolean result = emailTemplateService.supportsLanguage(templateName, language);

        // Then
        assertFalse(result);
    }

    @Test
    void testGetAllTemplates_ReturnsAllTemplates() {
        // When
        Map<String, Map<String, Object>> result = emailTemplateService.getAllTemplates();

        // Then
        assertNotNull(result);
        assertTrue(result.size() > 0);
        
        // Check that we have templates from different categories
        assertTrue(result.containsKey("welcome"));
        assertTrue(result.containsKey("password-reset"));
        assertTrue(result.containsKey("listing-approved"));
        assertTrue(result.containsKey("contact-form"));
    }

    @Test
    void testGetTemplateConfig_ReturnsConfiguration() {
        // When
        Map<String, Object> result = emailTemplateService.getTemplateConfig();

        // Then
        assertNotNull(result);
        assertTrue(result.size() > 0);
    }

    @Test
    void testInitializeTemplates_HandlesMissingConfigFiles_Gracefully() {
        // Given - Service with no config files
        EmailTemplateService service = new EmailTemplateService();

        // When
        assertDoesNotThrow(() -> service.initializeTemplates());

        // Then - Should not throw exception
        assertNotNull(service.getTemplateCategories());
    }
}
