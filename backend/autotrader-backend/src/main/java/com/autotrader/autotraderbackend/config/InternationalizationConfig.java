package com.autotrader.autotraderbackend.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;

import java.util.Arrays;
import java.util.Locale;

/**
 * Configuration for internationalization (i18n) support.
 * Follows the translation guide best practices for Spring Boot.
 */
@Configuration
public class InternationalizationConfig implements WebMvcConfigurer {

    /**
     * Configure MessageSource to load messages from properties files.
     * Following the translation guide: use resource bundle .properties files for static content/messages.
     */
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasenames("messages/messages"); // Points to messages/messages_en.properties, messages/messages_ar.properties
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setUseCodeAsDefaultMessage(true); // Return key if message not found
        messageSource.setCacheSeconds(3600); // Cache for 1 hour in production
        return messageSource;
    }

    /**
     * Configure LocaleResolver to determine user's locale from Accept-Language header.
     * Following the translation guide: localized content based on Accept-Language header.
     */
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver localeResolver = new AcceptHeaderLocaleResolver();
        localeResolver.setSupportedLocales(Arrays.asList(
            Locale.ENGLISH,
            Locale.forLanguageTag("ar") // Arabic
        ));
        localeResolver.setDefaultLocale(Locale.ENGLISH);
        return localeResolver;
    }

    /**
     * Configure LocaleChangeInterceptor to allow changing locale via request parameter.
     * Optional: allows changing locale via ?lang=ar parameter.
     */
    @Bean
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
        interceptor.setParamName("lang");
        return interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeChangeInterceptor());
    }
}
