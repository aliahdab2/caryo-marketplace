package com.autotrader.autotraderbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

/**
 * Configuration for email template processing with proper UTF-8 support.
 * Ensures Arabic text is properly encoded in email templates.
 */
@Configuration
@Profile("!test") // Apply to all profiles except test (test has its own config)
public class EmailTemplateConfig {

    /**
     * Template engine specifically configured for email templates with UTF-8 support.
     */
    @Bean(name = "emailTemplateEngine")
    @Primary
    public TemplateEngine emailTemplateEngine() {
        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        
        ClassLoaderTemplateResolver templateResolver = new ClassLoaderTemplateResolver();
        templateResolver.setPrefix("templates/emails/");
        templateResolver.setSuffix(".html");
        templateResolver.setTemplateMode(TemplateMode.HTML);
        templateResolver.setCharacterEncoding("UTF-8");
        templateResolver.setCacheable(false); // Disable caching for development
        templateResolver.setOrder(1);
        templateResolver.setCheckExistence(true);
        
        // Ensure UTF-8 encoding is forced
        templateResolver.setForceTemplateMode(true);
        
        templateEngine.setTemplateResolver(templateResolver);
        
        return templateEngine;
    }
}
