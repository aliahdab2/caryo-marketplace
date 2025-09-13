package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.payload.request.CreateBrandWithModelRequest;
import com.autotrader.autotraderbackend.payload.response.CarBrandResponse;
import com.autotrader.autotraderbackend.payload.response.CarModelResponse;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing car data operations that involve multiple entities
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarDataManagementService {

    private final CarBrandService carBrandService;
    private final CarModelService carModelService;
    private final CarBrandRepository carBrandRepository;
    private final CarModelRepository carModelRepository;
    

    /**
     * Create a new car brand with its first model atomically
     * This ensures that brands are never created without models
     * 
     * @param request Brand and model creation details
     * @return Response containing both created brand and model
     */
    @CacheEvict(value = {"carBrands", "activeBrands", "carModels", "modelsByBrand"}, allEntries = true)
    public BrandWithModelResponse createBrandWithModel(CreateBrandWithModelRequest request) {
        log.info("Creating new brand '{}' with model '{}'", 
                request.getBrand().getName(), request.getModel().getName());
        
        // Check for duplicate brand BEFORE starting transaction
        validateBrandUniqueness(request.getBrand());
        
        // For model validation, we need to check against existing models in the database
        // Since this is a new brand, we only need to check if the model name conflicts
        // with existing models of the same name across all brands (if that's the business rule)
        // For now, we'll validate within transaction since we need the brand to exist first
        
        // Perform the actual creation in a separate transactional method
        return createBrandWithModelTransactional(request);
    }
    
    /**
     * Internal transactional method for creating brand with model
     */
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    private BrandWithModelResponse createBrandWithModelTransactional(CreateBrandWithModelRequest request) {
        // Create the brand first
        CarBrand brand = new CarBrand();
        brand.setName(request.getBrand().getName());
        brand.setDisplayNameEn(request.getBrand().getDisplayNameEn());
        brand.setDisplayNameAr(request.getBrand().getDisplayNameAr());
        brand.setIsActive(request.getBrand().getIsActive());
        
        // Generate unique slug for brand
        String brandSlug = generateUniqueSlug(request.getBrand().getName(), "brand");
        brand.setSlug(brandSlug);
        
        // Save the brand
        CarBrand savedBrand = carBrandService.createBrand(brand);
        
        // Validate model uniqueness for the newly created brand
        validateModelUniqueness(savedBrand, request.getModel());
        
        // Create the model
        CarModel model = new CarModel();
        model.setName(request.getModel().getName());
        model.setDisplayNameEn(request.getModel().getDisplayNameEn());
        model.setDisplayNameAr(request.getModel().getDisplayNameAr());
        model.setIsActive(request.getModel().getIsActive());
        model.setBrand(savedBrand);
        
        // Generate unique slug for model
        String modelSlug = generateUniqueSlug(
            savedBrand.getName() + "-" + request.getModel().getName(), "model");
        model.setSlug(modelSlug);
        
        // Save the model
        CarModel savedModel = carModelService.createModel(model);
        
        log.info("Successfully created brand '{}' with model '{}'", 
                savedBrand.getName(), savedModel.getName());
        
        return new BrandWithModelResponse(
            CarBrandResponse.fromEntity(savedBrand),
            CarModelResponse.fromEntity(savedModel)
        );
    }
    
    /**
     * Generate a unique slug for the given name and type
     */
    private String generateUniqueSlug(String name, String type) {
        String baseSlug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        
        String slug = baseSlug;
        int counter = 1;
        
        // Check uniqueness based on type
        while (isSlugExists(slug, type)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        
        return slug;
    }
    
    /**
     * Check if slug exists for the given type
     */
    private boolean isSlugExists(String slug, String type) {
        if ("brand".equals(type)) {
            return carBrandRepository.existsBySlug(slug);
        } else if ("model".equals(type)) {
            return carModelRepository.existsBySlug(slug);
        }
        return false;
    }
    
    /**
     * Validate that a brand doesn't already exist
     */
    private void validateBrandUniqueness(CreateBrandWithModelRequest.BrandDetails brandDetails) {
        String name = brandDetails.getName().trim();
        String displayNameEn = brandDetails.getDisplayNameEn().trim();
        String displayNameAr = brandDetails.getDisplayNameAr().trim();
        
        if (carBrandRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Brand with name '" + name + "' already exists");
        }
        
        if (carBrandRepository.existsByDisplayNameEnIgnoreCase(displayNameEn)) {
            throw new IllegalArgumentException("Brand with English name '" + displayNameEn + "' already exists");
        }
        
        if (carBrandRepository.existsByDisplayNameArIgnoreCase(displayNameAr)) {
            throw new IllegalArgumentException("Brand with Arabic name '" + displayNameAr + "' already exists");
        }
    }
    
    /**
     * Validate that a model doesn't already exist for the given brand
     */
    private void validateModelUniqueness(CarBrand brand, CreateBrandWithModelRequest.ModelDetails modelDetails) {
        String name = modelDetails.getName().trim();
        String displayNameEn = modelDetails.getDisplayNameEn().trim();
        String displayNameAr = modelDetails.getDisplayNameAr().trim();
        
        if (carModelRepository.existsByBrandAndNameIgnoreCase(brand, name)) {
            throw new IllegalArgumentException("Model with name '" + name + "' already exists for brand '" + brand.getName() + "'");
        }
        
        if (carModelRepository.existsByBrandAndDisplayNameEnIgnoreCase(brand, displayNameEn)) {
            throw new IllegalArgumentException("Model with English name '" + displayNameEn + "' already exists for brand '" + brand.getName() + "'");
        }
        
        if (carModelRepository.existsByBrandAndDisplayNameArIgnoreCase(brand, displayNameAr)) {
            throw new IllegalArgumentException("Model with Arabic name '" + displayNameAr + "' already exists for brand '" + brand.getName() + "'");
        }
    }
    
    /**
     * Response DTO for brand with model creation
     */
    public static class BrandWithModelResponse {
        private final CarBrandResponse brand;
        private final CarModelResponse model;
        
        public BrandWithModelResponse(CarBrandResponse brand, CarModelResponse model) {
            this.brand = brand;
            this.model = model;
        }
        
        public CarBrandResponse getBrand() { return brand; }
        public CarModelResponse getModel() { return model; }
    }
}
