package com.autotrader.autotraderbackend.service;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for I18nService.
 * Tests locale detection and message retrieval functionality.
 */
@ExtendWith(MockitoExtension.class)
class I18nServiceTest {

    @Mock
    private MessageSource messageSource;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private I18nService i18nService;

    @BeforeEach
    void setUp() {
        // Setup default message source behavior - return the key as fallback
        lenient().when(messageSource.getMessage(anyString(), any(Object[].class), any(Locale.class)))
            .thenAnswer(invocation -> invocation.getArgument(0)); // Return key as default

        lenient().when(messageSource.getMessage(anyString(), any(Object[].class), anyString(), any(Locale.class)))
            .thenAnswer(invocation -> invocation.getArgument(0)); // Return key as default
    }

    @Test
    void testGetUserLocale_WithEnglishHeader() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("en-US");

        // Act
        Locale result = i18nService.getUserLocale(request);

        // Assert
        assertEquals(Locale.ENGLISH, result);
    }

    @Test
    void testGetUserLocale_WithArabicHeader() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("ar-SA");

        // Act
        Locale result = i18nService.getUserLocale(request);

        // Assert
        assertEquals(Locale.forLanguageTag("ar"), result);
    }

    @Test
    void testGetUserLocale_WithNullHeader() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn(null);

        // Act
        Locale result = i18nService.getUserLocale(request);

        // Assert
        assertEquals(Locale.ENGLISH, result);
    }

    @Test
    void testGetUserLocale_WithEmptyHeader() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("");

        // Act
        Locale result = i18nService.getUserLocale(request);

        // Assert
        assertEquals(Locale.ENGLISH, result);
    }

    @Test
    void testGetUserLocale_WithArabicString() {
        // Act
        Locale result = i18nService.getUserLocale("ar");

        // Assert
        assertEquals(Locale.forLanguageTag("ar"), result);
    }

    @Test
    void testGetUserLocale_WithEnglishString() {
        // Act
        Locale result = i18nService.getUserLocale("en");

        // Act & Assert
        assertEquals(Locale.ENGLISH, result);
    }

    @Test
    void testGetUserLocale_WithNullString() {
        // Act
        Locale result = i18nService.getUserLocale((String) null);

        // Assert
        assertEquals(Locale.ENGLISH, result);
    }

    @Test
    void testGetMessage_WithRequest() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("en");
        String key = "test.message";
        String expectedMessage = "Test Message";
        when(messageSource.getMessage(eq(key), any(Object[].class), eq(key), eq(Locale.ENGLISH)))
            .thenReturn(expectedMessage);

        // Act
        String result = i18nService.getMessage(key, request);

        // Assert
        assertEquals(expectedMessage, result);
        verify(messageSource).getMessage(key, new Object[0], key, Locale.ENGLISH);
    }

    @Test
    void testGetMessage_WithRequest_UsesDefaultFallback() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("en");
        String key = "test.message";

        // Act
        String result = i18nService.getMessage(key, request);

        // Assert - should fallback to key when message not found
        assertEquals(key, result);
    }

    @Test
    void testGetMessage_WithArabicRequest() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("ar");
        String key = "test.message";

        // Act
        String result = i18nService.getMessage(key, request);

        // Assert - should fallback to key when message not found
        assertEquals(key, result);
        verify(messageSource).getMessage(key, new Object[0], key, Locale.forLanguageTag("ar"));
    }

    @Test
    void testGetMessage_WithParameters() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("en");
        String key = "test.message.param";
        Object[] args = {"John", "Doe"};
        String expectedMessage = "Hello John Doe";
        when(messageSource.getMessage(eq(key), eq(args), eq(key), eq(Locale.ENGLISH)))
            .thenReturn(expectedMessage);

        // Act
        String result = i18nService.getMessage(key, request, args);

        // Assert
        assertEquals(expectedMessage, result);
        verify(messageSource).getMessage(key, args, key, Locale.ENGLISH);
    }

    @Test
    void testGetMessage_WithAcceptLanguageString() {
        // Arrange
        String key = "test.message";
        String acceptLanguage = "ar";

        // Act
        String result = i18nService.getMessage(key, acceptLanguage);

        // Assert - should fallback to key when message not found
        assertEquals(key, result);
        verify(messageSource).getMessage(key, new Object[0], key, Locale.forLanguageTag("ar"));
    }

    @Test
    void testGetMessage_WithAcceptLanguageStringAndParameters() {
        // Arrange
        String key = "test.message.param";
        String acceptLanguage = "en";
        Object[] args = {"Test"};
        String expectedMessage = "Test Message";
        when(messageSource.getMessage(eq(key), eq(args), eq(key), eq(Locale.ENGLISH)))
            .thenReturn(expectedMessage);

        // Act
        String result = i18nService.getMessage(key, acceptLanguage, args);

        // Assert
        assertEquals(expectedMessage, result);
        verify(messageSource).getMessage(key, args, key, Locale.ENGLISH);
    }

    @Test
    void testGetMessage_WithLocale() {
        // Arrange
        String key = "test.message";
        Locale locale = Locale.forLanguageTag("ar");

        // Act
        String result = i18nService.getMessage(key, locale);

        // Assert - should fallback to key when message not found
        assertEquals(key, result);
        verify(messageSource).getMessage(key, new Object[0], key, locale);
    }

    @Test
    void testGetMessage_WithLocaleAndParameters() {
        // Arrange
        String key = "test.message.param";
        Locale locale = Locale.ENGLISH;
        Object[] args = {"value1", "value2"};
        String expectedMessage = "Message with value1 and value2";
        when(messageSource.getMessage(eq(key), eq(args), eq(key), eq(locale)))
            .thenReturn(expectedMessage);

        // Act
        String result = i18nService.getMessage(key, locale, args);

        // Assert
        assertEquals(expectedMessage, result);
        verify(messageSource).getMessage(key, args, key, locale);
    }


    @Test
    void testGetMessage_FallbackToKey() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("en");
        String key = "non.existent.key";
        // MessageSource will return the key as fallback (configured in setup)

        // Act
        String result = i18nService.getMessage(key, request);

        // Assert
        assertEquals(key, result);
    }

    @Test
    void testGetMessage_HandlesExceptionGracefully() {
        // Arrange
        when(request.getHeader("Accept-Language")).thenReturn("en");
        String key = "test.message";
        when(messageSource.getMessage(anyString(), any(), any(), any(Locale.class)))
            .thenThrow(new RuntimeException("Message source error"));

        // Act & Assert
        assertDoesNotThrow(() -> {
            String result = i18nService.getMessage(key, request);
            assertEquals(key, result); // Should fallback to key
        });
    }
}
