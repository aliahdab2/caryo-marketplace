package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.config.CarQueryConfiguration;
import com.autotrader.autotraderbackend.dto.CarQueryMakeResponse;
import com.autotrader.autotraderbackend.dto.CarQueryModelResponse;
import com.autotrader.autotraderbackend.exception.CarQueryConnectionException;
import com.autotrader.autotraderbackend.exception.CarQueryException;
import com.autotrader.autotraderbackend.exception.CarQueryValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import jakarta.annotation.PostConstruct;

/**
 * CarQuery API client for fetching comprehensive car data
 * Provides access to makes, models, and other automotive data
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "carquery.api.enabled", havingValue = "true", matchIfMissing = true)
public class CarQueryApiClient {

    @Qualifier("carQueryRestTemplate")
    private final RestTemplate carQueryRestTemplate;

    private final RestTemplate restTemplate;
    private final CarQueryConfiguration config;
    private final CarQueryDataValidationService validationService;

    /**
     * Validate configuration at startup
     */
    @PostConstruct
    public void validateConfiguration() {
        log.info("Initializing CarQuery API client...");
        
        if (config.getBaseUrl() == null || config.getBaseUrl().trim().isEmpty()) {
            throw new IllegalStateException("CarQuery API base URL is not configured. Please set 'carquery.api.base-url' property.");
        }
        
        if (config.getTimeout() <= 0) {
            throw new IllegalStateException("CarQuery API timeout must be positive. Current value: " + config.getTimeout());
        }
        
        log.info("CarQuery API client configured successfully:");
        log.info("  - Base URL: {}", config.getBaseUrl());
        log.info("  - Timeout: {}s", config.getTimeout());
        log.info("  - Max Retry Attempts: {}", config.getRetry().getMaxAttempts());
        log.info("  - Retry Delay: {}ms", config.getRetry().getDelayMs());
        
        // Test connectivity if enabled
        if (true) { // CarQuery is enabled if this bean is created
            try {
                boolean connected = testConnection();
                if (connected) {
                    log.info("✅ CarQuery API connectivity test: SUCCESS");
                } else {
                    log.warn("⚠️ CarQuery API connectivity test: FAILED - API may be unavailable");
                }
            } catch (Exception e) {
                log.warn("⚠️ CarQuery API connectivity test failed: {} - Will use fallback data sources", e.getMessage());
            }
        } else {
            log.info("CarQuery API is disabled via configuration");
        }
    }

    /**
     * Get all car makes from CarQuery API
     */
    @Cacheable(value = "carqueryMakes", unless = "#result == null")
    @Retryable(
        retryFor = {RestClientException.class},
        maxAttemptsExpression = "#{@carQueryConfiguration.retry.maxAttempts}",
        backoff = @Backoff(delayExpression = "#{@carQueryConfiguration.retry.delayMs}")
    )
    public CarQueryMakeResponse getAllMakes() {
        log.info("Fetching all car makes from CarQuery API");

        try {
            String url = buildUrl("?cmd=getMakes");
            ResponseEntity<CarQueryMakeResponse> response = carQueryRestTemplate.getForEntity(url, CarQueryMakeResponse.class);

            if (response.getBody() != null && response.getBody().getMakes() != null) {
                log.info("Successfully fetched {} makes from CarQuery API", response.getBody().getMakes().size());

                // Validate response data
                CarQueryDataValidationService.ValidationResult validation = validationService.validateMakeResponse(response.getBody());
                if (!validation.isValid()) {
                    throw new CarQueryValidationException("getAllMakes",
                        validation.getIssues(), validation.getWarnings());
                }

                if (!validation.getWarnings().isEmpty()) {
                    log.warn("CarQuery API response validation warnings: {}", String.join(", ", validation.getWarnings()));
                }

                return response.getBody();
            } else {
                log.warn("CarQuery API returned empty or invalid response for makes");
                return null;
            }

        } catch (RestClientException e) {
            String errorContext = String.format("CarQuery API call failed - URL: %s, Timeout: %ds, Operation: getAllMakes", 
                config.getBaseUrl(), config.getTimeout());
            log.error("{}, Error: {}", errorContext, e.getMessage(), e);
            throw new CarQueryConnectionException("getAllMakes", config.getTimeout(), e);
        }
    }

    /**
     * Get models for a specific make
     */
    @Cacheable(value = "carqueryModels", key = "#makeId", unless = "#result == null")
    @Retryable(
        retryFor = {RestClientException.class},
        maxAttemptsExpression = "#{@carQueryConfiguration.retry.maxAttempts}",
        backoff = @Backoff(delayExpression = "#{@carQueryConfiguration.retry.delayMs}")
    )
    public CarQueryModelResponse getModelsByMake(String makeId) {
        log.info("Fetching models for make {} from CarQuery API", makeId);

        try {
            String url = buildUrl("?cmd=getModels&make=" + makeId);
            ResponseEntity<CarQueryModelResponse> response = carQueryRestTemplate.getForEntity(url, CarQueryModelResponse.class);

            if (response.getBody() != null && response.getBody().getModels() != null) {
                log.info("Successfully fetched {} models for make {} from CarQuery API",
                    response.getBody().getModels().size(), makeId);

                // Validate response data
                CarQueryDataValidationService.ValidationResult validation = validationService.validateModelResponse(response.getBody());
                if (!validation.isValid()) {
                    throw new CarQueryValidationException("getModelsByMake:" + makeId,
                        validation.getIssues(), validation.getWarnings());
                }

                if (!validation.getWarnings().isEmpty()) {
                    log.warn("CarQuery API model response validation warnings for make {}: {}", makeId, String.join(", ", validation.getWarnings()));
                }

                return response.getBody();
            } else {
                log.warn("CarQuery API returned empty or invalid response for models of make {}", makeId);
                return null;
            }

        } catch (RestClientException e) {
            String url = buildUrl("?cmd=getModels&make=" + makeId);
            String errorContext = String.format("CarQuery API call failed - URL: %s, Timeout: %ds, Operation: getModelsByMake, MakeId: %s", 
                url, config.getTimeout(), makeId);
            log.error("{}, Error: {}", errorContext, e.getMessage(), e);
            throw new CarQueryConnectionException("getModelsByMake:" + makeId, url, config.getTimeout(), e);
        }
    }

    /**
     * Build complete API URL with parameters
     */
    private String buildUrl(String queryString) {
        StringBuilder url = new StringBuilder(config.getBaseUrl());

        // Add query string
        if (!queryString.startsWith("?")) {
            url.append("?");
        }
        url.append(queryString);

        // Add API key if available
        if (config.getKey() != null && !config.getKey().trim().isEmpty()) {
            if (queryString.contains("?")) {
                url.append("&");
            } else {
                url.append("?");
            }
            url.append("key=").append(config.getKey());
        }

        return url.toString();
    }

    /**
     * Test API connectivity
     */
    public boolean testConnection() {
        try {
            log.info("Testing CarQuery API connection...");
            CarQueryMakeResponse response = getAllMakes();
            boolean success = response != null && response.getMakes() != null && !response.getMakes().isEmpty();
            log.info("CarQuery API connection test: {}", success ? "SUCCESS" : "FAILED");
            return success;
        } catch (Exception e) {
            log.error("CarQuery API connection test failed: {}", e.getMessage());
            return false;
        }
    }
}
