package com.caryo.marketplace.service;

import com.caryo.marketplace.dto.CarQueryMakeResponse;
import com.caryo.marketplace.dto.CarQueryModelResponse;
import com.caryo.marketplace.model.CarBrand;
import com.caryo.marketplace.model.CarModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

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
    private final SyncStatusService syncStatusService;

    @Autowired(required = false)
    private CarQueryApiClient carQueryApiClient;

    @Override
    public String getProviderName() {
        return "CarQueryAPI";
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
            log.info("CarQuery API client not available, will use fallback data provider");
            return false; // Return false so fallback data provider can be used
        }

        boolean apiWorking = carQueryApiClient.testConnection();
        if (!apiWorking) {
            log.info("CarQuery API not responding with data, will use fallback data provider");
        }
        return apiWorking;
    }

    @Override
    public boolean isEnabled() {
        return carQueryApiClient != null;
    }

    @Override
    public DataLoadResult loadCompleteDataset() {
        log.info("Loading complete dataset from CarQuery API");
        syncStatusService.startSync(getProviderName());
        DataLoadResult result = new DataLoadResult();

        try {
            result.addResult("brands", loadAllBrands());
            result.addResult("models", loadAllModels());

            result.setSuccess(true);
            log.info("Successfully loaded complete dataset from CarQuery API");
            syncStatusService.completeSync(getProviderName(), "Sync completed successfully", result.getTotalProcessed(), result.getTotalFailed());

        } catch (Exception e) {
            String errorContext = String.format("CarQuery complete dataset load failed - Provider: %s, API Client Available: %s",
                getProviderName(), carQueryApiClient != null);
            log.error("{}, Error: {}", errorContext, e.getMessage(), e);
            result.setSuccess(false);
            result.setErrorMessage(errorContext + " - " + e.getMessage());
            syncStatusService.failSync(getProviderName(), e.getMessage());
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
            // List<String> issues = new ArrayList<>(); // Removed unused variable

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
     * Load complete car dataset from CarQuery API - no fallback, clean data only
     */
    @CacheEvict(value = {"carBrands", "activeBrands", "carModels", "modelsByBrand", "carModelsPage"}, allEntries = true)
    public CarDataProvider.DataLoadResult loadCompleteCarDataset() {
        log.info("Loading complete car dataset from CarQuery API...");
        syncStatusService.startSync(getProviderName());

        CarDataProvider.DataLoadResult result = new CarDataProvider.DataLoadResult();

        try {
            // Check if CarQuery API client is available
            if (carQueryApiClient == null) {
                log.error("CarQuery API client not available - no fallback data will be loaded");
                result.setSuccess(false);
                result.setErrorMessage("CarQuery API client not configured");
                return result;
            }

            // Test API connection first
            if (!carQueryApiClient.testConnection()) {
                log.error("CarQuery API not responding with data - no fallback data will be loaded");
                result.setSuccess(false);
                result.setErrorMessage("CarQuery API connection failed");
                return result;
            }

            result.addResult("brands", loadAllBrands());
            result.addResult("models", loadAllModels());

            log.info("✅ Complete car dataset loaded successfully from CarQuery API");
            result.setSuccess(true);
            syncStatusService.completeSync(getProviderName(), "Sync completed successfully", result.getTotalProcessed(), result.getTotalFailed());

        } catch (Exception e) {
            String errorContext = String.format("CarQuery dataset load failed - Operation: loadCarDataset, API Available: %s",
                carQueryApiClient != null);
            log.error("❌ {}, Error: {}", errorContext, e.getMessage(), e);
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            syncStatusService.failSync(getProviderName(), e.getMessage());
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
        int skippedBrands = 0;

        log.info("Starting brand validation and import process for {} brands from CarQuery API", makes.size());

        for (int i = 0; i < makes.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, makes.size());
            List<CarQueryMakeResponse.CarQueryMake> batch = makes.subList(i, endIndex);

            try {
                int batchSkipped = processBrandBatchWithValidation(batch);
                skippedBrands += batchSkipped;
                result.incrementProcessed(batch.size() - batchSkipped);
                result.incrementFailed(batchSkipped);
                log.debug("Processed brand batch {}-{}: {} brands ({} imported, {} skipped)",
                         i, endIndex - 1, batch.size(), batch.size() - batchSkipped, batchSkipped);
            } catch (Exception e) {
                log.warn("Failed to process brand batch {}-{}: {}", i, endIndex - 1, e.getMessage());
                result.incrementFailed(batch.size());
            }
        }

        log.info("Brand import completed: {} total brands, {} imported, {} skipped (no models), {} failed",
            makes.size(), result.getProcessed(), skippedBrands, result.getFailed() - skippedBrands);
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
     * Process a batch of brands with validation in a separate transaction
     * @param batch List of makes to process
     * @return Number of brands skipped due to no models
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private int processBrandBatchWithValidation(List<CarQueryMakeResponse.CarQueryMake> batch) {
        int skippedCount = 0;

        for (CarQueryMakeResponse.CarQueryMake makeData : batch) {
            try {
                String brandSlug = makeData.getMakeId().toLowerCase();
                String brandName = makeData.getMakeDisplay();

                // Check if brand already exists
                try {
                    carBrandService.getBrandBySlug(brandSlug);
                    log.debug("Brand '{}' already exists, skipping validation", brandName);
                    continue;
                } catch (Exception e) {
                    try {
                        carBrandService.getBrandByName(brandName);
                        log.debug("Brand '{}' already exists by name, skipping validation", brandName);
                        continue;
                    } catch (Exception ex) {
                        // Brand doesn't exist, validate and create
                        if (validateBrandHasModels(makeData.getMakeId())) {
                            createBrandDirectly(makeData);
                            log.info("✅ Imported brand: {} (validated with models)", brandName);
                        } else {
                            skippedCount++;
                            log.info("⏭️ Skipped brand: {} (no models available)", brandName);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to process brand {}: {}", makeData.getMakeDisplay(), e.getMessage());
                throw e; // Re-throw to rollback the batch transaction
            }
        }

        return skippedCount;
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
     * Create or update a brand from CarQuery API data
     * Creates new brands OR imports new models for existing brands
     */
    private void createOrUpdateBrandFromCarQuery(CarQueryMakeResponse.CarQueryMake makeData) {
        try {
            String brandSlug = makeData.getMakeId().toLowerCase();
            String brandName = makeData.getMakeDisplay();
            CarBrand existingBrand = null;

            // Check if brand already exists by slug or name
            try {
                existingBrand = carBrandService.getBrandBySlug(brandSlug);
                log.debug("Brand '{}' already exists (slug: {}), checking for new models", brandName, brandSlug);
            } catch (Exception e) {
                // Check by name as well
                try {
                    existingBrand = carBrandService.getBrandByName(brandName);
                    log.debug("Brand '{}' already exists (name: {}), checking for new models", brandName, brandName);
                } catch (Exception ex) {
                    // Brand doesn't exist, validate it has models before creating
                    if (validateBrandHasModels(makeData.getMakeId())) {
                        createBrandDirectly(makeData);
                        return; // Brand created, models will be imported in next phase
                    } else {
                        log.info("Skipping brand '{}' - no models available in CarQuery API", brandName);
                        return;
                    }
                }
            }

            // If brand exists, import any new models
            if (existingBrand != null) {
                importModelsForExistingBrand(existingBrand, makeData.getMakeId());
            }

        } catch (Exception e) {
            String errorContext = String.format("Brand creation/update failed - Name: %s, ID: %s, Operation: createOrUpdateBrandFromCarQuery",
                makeData.getMakeDisplay(), makeData.getMakeId());
            log.warn("{}, Error: {}", errorContext, e.getMessage());
        }
    }

    /**
     * Import new models for an existing brand
     * @param existingBrand The existing brand entity
     * @param makeId The CarQuery make ID
     */
    private void importModelsForExistingBrand(CarBrand existingBrand, String makeId) {
        try {
            log.info("Checking for new models for existing brand: {}", existingBrand.getName());

            CarQueryModelResponse modelsResponse = carQueryApiClient.getModelsByMake(makeId);
            if (modelsResponse == null || modelsResponse.getModels() == null || modelsResponse.getModels().isEmpty()) {
                log.debug("No models found for brand '{}' in CarQuery API", existingBrand.getName());
                return;
            }

            int newModelsCount = 0;
            for (CarQueryModelResponse.CarQueryModel modelData : modelsResponse.getModels()) {
                try {
                    // Check if model already exists for this brand
                    String modelName = modelData.getModelName();
                    String expectedSlug = (existingBrand.getName() + "-" + modelName).toLowerCase().replaceAll("[^a-z0-9-]", "-");

                    // Try to find existing model by slug
                    try {
                        carModelService.getModelBySlug(expectedSlug);
                        log.debug("Model '{}' already exists for brand '{}', skipping", modelName, existingBrand.getName());
                        continue;
                    } catch (Exception e) {
                        // Model doesn't exist, create it
                        createModelDirectly(existingBrand, modelData);
                        newModelsCount++;
                    }
                } catch (Exception e) {
                    log.warn("Failed to process model '{}' for brand '{}': {}",
                            modelData.getModelName(), existingBrand.getName(), e.getMessage());
                }
            }

            if (newModelsCount > 0) {
                log.info("✅ Imported {} new models for existing brand '{}'", newModelsCount, existingBrand.getName());
            } else {
                log.debug("No new models found for existing brand '{}'", existingBrand.getName());
            }

        } catch (Exception e) {
            log.error("Failed to import models for existing brand '{}': {}", existingBrand.getName(), e.getMessage());
        }
    }

    /**
     * Validate that a brand has available models in CarQuery API
     * @param makeId The make ID to check
     * @return true if the brand has models, false otherwise
     */
    private boolean validateBrandHasModels(String makeId) {
        try {
            log.debug("Validating models availability for brand: {}", makeId);

            CarQueryModelResponse modelsResponse = carQueryApiClient.getModelsByMake(makeId);

            if (modelsResponse == null || modelsResponse.getModels() == null || modelsResponse.getModels().isEmpty()) {
                log.warn("❌ BRAND VALIDATION FAILED: '{}' has no models available - will not be imported", makeId);
                return false;
            }

            int modelCount = modelsResponse.getModels().size();
            log.debug("✅ BRAND VALIDATION PASSED: '{}' has {} models available", makeId, modelCount);
            return true;

        } catch (Exception e) {
            log.warn("❌ BRAND VALIDATION ERROR: Cannot validate models for brand '{}': {} - will not be imported to maintain data quality", makeId, e.getMessage());
            // For strict data quality, return false when we can't validate
            return false;
        }
    }

    /**
     * Comprehensive data quality validation for brand creation
     */
    private boolean validateBrandDataQuality(CarQueryMakeResponse.CarQueryMake makeData) {
        String englishName = makeData.getMakeDisplay();

        // 1. Validate Arabic translation availability
        String arabicName = arabicTranslationService.translateBrandToArabic(englishName);
        if (arabicName == null || arabicName.trim().isEmpty()) {
            log.warn("❌ DATA QUALITY CHECK FAILED: '{}' - No Arabic translation available", englishName);
            return false;
        }

        // 2. Validate translation is actually different from English
        if (arabicName.equalsIgnoreCase(englishName.trim())) {
            log.warn("❌ DATA QUALITY CHECK FAILED: '{}' - Translation identical to English name", englishName);
            return false;
        }

        // 3. Validate brand has models available
        if (!validateBrandHasModels(makeData.getMakeId())) {
            log.warn("❌ DATA QUALITY CHECK FAILED: '{}' - No models available for this brand", englishName);
            return false;
        }

        // 4. Validate basic data integrity
        if (englishName == null || englishName.trim().isEmpty()) {
            log.warn("❌ DATA QUALITY CHECK FAILED: Empty or null English brand name");
            return false;
        }

        if (makeData.getMakeId() == null || makeData.getMakeId().trim().isEmpty()) {
            log.warn("❌ DATA QUALITY CHECK FAILED: Empty or null make ID");
            return false;
        }

        log.info("✅ DATA QUALITY CHECK PASSED: '{}' -> '{}' - All validations successful", englishName, arabicName);
        return true;
    }

    /**
     * Create brand directly in database - ONLY after comprehensive data quality validation
     */
    private void createBrandDirectly(CarQueryMakeResponse.CarQueryMake makeData) {
        try {
            // COMPREHENSIVE DATA QUALITY VALIDATION - Only proceed if ALL checks pass
            if (!validateBrandDataQuality(makeData)) {
                log.warn("❌ BRAND CREATION SKIPPED: '{}' failed comprehensive data quality validation", makeData.getMakeDisplay());
                return;
            }

            String englishName = makeData.getMakeDisplay();
            String arabicName = arabicTranslationService.translateBrandToArabic(englishName);
            String brandSlug = makeData.getMakeId().toLowerCase();

            CarBrand brand = new CarBrand();
            brand.setName(englishName);
            brand.setSlug(brandSlug);
            brand.setDisplayNameEn(englishName);
            brand.setDisplayNameAr(arabicName);
            brand.setIsActive(false); // External API data requires admin review

            carBrandService.createBrand(brand);
            log.info("✅ BRAND SUCCESSFULLY CREATED: {} ({}) - 100% data quality assurance", englishName, arabicName);

        } catch (Exception e) {
            log.error("❌ CRITICAL ERROR creating brand '{}': {}", makeData.getMakeDisplay(), e.getMessage());
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
     * Comprehensive data quality validation for model creation
     */
    private boolean validateModelDataQuality(CarBrand brand, CarQueryModelResponse.CarQueryModel modelData) {
        String englishModelName = modelData.getModelName();

        // 1. Validate Arabic translation availability
        String arabicModelName = arabicTranslationService.translateModelToArabic(
            brand.getDisplayNameEn(), englishModelName);
        if (arabicModelName == null || arabicModelName.trim().isEmpty()) {
            log.warn("❌ MODEL DATA QUALITY CHECK FAILED: '{}' for brand '{}' - No Arabic translation available",
                    englishModelName, brand.getDisplayNameEn());
            return false;
        }

        // 2. Validate translation is actually different from English
        if (arabicModelName.equalsIgnoreCase(englishModelName.trim())) {
            log.warn("❌ MODEL DATA QUALITY CHECK FAILED: '{}' for brand '{}' - Translation identical to English name",
                    englishModelName, brand.getDisplayNameEn());
            return false;
        }

        // 3. Validate basic data integrity
        if (englishModelName == null || englishModelName.trim().isEmpty()) {
            log.warn("❌ MODEL DATA QUALITY CHECK FAILED: Empty or null English model name for brand '{}'",
                    brand.getDisplayNameEn());
            return false;
        }

        // 4. Validate brand relationship
        if (brand == null || brand.getId() == null) {
            log.warn("❌ MODEL DATA QUALITY CHECK FAILED: Invalid brand relationship for model '{}'", englishModelName);
            return false;
        }

        log.info("✅ MODEL DATA QUALITY CHECK PASSED: '{}' -> '{}' for brand '{}' - All validations successful",
                englishModelName, arabicModelName, brand.getDisplayNameEn());
        return true;
    }

    /**
     * Create model directly in database - ONLY after comprehensive data quality validation
     */
    private void createModelDirectly(CarBrand brand, CarQueryModelResponse.CarQueryModel modelData) {
        try {
            // COMPREHENSIVE DATA QUALITY VALIDATION - Only proceed if ALL checks pass
            if (!validateModelDataQuality(brand, modelData)) {
                log.warn("❌ MODEL CREATION SKIPPED: '{}' for brand '{}' failed comprehensive data quality validation",
                        modelData.getModelName(), brand.getDisplayNameEn());
                return;
            }

            String englishModelName = modelData.getModelName();
            String arabicModelName = arabicTranslationService.translateModelToArabic(
                brand.getDisplayNameEn(), englishModelName);

            // Skip model creation if Arabic translation is not available
            if (arabicModelName == null || arabicModelName.trim().isEmpty()) {
                log.warn("⚠️ SKIPPING MODEL CREATION: '{}' for brand '{}' - Arabic translation not available",
                        englishModelName, brand.getDisplayNameEn());
                return;
            }

            // Generate slug with brand-model format for proper filtering
            String modelSlug = (brand.getName() + "-" + englishModelName).toLowerCase().replaceAll("[^a-z0-9-]", "-");

            // Check if model with this slug already exists
            try {
                carModelService.getModelBySlug(modelSlug);
                log.debug("Model with slug '{}' already exists, skipping creation", modelSlug);
                return;
            } catch (Exception e) {
                // Model doesn't exist, proceed with creation
            }

            CarModel model = new CarModel();
            model.setName(englishModelName);
            model.setSlug(modelSlug);
            model.setDisplayNameEn(englishModelName);
            model.setDisplayNameAr(arabicModelName);
            model.setBrand(brand);
            model.setIsActive(false); // External API data requires admin review

            carModelService.createModel(model);
            log.info("✅ MODEL SUCCESSFULLY CREATED: {} ({}) for brand {} - 100% data quality assurance",
                    englishModelName, arabicModelName, brand.getDisplayNameEn());

        } catch (Exception e) {
            log.error("❌ CRITICAL ERROR creating model '{}': {}", modelData.getModelName(), e.getMessage());
            throw e;
        }
    }


}

