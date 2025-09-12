package com.autotrader.autotraderbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

/**
 * Orchestrator service for managing car data loading operations
 * Delegates to specialized services based on data source (CarQuery vs Syrian data)
 * Provides unified interface for data loading operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarDataLoaderService {

    private final CarQueryDataService carQueryDataService;
    private final CaryoDataService caryoDataService;
    private final CarBrandService carBrandService;
    private final CarModelService carModelService;
    private final CarDataProviderRegistry providerRegistry; // New centralized registry

    /**
     * Load complete car dataset from CarQuery API
     * Delegates to CarQueryDataService for specialized handling
     */
    public CarQueryDataService.DataLoadResult loadCompleteCarDataset() {
        log.info("Delegating CarQuery data loading to CarQueryDataService...");
        return carQueryDataService.loadCompleteCarDataset();
    }


    /**
     * Get data loading statistics across all data sources
     */
    public DataLoadStatistics getStatistics() {
        DataLoadStatistics stats = new DataLoadStatistics();

        try {
            stats.setTotalBrands(carBrandService.getAllBrands().size());
            stats.setActiveBrands(carBrandService.getActiveBrands().size());
            stats.setTotalModels(carModelService.getAllModels().size());

            // Count models by brand
            Map<String, Integer> modelsByBrand = new HashMap<>();
            for (var brand : carBrandService.getAllBrands()) {
                try {
                    List<?> models = carModelService.getModelsByBrandId(brand.getId());
                    modelsByBrand.put(brand.getName(), models.size());
                } catch (Exception e) {
                    modelsByBrand.put(brand.getName(), 0);
                }
            }
            stats.setModelsByBrand(modelsByBrand);

        } catch (Exception e) {
            log.error("Error getting statistics: {}", e.getMessage());
        }

        return stats;
    }

    /**
     * Validate data integrity across all data sources
     */
    public DataValidationResult validateDataIntegrity() {
        DataValidationResult result = new DataValidationResult();
        List<String> issues = new ArrayList<>();

        try {
            // Check for brands without Arabic names
            for (var brand : carBrandService.getAllBrands()) {
                if (brand.getDisplayNameAr() == null || brand.getDisplayNameAr().trim().isEmpty()) {
                    issues.add("Brand '" + brand.getName() + "' missing Arabic name");
                }
            }

            // Check for models without brands
            for (var model : carModelService.getAllModels()) {
                if (model.getBrand() == null) {
                    issues.add("Model '" + model.getName() + "' has no associated brand");
                }
            }

            // Check for duplicate slugs
            Set<String> brandSlugs = new HashSet<>();
            for (var brand : carBrandService.getAllBrands()) {
                if (!brandSlugs.add(brand.getSlug())) {
                    issues.add("Duplicate brand slug: " + brand.getSlug());
                }
            }

        } catch (Exception e) {
            issues.add("Error during validation: " + e.getMessage());
        }

        result.setIssues(issues);
        result.setValid(issues.isEmpty());
        return result;
    }

    /**
     * Get statistics from all enabled providers
     */
    public CarDataProviderRegistry.AggregatedProviderStatistics getAllProviderStatistics() {
        return providerRegistry.getAggregatedStatistics();
    }

    /**
     * Load data with automatic fallback using registry
     */
    public CompletableFuture<CarDataProvider.DataLoadResult> loadFromAllProviders() {
        log.info("Loading data from all providers with automatic fallback");
        return providerRegistry.loadDataWithFallback();
    }

    /**
     * Load data from a specific provider
     */
    public CompletableFuture<CarDataProvider.DataLoadResult> loadFromProvider(String providerName) {
        log.info("Loading data from specific provider: {}", providerName);
        return providerRegistry.loadDataFromProvider(providerName);
    }

    /**
     * Get health status of all providers
     */
    public Map<String, CarDataProviderRegistry.ProviderHealthStatus> getProvidersHealthStatus() {
        return providerRegistry.getProvidersHealthStatus();
    }

    // All implementation details have been moved to specialized services:
    // - CarQueryDataService for CarQuery API operations
    // - CaryoDataService for Caryo API operations (future provider)
    // This service now acts as a clean orchestrator/facade

    // Data classes for cross-cutting concerns that are specific to this orchestrator
    public static class DataLoadStatistics {
        private int totalBrands;
        private int activeBrands;
        private int totalModels;
        private Map<String, Integer> modelsByBrand = new HashMap<>();

        public int getTotalBrands() { return totalBrands; }
        public void setTotalBrands(int totalBrands) { this.totalBrands = totalBrands; }
        public int getActiveBrands() { return activeBrands; }
        public void setActiveBrands(int activeBrands) { this.activeBrands = activeBrands; }
        public int getTotalModels() { return totalModels; }
        public void setTotalModels(int totalModels) { this.totalModels = totalModels; }
        public Map<String, Integer> getModelsByBrand() { return modelsByBrand; }
        public void setModelsByBrand(Map<String, Integer> modelsByBrand) { this.modelsByBrand = modelsByBrand; }
    }

    public static class DataValidationResult {
        private boolean valid;
        private List<String> issues = new ArrayList<>();

        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        public List<String> getIssues() { return issues; }
        public void setIssues(List<String> issues) { this.issues = issues; }
    }
}
