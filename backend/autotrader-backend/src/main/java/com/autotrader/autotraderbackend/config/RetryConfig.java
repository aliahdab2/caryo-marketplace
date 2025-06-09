package com.autotrader.autotraderbackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

@Configuration
@EnableRetry
public class RetryConfig {
    // Configuration is handled by @Retryable annotations
}
