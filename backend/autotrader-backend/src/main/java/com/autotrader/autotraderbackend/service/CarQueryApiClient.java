package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.config.CarQueryConfiguration;
import com.autotrader.autotraderbackend.dto.CarQueryMakeResponse;
import com.autotrader.autotraderbackend.dto.CarQueryModelResponse;
import com.autotrader.autotraderbackend.exception.CarQueryConnectionException;
import com.autotrader.autotraderbackend.exception.CarQueryValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
// import org.springframework.cache.annotation.Cacheable; // Temporarily disabled
import org.springframework.http.ResponseEntity;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
    // @Cacheable(value = "carqueryMakes", unless = "#result == null") // Temporarily disabled
    @Retryable(
        retryFor = {RestClientException.class},
        maxAttemptsExpression = "#{@carQueryConfiguration.retry.maxAttempts}",
        backoff = @Backoff(delayExpression = "#{@carQueryConfiguration.retry.delayMs}")
    )
    public CarQueryMakeResponse getAllMakes() {
        log.info("Fetching all car makes from CarQuery API");

        try {
            applyPacingDelay();
            // CarQuery API requires a year parameter to return data
            String url = buildUrl("?cmd=getMakes&year=2020");
            ResponseEntity<CarQueryMakeResponse> response = carQueryRestTemplate.getForEntity(url, CarQueryMakeResponse.class);

            if (response.getBody() != null && response.getBody().getMakes() != null) {
                log.info("Successfully fetched {} makes from CarQuery API", response.getBody().getMakes().size());

                // Filter out brands that were established before 1990
                List<CarQueryMakeResponse.CarQueryMake> filteredMakes = filterModernBrands(response.getBody().getMakes());
                log.info("After filtering for post-1990 brands: {} makes remaining", filteredMakes.size());

                // Create a new response with filtered makes
                CarQueryMakeResponse filteredResponse = new CarQueryMakeResponse();
                filteredResponse.setMakes(filteredMakes);

                // Validate response data
                CarQueryDataValidationService.ValidationResult validation = validationService.validateMakeResponse(filteredResponse);
                if (!validation.isValid()) {
                    throw new CarQueryValidationException("getAllMakes",
                        validation.getIssues(), validation.getWarnings());
                }

                if (!validation.getWarnings().isEmpty()) {
                    log.warn("CarQuery API response validation warnings: {}", String.join(", ", validation.getWarnings()));
                }

                return filteredResponse;
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

    private void applyPacingDelay() {
        try {
            int base = config.getRateLimit().getPerRequestDelayMs();
            int jitter = config.getRateLimit().getJitterMs();
            if (base > 0) {
                long delay = base + (jitter > 0 ? (long)(Math.random() * jitter) : 0L);
                Thread.sleep(delay);
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Filter out car brands that were established before 1990
     * This keeps the marketplace focused on modern vehicles
     * Note: Only filters brands that are NOT already in our database
     */
    private List<CarQueryMakeResponse.CarQueryMake> filterModernBrands(List<CarQueryMakeResponse.CarQueryMake> makes) {
        if (makes == null || makes.isEmpty()) {
            return makes;
        }

        // List of brands that were established before 1990 and should be filtered out
        // These are typically luxury/niche brands that may not be relevant for mainstream marketplace
        Set<String> pre1990Brands = Set.of(
            "rolls-royce", // 1904 - Ultra luxury, very niche
            "bentley",     // 1919 - Ultra luxury, very niche
            "jaguar",      // 1922 - Luxury brand, but established pre-1990
            "aston-martin", // 1913 - Luxury/sports, very niche
            "lamborghini", // 1963 - Supercar brand, established pre-1990
            "ferrari",     // 1947 - Supercar brand, established pre-1990
            "maserati",    // 1914 - Luxury brand, established pre-1990
            "lotus",       // 1948 - Sports car brand, established pre-1990
            "mclaren",     // 1963 - Supercar brand, established pre-1990
            "porsche"      // 1931 - Sports car brand, established pre-1990
        );

        List<CarQueryMakeResponse.CarQueryMake> filteredMakes = makes.stream()
            .filter(make -> {
                String makeId = make.getMakeId().toLowerCase();
                boolean isModern = !pre1990Brands.contains(makeId);
                if (!isModern) {
                    log.debug("Filtering out pre-1990 brand: {} (niche/luxury brand)", make.getMakeDisplay());
                }
                return isModern;
            })
            .collect(Collectors.toList());

        log.info("Applied 1990+ filtering: {} brands → {} modern brands (filtered {} niche/pre-1990 brands)",
                makes.size(), filteredMakes.size(), makes.size() - filteredMakes.size());

        return filteredMakes;
    }

    /**
     * Get models for a specific make
     */
    // @Cacheable(value = "carqueryModels", key = "#makeId", unless = "#result == null") // Temporarily disabled
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
     * Test API connectivity with a lightweight request
     */
    public boolean testConnection() {
        try {
            log.info("Testing CarQuery API connection...");

            // Use a lightweight test - CarQuery API requires year parameter to return data
            String testUrl = config.getBaseUrl() + "?cmd=getMakes&year=2020"; // Year parameter is required
            log.debug("Testing connectivity with URL: {}", testUrl);

            // Use CarQuery-specific RestTemplate with proper headers and SSL configuration
            ResponseEntity<String> response = carQueryRestTemplate.getForEntity(testUrl, String.class);

            log.debug("Response status: {}", response.getStatusCode());
            log.debug("Response body length: {}", response.getBody() != null ? response.getBody().length() : 0);

            boolean success = response.getStatusCode().is2xxSuccessful() &&
                             response.getBody() != null &&
                             response.getBody().contains("Makes") &&
                             !response.getBody().contains("\"Makes\":[]"); // Check for non-empty data

            log.info("CarQuery API connection test: {}", success ? "SUCCESS" : "FAILED");
            if (success) {
                log.info("✅ CarQuery API is accessible and responding with data");
            } else {
                log.warn("⚠️ CarQuery API responded but returned empty data. Status: {}, Body: {}",
                         response.getStatusCode(), response.getBody());
            }
            return success;
        } catch (Exception e) {
            log.error("CarQuery API connection test failed: {} - Will use fallback data sources", e.getMessage());
            log.debug("Full exception details:", e);
            return false;
        }
    }
}
