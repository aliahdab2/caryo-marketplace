package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.constants.EmailTemplateConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailTemplateBuilder.
 * Tests the builder pattern, validation, and fluent API.
 */
@ExtendWith(MockitoExtension.class)
class EmailTemplateBuilderTest {

    @Mock
    private EmailTemplateService templateService;

    @InjectMocks
    private EmailTemplateBuilder templateBuilder;

    @BeforeEach
    void setUp() {
        // Mock template service responses with lenient stubbing
        lenient().when(templateService.getTemplatePath("welcome")).thenReturn(java.util.Optional.of("user-management/welcome.html"));
        lenient().when(templateService.getTemplatePath("non-existent")).thenReturn(java.util.Optional.empty());
        lenient().when(templateService.validateTemplate(eq("welcome"), any())).thenReturn(true);
        lenient().when(templateService.validateTemplate(eq("non-existent"), any())).thenReturn(false);
        lenient().when(templateService.supportsLanguage("welcome", "en")).thenReturn(true);
        lenient().when(templateService.supportsLanguage("welcome", "ar")).thenReturn(true);
        lenient().when(templateService.supportsLanguage("welcome", "fr")).thenReturn(false);
    }

    @Test
    void testBuild_ValidWelcomeTemplate_ReturnsTemplateData() {
        // Given
        Map<String, Object> expectedVariables = Map.of(
            EmailTemplateConstants.VAR_USER_NAME, "testuser",
            EmailTemplateConstants.VAR_USER_EMAIL, "test@example.com",
            EmailTemplateConstants.VAR_WEBSITE_NAME, "AutoTrader",
            EmailTemplateConstants.VAR_WEBSITE_URL, "http://localhost:3000",
            EmailTemplateConstants.VAR_LANGUAGE, "en"
        );

        // When
        EmailTemplateBuilder.EmailTemplateData result = templateBuilder
            .template(EmailTemplateConstants.TEMPLATE_WELCOME)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .withLanguage()
            .build();

        // Then
        assertNotNull(result);
        assertEquals("welcome", result.getTemplateName());
        assertEquals("en", result.getLanguage());
        assertEquals(expectedVariables, result.getVariables());
    }

