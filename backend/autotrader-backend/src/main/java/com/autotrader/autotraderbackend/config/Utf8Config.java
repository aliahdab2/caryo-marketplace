package com.autotrader.autotraderbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.filter.CharacterEncodingFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.core.Ordered;

import java.nio.charset.StandardCharsets;

/**
 * Configuration class to ensure proper UTF-8 encoding throughout the application.
 * This is especially important for Arabic text and international characters.
 */
@Configuration
public class Utf8Config {

    /**
     * Configure character encoding filter to force UTF-8 for all requests and responses.
     * This ensures proper handling of Arabic text in web requests.
     */
    @Bean
    public FilterRegistrationBean<CharacterEncodingFilter> characterEncodingFilter() {
        CharacterEncodingFilter filter = new CharacterEncodingFilter();
        filter.setEncoding(StandardCharsets.UTF_8.name());
        filter.setForceEncoding(true);
        filter.setForceRequestEncoding(true);
        filter.setForceResponseEncoding(true);
        
        FilterRegistrationBean<CharacterEncodingFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(filter);
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        registrationBean.setName("CharacterEncodingFilter");
        
        return registrationBean;
    }

    /**
     * Configure MessageSource for proper UTF-8 handling of translation files.
     * This ensures Arabic translations are properly loaded and displayed.
     */
    @Bean
    public ReloadableResourceBundleMessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        messageSource.setDefaultLocale(java.util.Locale.ENGLISH);
        messageSource.setFallbackToSystemLocale(false);
        messageSource.setUseCodeAsDefaultMessage(true);
        messageSource.setCacheSeconds(3600); // Cache for 1 hour in production
        
        return messageSource;
    }
}
