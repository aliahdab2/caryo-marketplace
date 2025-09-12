package com.autotrader.autotraderbackend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for CarQuery API integration
 */
@Configuration
@ConfigurationProperties(prefix = "carquery.api")
@ConditionalOnProperty(name = "carquery.api.enabled", havingValue = "true", matchIfMissing = true)
@Getter
@Setter
public class CarQueryConfiguration {

    /**
     * Base URL for CarQuery API
     */
    private String baseUrl = "https://www.carqueryapi.com/api/0.3/";

    /**
     * API key for CarQuery (optional - some endpoints work without key)
     */
    private String key = "";

    /**
     * Timeout for API calls in milliseconds
     */
    private int timeout = 30000;

    /**
     * Retry configuration
     */
    private RetryConfig retry = new RetryConfig();

    /**
     * Cache configuration
     */
    private CacheConfig cache = new CacheConfig();

    @Getter
    @Setter
    public static class RetryConfig {
        private int maxAttempts = 3;
        private int delayMs = 1000;
        private boolean exponentialBackoff = true;
    }

    @Getter
    @Setter
    public static class CacheConfig {
        private boolean enabled = true;
        private int ttlMinutes = 60;
    }
}
