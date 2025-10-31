package com.autotrader.autotraderbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

/**
 * Configuration for email template management.
 * Provides custom template resolvers and follows Spring Boot best practices.
 */
@Configuration
public class EmailTemplateConfig {



    /**
     * Primary template resolver for email templates.
     * Resolves templates from the organized directory structure.
     */
    @Bean
    @Primary
    public SpringResourceTemplateResolver emailTemplateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setPrefix("classpath:templates/emails/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false); // Disable cache for development
        resolver.setOrder(1);
        return resolver;
    }

    /**
     * Fallback template resolver for backward compatibility.
     */
    @Bean
    public SpringResourceTemplateResolver fallbackTemplateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setPrefix("classpath:templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);
        resolver.setOrder(2);
        return resolver;
    }

    /**
     * Configure template engine with multiple resolvers.
     */
    @Bean
    public SpringTemplateEngine templateEngine() {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.addTemplateResolver(emailTemplateResolver());
        engine.addTemplateResolver(fallbackTemplateResolver());
        engine.setEnableSpringELCompiler(true);
        return engine;
    }
}
