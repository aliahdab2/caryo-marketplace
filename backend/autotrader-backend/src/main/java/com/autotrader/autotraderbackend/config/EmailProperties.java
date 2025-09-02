package com.autotrader.autotraderbackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

import java.util.List;
import java.util.Arrays;

/**
 * Configuration properties for email service.
 * Centralizes all email-related configuration.
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.email")
public class EmailProperties {
    
    /**
     * From email address for outgoing emails.
     */
    private String from = "noreply@caryo.sy";
    
    /**
     * Support email address.
     */
    private String support = "support@caryo.sy";
    
    /**
     * Default language for emails.
     */
    private String defaultLanguage = "en";
    
    /**
     * Supported languages for emails.
     */
    private List<String> supportedLanguages = Arrays.asList("en", "ar");
    
    /**
     * Website configuration.
     */
    private Website website = new Website();
    
    /**
     * Email template configuration.
     */
    private Template template = new Template();
    
    @Data
    public static class Website {
        private String name = "Caryo Marketplace";
        private String nameAr = "كاريو";
        private String url = "http://localhost:3000";
        private String supportEmail = "support@caryo.sy";
    }
    
    @Data
    public static class Template {
        private String prefix = "classpath:/templates/emails/";
        private String suffix = ".html";
        private String encoding = "UTF-8";
        private boolean cache = false;
    }
}