package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.dto.CarQueryMakeResponse;
import com.autotrader.autotraderbackend.dto.CarQueryModelResponse;
import com.autotrader.autotraderbackend.exception.CarQueryConnectionException;
import com.autotrader.autotraderbackend.exception.CarQueryException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling CarQuery API data operations
 * Separated from CarDataLoaderService for better separation of concerns
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarQueryDataService implements CarDataProvider {

    private final CarBrandService carBrandService;
    private final CarModelService carModelService;
    private final ArabicTranslationService arabicTranslationService;

    @Autowired(required = false)
    private CarQueryApiClient carQueryApiClient;

    @Override
    public String getProviderName() {
        return "CarQuery";
    }

    @Override
    public int getPriority() {
        return 1; // High priority - primary external API
    }

    @Override
    public ProviderCapabilities getCapabilities() {
        ProviderCapabilities capabilities = new ProviderCapabilities();
        capabilities.setSupportsBrands(true);
        capabilities.setSupportsModels(true);
        capabilities.setSupportsTrims(false);
        capabilities.setSupportsImages(false);
        capabilities.setSupportsSpecs(false);
        capabilities.setSupportsIncrementalSync(false);
        capabilities.setSupportsRealTimeUpdates(false);
        return capabilities;
    }

    @Override
    public boolean testConnection() {
        if (carQueryApiClient == null) {
            return false;
        }
        return carQueryApiClient.testConnection();
    }

    @Override
    public boolean isEnabled() {
        return carQueryApiClient != null;
    }

    @Override
    public DataLoadResult loadCompleteDataset() {
        log.info("Loading complete dataset from CarQuery API");
        DataLoadResult result = new DataLoadResult();

        try {
            result.addResult("brands", loadAllBrands());
            result.addResult("models", loadAllModels());

            result.setSuccess(true);
            log.info("Successfully loaded complete dataset from CarQuery API");

        } catch (Exception e) {
            String errorContext = String.format("CarQuery complete dataset load failed - Provider: %s, API Client Available: %s", 
                getProviderName(), carQueryApiClient != null);
            log.error("{}, Error: {}", errorContext, e.getMessage(), e);
            result.setSuccess(false);
            result.setErrorMessage(errorContext + " - " + e.getMessage());
        }

        return result;
    }

    @Override
    public ProviderStatistics getStatistics() {
        ProviderStatistics stats = new ProviderStatistics();
        stats.setProviderName(getProviderName());
        stats.setStatus(isEnabled() ? (testConnection() ? "HEALTHY" : "UNHEALTHY") : "DISABLED");
        stats.setLastSyncTime(System.currentTimeMillis());

        // Add actual statistics if available
        try {
            if (isEnabled() && testConnection()) {
                // These would be actual counts from your database
                stats.setTotalBrands(carBrandService.getAllBrands().size());
                stats.setTotalModels(carModelService.getAllModels().size());
            }
        } catch (Exception e) {
            log.warn("Error getting statistics for CarQuery provider: {}", e.getMessage());
        }

        return stats;
    }

    @Override
    public ValidationResult validateData() {
        ValidationResult result = new ValidationResult();
        
        try {
            if (!isEnabled()) {
                result.setValid(false);
                result.setMessage("CarQuery provider is disabled");
                result.addError("Provider not enabled in configuration");
                return result;
            }

            if (!testConnection()) {
                result.setValid(false);
                result.setMessage("CarQuery API connection failed");
                result.addError("Cannot connect to CarQuery API");
                return result;
            }

            // Validate data quality
            List<String> issues = new ArrayList<>();
            
            // Check for brands without Arabic names
            List<CarBrand> brandsWithoutArabic = carBrandService.getAllBrands().stream()
                .filter(brand -> brand.getDisplayNameAr() == null || brand.getDisplayNameAr().trim().isEmpty())
                .collect(Collectors.toList());
            
            if (!brandsWithoutArabic.isEmpty()) {
                result.addWarning(String.format("%d brands missing Arabic translations", brandsWithoutArabic.size()));
            }

            // Check for models without brands
            List<CarModel> modelsWithoutBrands = carModelService.getAllModels().stream()
                .filter(model -> model.getBrand() == null)
                .collect(Collectors.toList());
            
            if (!modelsWithoutBrands.isEmpty()) {
                result.addError(String.format("%d models have no associated brand", modelsWithoutBrands.size()));
                result.setValid(false);
            }

            if (result.getErrors().isEmpty()) {
                result.setValid(true);
                result.setMessage("CarQuery data validation passed");
            } else {
                result.setMessage("CarQuery data validation failed");
            }

        } catch (Exception e) {
            result.setValid(false);
            result.setMessage("Error during CarQuery data validation: " + e.getMessage());
            result.addError(e.getMessage());
        }
        
        return result;
    }

    /**
     * Load complete car dataset from CarQuery API
     */
    @CacheEvict(value = {"carBrands", "activeBrands", "carModels", "modelsByBrand"}, allEntries = true)
    public CarDataProvider.DataLoadResult loadCompleteCarDataset() {
        log.info("Loading complete car dataset from CarQuery API...");

        CarDataProvider.DataLoadResult result = new CarDataProvider.DataLoadResult();

        try {
            // Check if CarQuery API client is available
            if (carQueryApiClient == null) {
                throw new CarQueryException("CarQuery API client is not available. Make sure carquery.api.enabled=true");
            }

            // Test API connection first
            if (!carQueryApiClient.testConnection()) {
                throw new CarQueryConnectionException("testConnection", 30000);
            }

            result.addResult("brands", loadAllBrands());
            result.addResult("models", loadAllModels());

            log.info("✅ Complete car dataset loaded successfully from CarQuery API");
            result.setSuccess(true);

        } catch (Exception e) {
            String errorContext = String.format("CarQuery dataset load failed - Operation: loadCarDataset, API Available: %s", 
                carQueryApiClient != null);
            log.error("❌ {}, Error: {}", errorContext, e.getMessage(), e);
            result.setSuccess(false);
            result.setErrorMessage(errorContext + " - " + e.getMessage());
        }

        return result;
    }

    /**
     * Load all brands from CarQuery API with batch processing
     */
    private LoadResult loadAllBrands() {
        LoadResult result = new LoadResult("brands");

        if (carQueryApiClient == null) {
            log.warn("CarQuery API client is not available");
            return result;
        }

        CarQueryMakeResponse response = carQueryApiClient.getAllMakes();

        if (response == null || response.getMakes() == null) {
            log.warn("No makes data received from CarQuery API");
            return result;
        }

        // Process brands in batches to prevent transaction timeouts
        List<CarQueryMakeResponse.CarQueryMake> makes = response.getMakes();
        int batchSize = 50; // Process 50 brands at a time

        for (int i = 0; i < makes.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, makes.size());
            List<CarQueryMakeResponse.CarQueryMake> batch = makes.subList(i, endIndex);

            try {
                processBrandBatch(batch);
                result.incrementProcessed(batch.size());
                log.debug("Processed brand batch {}-{}: {} brands", i, endIndex - 1, batch.size());
            } catch (Exception e) {
                log.warn("Failed to process brand batch {}-{}: {}", i, endIndex - 1, e.getMessage());
                result.incrementFailed(batch.size());
            }
        }

        log.info("Processed {} brands from CarQuery API ({} successful, {} failed)",
            makes.size(), result.getProcessed(), result.getFailed());
        return result;
    }

    /**
     * Process a batch of brands in a separate transaction
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void processBrandBatch(List<CarQueryMakeResponse.CarQueryMake> batch) {
        for (CarQueryMakeResponse.CarQueryMake makeData : batch) {
            try {
                createOrUpdateBrandFromCarQuery(makeData);
            } catch (Exception e) {
                log.warn("Failed to process brand {}: {}", makeData.getMakeDisplay(), e.getMessage());
                throw e; // Re-throw to rollback the batch transaction
            }
        }
    }

    /**
     * Load all models from CarQuery API with batch processing
     */
    private LoadResult loadAllModels() {
        LoadResult result = new LoadResult("models");

        if (carQueryApiClient == null) {
            log.warn("CarQuery API client is not available");
            return result;
        }

        CarQueryMakeResponse makesResponse = carQueryApiClient.getAllMakes();

        if (makesResponse == null || makesResponse.getMakes() == null) {
            log.warn("No makes data available for loading models");
            return result;
        }

        // Process makes in batches to prevent transaction timeouts
        List<CarQueryMakeResponse.CarQueryMake> makes = makesResponse.getMakes();
        int batchSize = 20; // Process 20 makes at a time (fewer because each make has multiple models)

        for (int i = 0; i < makes.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, makes.size());
            List<CarQueryMakeResponse.CarQueryMake> batch = makes.subList(i, endIndex);

            try {
                processModelBatch(batch);
                log.debug("Processed model batch {}-{}: {} makes", i, endIndex - 1, batch.size());
            } catch (Exception e) {
                log.warn("Failed to process model batch {}-{}: {}", i, endIndex - 1, e.getMessage());
            }
        }

        // Get final statistics - we'll count from the processed items
        int totalModels = getModelCountForBatch(makesResponse);
        result.incrementProcessed(totalModels);

        return result;
    }

    /**
     * Process a batch of makes and their models in a separate transaction
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void processModelBatch(List<CarQueryMakeResponse.CarQueryMake> batch) {
        for (CarQueryMakeResponse.CarQueryMake makeData : batch) {
            try {
                CarBrand brand = carBrandService.getBrandBySlug(makeData.getMakeId().toLowerCase());

                // Get models for this make
                CarQueryModelResponse modelsResponse = carQueryApiClient.getModelsByMake(makeData.getMakeId());

                if (modelsResponse != null && modelsResponse.getModels() != null) {
                    for (CarQueryModelResponse.CarQueryModel modelData : modelsResponse.getModels()) {
                        try {
                            createOrUpdateModelFromCarQuery(brand, modelData);
                        } catch (Exception e) {
                            log.debug("Model {} already exists for brand {}", modelData.getModelName(), makeData.getMakeDisplay());
                            // Continue processing other models
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Error processing models for brand {}: {}", makeData.getMakeDisplay(), e.getMessage());
                throw e; // Re-throw to rollback the batch transaction
            }
        }
    }

    /**
     * Get total model count for reporting
     */
    private int getModelCountForBatch(CarQueryMakeResponse makesResponse) {
        int totalModels = 0;
        for (CarQueryMakeResponse.CarQueryMake makeData : makesResponse.getMakes()) {
            try {
                CarQueryModelResponse modelsResponse = carQueryApiClient.getModelsByMake(makeData.getMakeId());
                if (modelsResponse != null && modelsResponse.getModels() != null) {
                    totalModels += modelsResponse.getModels().size();
                }
            } catch (Exception e) {
                log.debug("Error counting models for {}: {}", makeData.getMakeDisplay(), e.getMessage());
            }
        }
        return totalModels;
    }

    /**
     * Get failed model count for reporting (simplified)
     */
    private int getFailedModelCountForBatch(CarQueryMakeResponse makesResponse) {
        // For now, return 0 as we handle failures in batch processing
        // In a production system, you'd want to track this more carefully
        return 0;
    }

    /**
     * Create or update a brand from CarQuery API data
     */
    private void createOrUpdateBrandFromCarQuery(CarQueryMakeResponse.CarQueryMake makeData) {
        try {
            String brandSlug = makeData.getMakeId().toLowerCase();
            String brandName = makeData.getMakeDisplay();

            // Check if brand already exists by slug or name
            try {
                carBrandService.getBrandBySlug(brandSlug);
                log.debug("Brand '{}' already exists (slug: {}), skipping", brandName, brandSlug);
                return;
            } catch (Exception e) {
                // Check by name as well
                try {
                    carBrandService.getBrandByName(brandName);
                    log.debug("Brand '{}' already exists (name: {}), skipping", brandName, brandName);
                    return;
                } catch (Exception ex) {
                    // Brand doesn't exist, create it
                    createBrandDirectly(makeData);
                }
            }
        } catch (Exception e) {
            String errorContext = String.format("Brand creation/update failed - Name: %s, ID: %s, Operation: createOrUpdateBrandFromCarQuery", 
                makeData.getMakeDisplay(), makeData.getMakeId());
            log.warn("{}, Error: {}", errorContext, e.getMessage());
        }
    }

    /**
     * Create brand directly in database
     */
    private void createBrandDirectly(CarQueryMakeResponse.CarQueryMake makeData) {
        try {
            String englishName = makeData.getMakeDisplay();
            String arabicName = arabicTranslationService.translateBrandToArabic(englishName);
            String brandSlug = makeData.getMakeId().toLowerCase();

            CarBrand brand = new CarBrand();
            brand.setName(englishName);
            brand.setSlug(brandSlug);
            brand.setDisplayNameEn(englishName);
            brand.setDisplayNameAr(arabicName);
            brand.setIsActive(true);

            carBrandService.createBrand(brand);
            log.info("Imported brand: {} ({})", englishName, arabicName);

        } catch (Exception e) {
            log.warn("Failed to create brand '{}': {}", makeData.getMakeDisplay(), e.getMessage());
            throw e;
        }
    }


    /**
     * Create or update a model from CarQuery API data
     */
    private void createOrUpdateModelFromCarQuery(CarBrand brand, CarQueryModelResponse.CarQueryModel modelData) {
        try {
            String modelName = modelData.getModelName();

            // Check if model already exists for this brand by name or slug
            List<CarModel> existingModels = carModelService.getModelsByBrandId(brand.getId());

            boolean modelExists = existingModels.stream()
                .anyMatch(model -> model.getName().equals(modelName) ||
                                  model.getSlug().equals(modelName.toLowerCase().replaceAll("[^a-z0-9-]", "-")));

            if (modelExists) {
                log.debug("Model '{}' already exists for brand '{}', skipping",
                         modelName, brand.getDisplayNameEn());
                return;
            }

            // Model doesn't exist, create it directly
            createModelDirectly(brand, modelData);

        } catch (Exception e) {
            log.warn("Failed to create/update model '{}': {}", modelData.getModelName(), e.getMessage());
        }
    }

    /**
     * Create model directly in database
     */
    private void createModelDirectly(CarBrand brand, CarQueryModelResponse.CarQueryModel modelData) {
        try {
            String englishModelName = modelData.getModelName();
            String arabicModelName = arabicTranslationService.translateModelToArabic(
                brand.getDisplayNameEn(), englishModelName);
            String modelSlug = englishModelName.toLowerCase().replaceAll("[^a-z0-9-]", "-");

            CarModel model = new CarModel();
            model.setName(englishModelName);
            model.setSlug(modelSlug);
            model.setDisplayNameEn(englishModelName);
            model.setDisplayNameAr(arabicModelName);
            model.setBrand(brand);
            model.setIsActive(true);

            carModelService.createModel(model);
            log.info("Imported model: {} ({}) for brand {}", englishModelName, arabicModelName, brand.getDisplayNameEn());

        } catch (Exception e) {
            log.warn("Failed to create model '{}': {}", modelData.getModelName(), e.getMessage());
            throw e;
        }
    }


}
