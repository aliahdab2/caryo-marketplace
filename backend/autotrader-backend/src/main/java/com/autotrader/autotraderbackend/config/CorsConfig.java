package com.autotrader.autotraderbackend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Parse allowed origins from environment variable (comma-separated)
        // Example: http://localhost:3000,http://localhost:3001,https://caryo.sy
        List<String> origins = Arrays.asList(allowedOrigins.split(","));

        log.info("CORS Configuration - Allowed origins: {}", origins);

        // SECURITY: Only allow specific origins from configuration
        // NEVER use allowedOriginPattern("*") in production
        for (String origin : origins) {
            String trimmedOrigin = origin.trim();
            if (!trimmedOrigin.isEmpty()) {
                config.addAllowedOrigin(trimmedOrigin);
            }
        }

        // Allow credentials (cookies, authorization headers, etc.)
        config.setAllowCredentials(true);

        // Allow common HTTP methods
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("PATCH");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");

        // Allow common headers
        config.addAllowedHeader("Origin");
        config.addAllowedHeader("Content-Type");
        config.addAllowedHeader("Accept");
        config.addAllowedHeader("Authorization");
        config.addAllowedHeader("X-Requested-With");
        config.addAllowedHeader("Accept-Language");

        // Expose headers that the client might need
        config.addExposedHeader("Authorization");

        // Set max age for preflight requests (1 hour)
        config.setMaxAge(3600L);

        // Apply this configuration to all paths
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
