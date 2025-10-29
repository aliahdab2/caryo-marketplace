package com.autotrader.autotraderbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Centralized registry for all car data providers.
 * Provides dynamic provider discovery, health monitoring, and fallback orchestration.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CarDataProviderRegistry {

    private final List<CarDataProvider> providers;

    /**
     * Get all enabled providers sorted by priority (lower number = higher priority)
     */
    public List<CarDataProvider> getEnabledProviders() {
        return providers.stream()
                .filter(CarDataProvider::isEnabled)
                .sorted(Comparator.comparing(CarDataProvider::getPriority))
                .collect(Collectors.toList());
    }

    /**
     * Get a specific provider by name
     */
    public Optional<CarDataProvider> getProvider(String name) {
        return providers.stream()
                .filter(provider -> provider.getProviderName().equalsIgnoreCase(name))
                .findFirst();
    }

    /**
     * Get all providers (enabled and disabled)
     */
    public List<CarDataProvider> getAllProviders() {
        return new ArrayList<>(providers);
    }

    /**
     * Get health status of all providers
     */
    public Map<String, ProviderHealthStatus> getProvidersHealthStatus() {
        Map<String, ProviderHealthStatus> healthMap = new HashMap<>();

        for (CarDataProvider provider : providers) {
            try {
                ProviderHealthStatus health = new ProviderHealthStatus();
                health.setProviderName(provider.getProviderName());
                health.setEnabled(provider.isEnabled());
                health.setHealthy(provider.testConnection());
                health.setLastChecked(System.currentTimeMillis());

                if (provider.isEnabled()) {
                    CarDataProvider.ProviderStatistics stats = provider.getStatistics();
                    health.setStatistics(stats);
                }

                healthMap.put(provider.getProviderName(), health);
            } catch (Exception e) {
                log.warn("Error checking health for provider {}: {}", provider.getProviderName(), e.getMessage());

                ProviderHealthStatus health = new ProviderHealthStatus();
                health.setProviderName(provider.getProviderName());
                health.setEnabled(provider.isEnabled());
                health.setHealthy(false);
                health.setLastChecked(System.currentTimeMillis());
                health.setErrorMessage(e.getMessage());

                healthMap.put(provider.getProviderName(), health);
            }
        }

        return healthMap;
    }

    /**
     * Load data with automatic fallback across providers
     */
    public CompletableFuture<CarDataProvider.DataLoadResult> loadDataWithFallback() {
        List<CarDataProvider> enabledProviders = getEnabledProviders();

        if (enabledProviders.isEmpty()) {
            log.warn("No enabled providers available for data loading");
            CarDataProvider.DataLoadResult result = new CarDataProvider.DataLoadResult();
            result.setSuccess(false);
            result.setErrorMessage("No enabled providers available");
            return CompletableFuture.completedFuture(result);
        }

        return loadFromProvidersSequentially(enabledProviders, 0);
    }

    /**
     * Load data from a specific provider
     */
    public CompletableFuture<CarDataProvider.DataLoadResult> loadDataFromProvider(String providerName) {
        Optional<CarDataProvider> provider = getProvider(providerName);

        if (provider.isEmpty()) {
            log.warn("Provider {} not found", providerName);
            CarDataProvider.DataLoadResult result = new CarDataProvider.DataLoadResult();
            result.setSuccess(false);
            result.setErrorMessage("Provider not found: " + providerName);
            return CompletableFuture.completedFuture(result);
        }

        if (!provider.get().isEnabled()) {
            log.warn("Provider {} is disabled", providerName);
            CarDataProvider.DataLoadResult result = new CarDataProvider.DataLoadResult();
            result.setSuccess(false);
            result.setErrorMessage("Provider is disabled: " + providerName);
            return CompletableFuture.completedFuture(result);
        }

        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("Loading data from provider: {}", providerName);
                return provider.get().loadCompleteDataset();
            } catch (Exception e) {
                log.error("Error loading data from provider {}: {}", providerName, e.getMessage(), e);
                CarDataProvider.DataLoadResult result = new CarDataProvider.DataLoadResult();
                result.setSuccess(false);
                result.setErrorMessage("Error loading from " + providerName + ": " + e.getMessage());
                return result;
            }
        });
    }

    /**
     * Recursively try providers in priority order until one succeeds
     */
    private CompletableFuture<CarDataProvider.DataLoadResult> loadFromProvidersSequentially(
            List<CarDataProvider> providers, int currentIndex) {

        if (currentIndex >= providers.size()) {
            log.error("All providers failed to load data");
            CarDataProvider.DataLoadResult result = new CarDataProvider.DataLoadResult();
            result.setSuccess(false);
            result.setErrorMessage("All providers failed to load data");
            return CompletableFuture.completedFuture(result);
        }

        CarDataProvider currentProvider = providers.get(currentIndex);

        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("Attempting to load data from provider: {} (priority: {})",
                    currentProvider.getProviderName(), currentProvider.getPriority());

                if (!currentProvider.testConnection()) {
                    throw new RuntimeException("Provider connection test failed");
                }

                return currentProvider.loadCompleteDataset();
            } catch (Exception e) {
                log.warn("Provider {} failed: {}", currentProvider.getProviderName(), e.getMessage());
                throw e;
            }
        }).handle((result, throwable) -> {
            if (throwable != null || (result != null && !result.isSuccess())) {
                log.info("Provider {} failed, trying next provider...", currentProvider.getProviderName());
                return loadFromProvidersSequentially(providers, currentIndex + 1);
            } else {
                log.info("Successfully loaded data from provider: {}", currentProvider.getProviderName());
                return CompletableFuture.completedFuture(result);
            }
        }).thenCompose(future -> future);
    }

    /**
     * Get aggregated statistics from all enabled providers
     */
    public AggregatedProviderStatistics getAggregatedStatistics() {
        AggregatedProviderStatistics aggregated = new AggregatedProviderStatistics();

        for (CarDataProvider provider : getEnabledProviders()) {
            try {
                CarDataProvider.ProviderStatistics stats = provider.getStatistics();
                aggregated.addProviderStats(provider.getProviderName(), stats);
            } catch (Exception e) {
                log.warn("Error getting statistics from provider {}: {}", provider.getProviderName(), e.getMessage());
            }
        }

        return aggregated;
    }

    /**
     * Health status for a single provider
     */
    public static class ProviderHealthStatus {
        private String providerName;
        private boolean enabled;
        private boolean healthy;
        private long lastChecked;
        private String errorMessage;
        private CarDataProvider.ProviderStatistics statistics;

        // Getters and setters
        public String getProviderName() { return providerName; }
        public void setProviderName(String providerName) { this.providerName = providerName; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public boolean isHealthy() { return healthy; }
        public void setHealthy(boolean healthy) { this.healthy = healthy; }
        public long getLastChecked() { return lastChecked; }
        public void setLastChecked(long lastChecked) { this.lastChecked = lastChecked; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public CarDataProvider.ProviderStatistics getStatistics() { return statistics; }
        public void setStatistics(CarDataProvider.ProviderStatistics statistics) { this.statistics = statistics; }
    }

    /**
     * Aggregated statistics from all providers
     */
    public static class AggregatedProviderStatistics {
        private Map<String, CarDataProvider.ProviderStatistics> providerStats = new HashMap<>();
        private long totalBrands = 0;
        private long totalModels = 0;
        private int enabledProviders = 0;
        private int healthyProviders = 0;

        public void addProviderStats(String providerName, CarDataProvider.ProviderStatistics stats) {
            providerStats.put(providerName, stats);
            totalBrands += stats.getTotalBrands();
            totalModels += stats.getTotalModels();
            enabledProviders++;

            if ("HEALTHY".equals(stats.getStatus()) || "ENABLED".equals(stats.getStatus())) {
                healthyProviders++;
            }
        }

        // Getters and setters
        public Map<String, CarDataProvider.ProviderStatistics> getProviderStats() { return providerStats; }
        public long getTotalBrands() { return totalBrands; }
        public long getTotalModels() { return totalModels; }
        public int getEnabledProviders() { return enabledProviders; }
        public int getHealthyProviders() { return healthyProviders; }
        public double getHealthPercentage() {
            return enabledProviders > 0 ? (double) healthyProviders / enabledProviders * 100 : 0;
        }
    }
}