    @Test
    void testBuild_NonExistentTemplate_ThrowsException() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            templateBuilder
                .template("non-existent")
                .build();
        });
    }

    @Test
    void testBuild_MissingRequiredVariables_ThrowsException() {
        // Given
        when(templateService.validateTemplate(eq("welcome"), any())).thenReturn(false);

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            templateBuilder
                .template(EmailTemplateConstants.TEMPLATE_WELCOME)
                .build();
        });
    }

    @Test
    void testBuild_UnsupportedLanguage_ThrowsException() {
        // Given
        when(templateService.supportsLanguage("welcome", "fr")).thenReturn(false);

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            templateBuilder
                .template(EmailTemplateConstants.TEMPLATE_WELCOME)
                .language("fr")
                .user("testuser", "test@example.com")
                .website("AutoTrader", "http://localhost:3000")
                .withLanguage()
                .build();
        });
    }

    @Test
    void testBuild_NoTemplateName_ThrowsException() {
        // When & Then
        assertThrows(IllegalStateException.class, () -> {
            templateBuilder
                .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
                .user("testuser", "test@example.com")
                .build();
        });
    }

    @Test
    void testBuild_PasswordResetTemplate_ReturnsCorrectData() {
        // Given
        when(templateService.getTemplatePath("password-reset")).thenReturn(java.util.Optional.of("user-management/password-reset.html"));
        when(templateService.validateTemplate(eq("password-reset"), any())).thenReturn(true);
        when(templateService.supportsLanguage("password-reset", "en")).thenReturn(true);

        // When
        EmailTemplateBuilder.EmailTemplateData result = templateBuilder
            .template(EmailTemplateConstants.TEMPLATE_PASSWORD_RESET)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .passwordReset("http://localhost:3000/reset?token=abc123", 24)
            .withLanguage()
            .build();

        // Then
        assertNotNull(result);
        assertEquals("password-reset", result.getTemplateName());
        assertEquals("en", result.getLanguage());
        
        Map<String, Object> variables = result.getVariables();
        assertEquals("testuser", variables.get(EmailTemplateConstants.VAR_USER_NAME));
        assertEquals("test@example.com", variables.get(EmailTemplateConstants.VAR_USER_EMAIL));
        assertEquals("AutoTrader", variables.get(EmailTemplateConstants.VAR_WEBSITE_NAME));
        assertEquals("http://localhost:3000", variables.get(EmailTemplateConstants.VAR_WEBSITE_URL));
        assertEquals("http://localhost:3000/reset?token=abc123", variables.get(EmailTemplateConstants.VAR_RESET_URL));
        assertEquals(24, variables.get(EmailTemplateConstants.VAR_EXPIRY_HOURS));
    }

    @Test
    void testBuild_ListingTemplate_ReturnsCorrectData() {
        // Given
        when(templateService.getTemplatePath("listing-approved")).thenReturn(java.util.Optional.of("notifications/listing-approved.html"));
        when(templateService.validateTemplate(eq("listing-approved"), any())).thenReturn(true);
        when(templateService.supportsLanguage("listing-approved", "en")).thenReturn(true);

        // When
        EmailTemplateBuilder.EmailTemplateData result = templateBuilder
            .template(EmailTemplateConstants.TEMPLATE_LISTING_APPROVED)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .listing("2020 Toyota Camry", "http://localhost:3000/listings/123")
            .withLanguage()
            .build();

        // Then
        assertNotNull(result);
        assertEquals("listing-approved", result.getTemplateName());
        
        Map<String, Object> variables = result.getVariables();
        assertEquals("2020 Toyota Camry", variables.get(EmailTemplateConstants.VAR_LISTING_TITLE));
        assertEquals("http://localhost:3000/listings/123", variables.get(EmailTemplateConstants.VAR_LISTING_URL));
    }

    @Test
    void testBuild_ContactFormTemplate_ReturnsCorrectData() {
        // Given
        when(templateService.getTemplatePath("contact-form")).thenReturn(java.util.Optional.of("communication/contact-form.html"));
        when(templateService.validateTemplate(eq("contact-form"), any())).thenReturn(true);
        when(templateService.supportsLanguage("contact-form", "en")).thenReturn(true);

        // When
        EmailTemplateBuilder.EmailTemplateData result = templateBuilder
            .template(EmailTemplateConstants.TEMPLATE_CONTACT_FORM)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .contactForm("John Doe", "john@example.com", "Hello, I have a question")
            .build();

        // Then
        assertNotNull(result);
        assertEquals("contact-form", result.getTemplateName());
        
        Map<String, Object> variables = result.getVariables();
        assertEquals("John Doe", variables.get(EmailTemplateConstants.VAR_SENDER_NAME));
        assertEquals("john@example.com", variables.get(EmailTemplateConstants.VAR_SENDER_EMAIL));
        assertEquals("Hello, I have a question", variables.get(EmailTemplateConstants.VAR_MESSAGE));
        assertNotNull(variables.get(EmailTemplateConstants.VAR_TIMESTAMP));
    }

    @Test
    void testBuild_ArabicLanguage_ReturnsCorrectData() {
        // Given
        when(templateService.supportsLanguage("welcome", "ar")).thenReturn(true);

        // When
        EmailTemplateBuilder.EmailTemplateData result = templateBuilder
            .template(EmailTemplateConstants.TEMPLATE_WELCOME)
            .language(EmailTemplateConstants.LANGUAGE_ARABIC)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .withLanguage()
            .build();

        // Then
        assertNotNull(result);
        assertEquals("welcome", result.getTemplateName());
        assertEquals("ar", result.getLanguage());
        assertEquals("ar", result.getVariables().get(EmailTemplateConstants.VAR_LANGUAGE));
    }

    @Test
    void testBuild_CustomVariable_ReturnsCorrectData() {
        // Given
        when(templateService.validateTemplate(eq("welcome"), any())).thenReturn(true);

        // When
        EmailTemplateBuilder.EmailTemplateData result = templateBuilder
            .template(EmailTemplateConstants.TEMPLATE_WELCOME)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .variable("customVar", "customValue")
            .withLanguage()
            .build();

        // Then
        assertNotNull(result);
        Map<String, Object> variables = result.getVariables();
        assertEquals("customValue", variables.get("customVar"));
    }

    @Test
    void testBuild_DefaultLanguage_ReturnsEnglish() {
        // Given
        when(templateService.supportsLanguage("welcome", "en")).thenReturn(true);

        // When
        EmailTemplateBuilder.EmailTemplateData result = templateBuilder
            .template(EmailTemplateConstants.TEMPLATE_WELCOME)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .withLanguage()
            .build();

        // Then
        assertNotNull(result);
        assertEquals("en", result.getLanguage());
    }

    @Test
    void testEmailTemplateData_ImmutableVariables() {
        // Given
        EmailTemplateBuilder.EmailTemplateData data = templateBuilder
            .template(EmailTemplateConstants.TEMPLATE_WELCOME)
            .language(EmailTemplateConstants.LANGUAGE_ENGLISH)
            .user("testuser", "test@example.com")
            .website("AutoTrader", "http://localhost:3000")
            .withLanguage()
            .build();

        // When
        Map<String, Object> variables = data.getVariables();
        variables.put("newVar", "newValue");

        // Then - The original variables should not be modified
        Map<String, Object> originalVariables = data.getVariables();
        assertFalse(originalVariables.containsKey("newVar"));
    }
}
