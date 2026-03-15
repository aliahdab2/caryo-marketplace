package com.caryo.marketplace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

/**
 * Configuration class to enable Spring Retry functionality.
 * This enables @Retryable and @Recover annotations throughout the application.
 */
@Configuration
@EnableRetry
public class RetryConfig {
    // Spring Retry configuration is enabled via @EnableRetry annotation
    // Additional retry configuration can be added here if needed
}