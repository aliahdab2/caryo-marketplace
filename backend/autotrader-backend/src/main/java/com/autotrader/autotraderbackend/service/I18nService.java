package com.autotrader.autotraderbackend.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * Centralized service for internationalization (i18n) functionality.
 * Provides locale detection and message retrieval for controllers.
 *
 * This service eliminates code duplication by centralizing i18n logic
 * that was previously scattered across multiple controllers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class I18nService {

    private final MessageSource messageSource;

    /**
     * Get user's preferred locale from Accept-Language header.
     * Supports both HttpServletRequest and raw header string.
     *
     * @param request the HTTP servlet request
     * @return Locale based on Accept-Language header, defaults to English
     */
    public Locale getUserLocale(HttpServletRequest request) {
        return getUserLocale(request.getHeader("Accept-Language"));
    }

    /**
     * Get user's preferred locale from Accept-Language header string.
     *
     * @param acceptLanguage the Accept-Language header value
     * @return Locale based on Accept-Language header, defaults to English
     */
    public Locale getUserLocale(String acceptLanguage) {
        if (acceptLanguage != null) {
            String language = acceptLanguage.toLowerCase();
            if (language.startsWith("ar")) {
                return Locale.forLanguageTag("ar");
            }
        }
        return Locale.ENGLISH; // Default to English
    }

    /**
     * Get localized message using MessageSource.
     *
     * @param key the message key
     * @param locale the locale
     * @param args optional message parameters
     * @return localized message string
     */
    public String getMessage(String key, Locale locale, Object... args) {
        try {
            return messageSource.getMessage(key, args, key, locale);
        } catch (NoSuchMessageException e) {
            log.debug("i18n: Message key '{}' not found for locale '{}', using key as fallback", key, locale);
            return key;
        } catch (Exception e) {
            log.error("i18n: Unexpected error loading message key='{}', locale='{}', error='{}'", key, locale, e.getMessage());
            return key;
        }
    }

    /**
     * Get localized message with automatic locale detection from HttpServletRequest.
     *
     * @param key the message key
     * @param request the HTTP servlet request (for locale detection)
     * @param args optional message parameters
     * @return localized message string
     */
    public String getMessage(String key, HttpServletRequest request, Object... args) {
        Locale locale = getUserLocale(request);
        return getMessage(key, locale, args);
    }

    /**
     * Get localized message with Accept-Language header string.
     *
     * @param key the message key
     * @param acceptLanguage the Accept-Language header value
     * @param args optional message parameters
     * @return localized message string
     */
    public String getMessage(String key, String acceptLanguage, Object... args) {
        Locale locale = getUserLocale(acceptLanguage);
        return getMessage(key, locale, args);
    }

}
