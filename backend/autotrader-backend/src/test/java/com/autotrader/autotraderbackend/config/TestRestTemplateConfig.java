package com.autotrader.autotraderbackend.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;

import java.time.Duration;

/**
 * Configuration for TestRestTemplate to handle HTTP authentication properly in tests
 */
@TestConfiguration
public class TestRestTemplateConfig {

    @Bean
    public TestRestTemplate customTestRestTemplate() {
        // Use a more modern approach without deprecated methods
        // Configure timeouts directly through the builder
        RestTemplateBuilder builder = new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(5));
        
        // Create and return the TestRestTemplate instance
        return new TestRestTemplate(builder);
    }
}
