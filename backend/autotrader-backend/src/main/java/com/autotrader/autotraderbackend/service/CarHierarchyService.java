package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.BrandActivationException;
import com.autotrader.autotraderbackend.exception.HierarchyOperationException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling hierarchical operations between Car Brands, Models, and Listings.
 * This service manages cascading operations and maintains data consistency across the hierarchy.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarHierarchyService {

    private final CarBrandRepository carBrandRepository;
    private final CarModelRepository carModelRepository;
    private final CarListingRepository carListingRepository;

    /**
     * Check if a brand has any models (used for brand activation validation)
     * @param brandId The brand ID to check
     * @return true if the brand has at least one model, false otherwise
     */
    public boolean brandHasModels(Long brandId) {
        List<CarModel> models = carModelRepository.findByBrandId(brandId);
        return !models.isEmpty();
    }

    /**
     * Deactivate all models belonging to a specific brand and cascade to car listings
     * @param brandId The brand ID whose models should be deactivated
     * @return HierarchyOperationResult containing operation details
     */
    @Transactional
    @CacheEvict(value = {"carModels", "modelsByBrand", "carModelsPage"}, allEntries = true)
    public HierarchyOperationResult cascadeDeactivateFromBrand(Long brandId) {
        long startTime = System.currentTimeMillis();
        log.info("Starting cascading deactivation for brand ID: {}", brandId);
        
        HierarchyOperationResult result = new HierarchyOperationResult();
        result.setBrandId(brandId);
        
        try {
            // Get counts before operation for reporting
            long activeModelsCount = carModelRepository.countActiveByBrandId(brandId);
            long activeListingsCount = carListingRepository.countActiveByBrandId(brandId);
            
            result.setInitialActiveModels(activeModelsCount);
            result.setInitialActiveListings(activeListingsCount);
            
            if (activeModelsCount == 0) {
                log.info("No active models found for brand ID: {}", brandId);
                result.setSuccess(true);
                return result;
            }
            
            // Perform bulk deactivation operations
            int deactivatedModels = carModelRepository.deactivateByBrandId(brandId);
            int deactivatedListings = carListingRepository.deactivateByBrandId(brandId);
            
            result.setDeactivatedModels(deactivatedModels);
            result.setDeactivatedListings(deactivatedListings);
            result.setSuccess(true);
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("Successfully completed cascading deactivation for brand {} in {}ms: {} models, {} listings deactivated", 
                    brandId, duration, deactivatedModels, deactivatedListings);
                    
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            log.error("Failed to cascade deactivation for brand {}", brandId, e);
            throw new HierarchyOperationException("Cascading deactivation failed for brand " + brandId, e);
        }
        
        return result;
    }

    /**
     * Deactivate car listings for specific models
     * @param modelIds List of model IDs whose listings should be deactivated
     * @return HierarchyOperationResult containing operation details
     */
    @Transactional
    public HierarchyOperationResult cascadeDeactivateFromModels(List<Long> modelIds) {
        log.info("Starting cascading deactivation for {} models", modelIds.size());
        
        HierarchyOperationResult result = new HierarchyOperationResult();
        result.setModelIds(modelIds);
        
        try {
            if (modelIds.isEmpty()) {
                result.setSuccess(true);
                return result;
            }
            
            // Get count before operation
            long activeListingsCount = carListingRepository.countActiveByModelIds(modelIds);
            result.setInitialActiveListings(activeListingsCount);
            
            if (activeListingsCount == 0) {
                log.info("No active listings found for models: {}", modelIds);
                result.setSuccess(true);
                return result;
            }
            
            // Perform bulk deactivation
            int deactivatedListings = carListingRepository.deactivateByModelIds(modelIds);
            
            result.setDeactivatedListings(deactivatedListings);
            result.setSuccess(true);
            
            log.info("Successfully deactivated {} car listings for {} models", deactivatedListings, modelIds.size());
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            log.error("Failed to cascade deactivation for models {}", modelIds, e);
            throw new HierarchyOperationException("Cascading deactivation failed for models", e);
        }
        
        return result;
    }

    /**
     * Auto-activate a brand when an active model is being created under it
     * @param brandId The brand ID to activate
     * @param modelName The name of the model triggering the activation
     */
    @Transactional
    @CacheEvict(value = {"carBrands", "activeBrands"}, allEntries = true)
    public void autoActivateBrand(Long brandId, String modelName) {
        log.info("Auto-activating brand {} because active model '{}' is being created", brandId, modelName);
        
        CarBrand brand = carBrandRepository.findById(brandId)
                .orElseThrow(() -> new HierarchyOperationException("Brand not found: " + brandId));
                
        if (!brand.getIsActive()) {
            brand.setIsActive(true);
            carBrandRepository.save(brand);
            log.info("Successfully auto-activated brand '{}' (ID: {})", brand.getDisplayNameEn(), brandId);
        }
    }

    /**
     * Validate that a brand can be activated (must have at least one model)
     * @param brandId The brand ID to validate
     * @param brandName The brand name for error messages
     * @throws IllegalStateException if brand has no models
     */
    public void validateBrandActivation(Long brandId, String brandName) {
        if (!brandHasModels(brandId)) {
            throw new BrandActivationException("Cannot activate brand '" + brandName + 
                "' because it has no associated models. Please add models first.");
        }
    }

    /**
     * Result object for hierarchy operations
     */
    public static class HierarchyOperationResult {
        private boolean success;
        private String errorMessage;
        private Long brandId;
        private List<Long> modelIds;
        private long initialActiveModels;
        private long initialActiveListings;
        private int deactivatedModels;
        private int deactivatedListings;

        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        
        public Long getBrandId() { return brandId; }
        public void setBrandId(Long brandId) { this.brandId = brandId; }
        
        public List<Long> getModelIds() { return modelIds; }
        public void setModelIds(List<Long> modelIds) { this.modelIds = modelIds; }
        
        public long getInitialActiveModels() { return initialActiveModels; }
        public void setInitialActiveModels(long initialActiveModels) { this.initialActiveModels = initialActiveModels; }
        
        public long getInitialActiveListings() { return initialActiveListings; }
        public void setInitialActiveListings(long initialActiveListings) { this.initialActiveListings = initialActiveListings; }
        
        public int getDeactivatedModels() { return deactivatedModels; }
        public void setDeactivatedModels(int deactivatedModels) { this.deactivatedModels = deactivatedModels; }
        
        public int getDeactivatedListings() { return deactivatedListings; }
        public void setDeactivatedListings(int deactivatedListings) { this.deactivatedListings = deactivatedListings; }
    }

}
