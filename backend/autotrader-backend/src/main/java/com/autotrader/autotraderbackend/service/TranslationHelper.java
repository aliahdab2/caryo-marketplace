package com.autotrader.autotraderbackend.service;

import java.util.Map;
import java.util.HashMap;

/**
 * Helper class for translations in Thymeleaf templates.
 * Provides easy access to localized messages from email templates.
 */
public class TranslationHelper {

    private final MessageService messageService;
    private final String language;

    public TranslationHelper(MessageService messageService, String language) {
        this.messageService = messageService;
        this.language = language;
    }

    /**
     * Get a localized message by key.
     * Usage in template: ${t.get('email.welcome.title')}
     */
    public String get(String key) {
        return messageService.getLocalizedMessage(key, language);
    }

    /**
     * Get a localized message with parameters.
     * Usage in template: ${t.get('email.welcome.subject', websiteName)}
     */
    public String get(String key, Object... args) {
        return messageService.getLocalizedMessage(key, language, args);
    }

    /**
     * Get a localized message with named parameters.
     * Usage in template: ${t.getWithParams('email.footer.copyright', {'year': currentYear, 'websiteName': websiteName})}
     */
    public String getWithParams(String key, Map<String, Object> params) {
        return messageService.getLocalizedMessage(key, language, params);
    }

    /**
     * Convenience method for common website name parameter.
     * Usage in template: ${t.withWebsite('email.welcome.subject')}
     */
    public String withWebsite(String key, String websiteName) {
        Map<String, Object> params = new HashMap<>();
        params.put("websiteName", websiteName);
        return getWithParams(key, params);
    }

    /**
     * Convenience method for copyright with year and website name.
     * Usage in template: ${t.copyright(currentYear, websiteName)}
     */
    public String copyright(int year, String websiteName) {
        Map<String, Object> params = new HashMap<>();
        params.put("year", String.valueOf(year));
        params.put("websiteName", websiteName);
        return getWithParams("email.footer.copyright", params);
    }
}
