package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
import com.autotrader.autotraderbackend.payload.request.UpdateModelRequest;
import com.autotrader.autotraderbackend.payload.request.CreateModelRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling car model operations including CRUD operations and filtering
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarModelService {

    private final CarModelRepository carModelRepository;
    private final CarBrandService carBrandService;

    /**
     * Get all car models
     * @return List of all car models
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "carModels", key = "'all'")
    public List<CarModel> getAllModels() {
        log.debug("Fetching all car models from database");
        return carModelRepository.findAll();
    }
    
    /**
     * Get car models by brand ID
     * @param brandId ID of the brand
     * @return List of car models belonging to the brand
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "modelsByBrand", key = "#brandId")
    public List<CarModel> getModelsByBrandId(Long brandId) {
        log.debug("Fetching car models for brand ID: {}", brandId);
        CarBrand brand = carBrandService.getBrandById(brandId);
        return carModelRepository.findByBrand(brand);
    }
    
    /**
     * Get active car models by brand ID
     * @param brandId ID of the brand
     * @return List of active car models belonging to the brand
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "modelsByBrand", key = "'active-' + #brandId")
    public List<CarModel> getActiveModelsByBrandId(Long brandId) {
        log.debug("Fetching active car models for brand ID: {}", brandId);
        CarBrand brand = carBrandService.getBrandById(brandId);
        return carModelRepository.findByBrandAndIsActiveTrue(brand);
    }
    
    /**
     * Get car models by brand slug
     * @param brandSlug Slug of the brand
     * @return List of car models belonging to the brand
     */
    @Transactional(readOnly = true)
    public List<CarModel> getModelsByBrandSlug(String brandSlug) {
        CarBrand brand = carBrandService.getBrandBySlug(brandSlug);
        return carModelRepository.findByBrand(brand);
    }
    
    /**
     * Get active car models by brand slug
     * @param brandSlug Slug of the brand
     * @return List of active car models belonging to the brand
     */
    @Transactional(readOnly = true)
    public List<CarModel> getActiveModelsByBrandSlug(String brandSlug) {
        CarBrand brand = carBrandService.getBrandBySlug(brandSlug);
        return carModelRepository.findByBrandAndIsActiveTrue(brand);
    }
    
    /**
     * Get a car model by its ID
     * @param id Model ID
     * @return Car model
     * @throws ResourceNotFoundException if model not found
     */
    @Transactional(readOnly = true)
    public CarModel getModelById(Long id) {
        return carModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarModel", "id", id));
    }
    
    /**
     * Get a car model by its slug
     * @param slug Model slug
     * @return Car model
     * @throws ResourceNotFoundException if model not found
     */
    @Transactional(readOnly = true)
    public CarModel getModelBySlug(String slug) {
        return carModelRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("CarModel", "slug", slug));
    }
    
    /**
     * Search for models by name (in English or Arabic)
     * @param query Search query
     * @return List of matching models
     */
    @Transactional(readOnly = true)
    public List<CarModel> searchModels(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllModels();
        }
        return carModelRepository.searchByName(query);
    }
    
    /**
     * Search for models by brand and name
     * @param brandId Brand ID
     * @param query Search query
     * @return List of matching models
     */
    public List<CarModel> searchModelsByBrand(Long brandId, String query) {
        if (query == null || query.trim().isEmpty()) {
            return getModelsByBrandId(brandId);
        }
        
        // Filter the search results by brand
        return carModelRepository.searchByName(query).stream()
                .filter(model -> model.getBrand().getId().equals(brandId))
                .toList();
    }
    
    /**
     * Create a new car model
     * @param model Model to create
     * @return Created model
     */
    @Transactional
    @CacheEvict(value = {"carModels", "modelsByBrand"}, allEntries = true)
    public CarModel createModel(CarModel model) {
        // Ensure the brand exists
        CarBrand brand = carBrandService.getBrandById(model.getBrand().getId());
        model.setBrand(brand);
        
        // Smart activation: If creating an active model and parent brand is inactive, activate the brand
        if (model.getIsActive() && !brand.getIsActive()) {
            log.info("Auto-activating parent brand '{}' because active model '{}' is being created", 
                    brand.getDisplayNameEn(), model.getName());
            brand.setIsActive(true);
            carBrandService.updateBrand(brand.getId(), brand);
        }
        
        log.info("Creating new car model: {} for brand: {}", model.getName(), brand.getName());
        return carModelRepository.save(model);
    }
    
    /**
     * Create a new car model using request DTO
     * @param createRequest Model creation details from request
     * @return Created model
     */
    @Transactional
    @CacheEvict(value = {"carModels", "modelsByBrand"}, allEntries = true)
    public CarModel createModel(CreateModelRequest createRequest) {
        // Ensure the brand exists
        CarBrand brand = carBrandService.getBrandById(createRequest.getBrandId());
        
        // Validate model uniqueness
        validateModelUniqueness(brand, createRequest);
        
        CarModel model = new CarModel();
        model.setName(createRequest.getName());
        model.setDisplayNameEn(createRequest.getDisplayNameEn());
        model.setDisplayNameAr(createRequest.getDisplayNameAr());
        model.setIsActive(createRequest.getIsActive() != null ? createRequest.getIsActive() : true);
        model.setBrand(brand);
        
        // Smart activation: If creating an active model and parent brand is inactive, activate the brand
        if (model.getIsActive() && !brand.getIsActive()) {
            log.info("Auto-activating parent brand '{}' because active model '{}' is being created", 
                    brand.getDisplayNameEn(), createRequest.getName());
            brand.setIsActive(true);
            carBrandService.updateBrand(brand.getId(), brand);
        }
        
        // Generate unique slug from name and brand
        String baseSlug = (brand.getName() + "-" + createRequest.getName()).toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", ""); // Remove leading/trailing dashes
        
        String slug = baseSlug;
        int counter = 1;
        while (carModelRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        model.setSlug(slug);
        
        log.info("Creating new car model using request DTO: {} for brand: {}", createRequest.getName(), brand.getName());
        return carModelRepository.save(model);
    }
    
    /**
     * Update an existing car model
     * @param id Model ID
     * @param modelDetails Updated model details
     * @return Updated model
     * @throws ResourceNotFoundException if model not found
     */
    @Transactional
    @CacheEvict(value = {"carModels", "modelsByBrand"}, allEntries = true)
    public CarModel updateModel(Long id, CarModel modelDetails) {
        CarModel model = getModelById(id);
        
        model.setName(modelDetails.getName());
        model.setDisplayNameEn(modelDetails.getDisplayNameEn());
        model.setDisplayNameAr(modelDetails.getDisplayNameAr());
        
        // If brand has changed, validate and set the new brand first
        CarBrand targetBrand = model.getBrand(); // Default to current brand
        if (!model.getBrand().getId().equals(modelDetails.getBrand().getId())) {
            targetBrand = carBrandService.getBrandById(modelDetails.getBrand().getId());
            model.setBrand(targetBrand);
        }
        
        // Smart activation: If model is being activated, ensure parent brand is also active
        if (modelDetails.getIsActive() && !model.getIsActive()) {
            if (!targetBrand.getIsActive()) {
                log.info("Auto-activating parent brand '{}' because model '{}' is being activated", 
                        targetBrand.getDisplayNameEn(), model.getDisplayNameEn());
                targetBrand.setIsActive(true);
                carBrandService.updateBrand(targetBrand.getId(), targetBrand);
            }
        }
        
        model.setIsActive(modelDetails.getIsActive());
        // Don't update slug as it should be immutable for URL stability
        
        log.info("Updated car model with id: {}", id);
        return carModelRepository.save(model);
    }
    
    /**
     * Update an existing car model using request DTO
     * @param id Model ID
     * @param updateRequest Updated model details from request
     * @return Updated model
     * @throws ResourceNotFoundException if model not found
     */
    @Transactional
    @CacheEvict(value = {"carModels", "modelsByBrand"}, allEntries = true)
    public CarModel updateModel(Long id, UpdateModelRequest updateRequest) {
        CarModel model = getModelById(id);
        
        model.setName(updateRequest.getName());
        model.setDisplayNameEn(updateRequest.getDisplayNameEn());
        model.setDisplayNameAr(updateRequest.getDisplayNameAr());
        
        boolean wasActive = model.getIsActive(); // Store previous active status
        model.setIsActive(updateRequest.getIsActive());
        
        // Don't update slug as it should be immutable for URL stability
        
        // If brand has changed, validate the new brand
        CarBrand currentBrand = model.getBrand(); // Store current brand
        if (!currentBrand.getId().equals(updateRequest.getBrandId())) {
            CarBrand newBrand = carBrandService.getBrandById(updateRequest.getBrandId());
            model.setBrand(newBrand);
            currentBrand = newBrand; // Update currentBrand to the new brand
        }
        
        // Smart activation: If model is becoming active and its brand is inactive, activate the brand
        if (model.getIsActive() && !wasActive && !currentBrand.getIsActive()) {
            log.info("Auto-activating parent brand '{}' because model '{}' is being activated", 
                    currentBrand.getDisplayNameEn(), model.getDisplayNameEn());
            currentBrand.setIsActive(true);
            carBrandService.updateBrand(currentBrand.getId(), currentBrand);
        }
        
        log.info("Updated car model with id: {} using request DTO", id);
        return carModelRepository.save(model);
    }
    
    /**
     * Change activation status of a model
     * @param id Model ID
     * @param isActive New activation status
     * @return Updated model
     */
    @Transactional
    @CacheEvict(value = {"carModels", "modelsByBrand"}, allEntries = true)
    public CarModel updateModelActivation(Long id, boolean isActive) {
        CarModel model = getModelById(id);
        boolean wasActive = model.getIsActive();
        model.setIsActive(isActive);
        
        // Smart activation: If model is becoming active and its brand is inactive, activate the brand
        if (isActive && !wasActive && !model.getBrand().getIsActive()) {
            CarBrand brand = model.getBrand();
            log.info("Auto-activating parent brand '{}' because model '{}' is being activated", 
                    brand.getDisplayNameEn(), model.getDisplayNameEn());
            brand.setIsActive(true);
            carBrandService.updateBrand(brand.getId(), brand);
        }
        
        log.info("Updated activation status of model with id: {} to: {}", id, isActive);
        return carModelRepository.save(model);
    }
    
    /**
     * Delete a car model
     * @param id Model ID
     */
    @Transactional
    @CacheEvict(value = {"carModels", "modelsByBrand"}, allEntries = true)
    public void deleteModel(Long id) {
        CarModel model = getModelById(id);
        log.info("Deleting car model with id: {}", id);
        carModelRepository.delete(model);
    }
    
    /**
     * Validate that a model doesn't already exist for the given brand
     */
    private void validateModelUniqueness(CarBrand brand, CreateModelRequest modelRequest) {
        String name = modelRequest.getName().trim();
        String displayNameEn = modelRequest.getDisplayNameEn().trim();
        String displayNameAr = modelRequest.getDisplayNameAr().trim();
        
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
     * Update model status (ACTIVE, INACTIVE, PENDING)
     */
    public CarModel updateModelStatus(Long modelId, String status) {
        CarModel model = getModelById(modelId);
        
        // Validate status
        if (!isValidStatus(status)) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Valid values are: ACTIVE, INACTIVE, PENDING");
        }
        
        boolean isActive = "ACTIVE".equalsIgnoreCase(status);
        model.setIsActive(isActive);
        
        return carModelRepository.save(model);
    }

    /**
     * Get all pending models (for admin approval)
     */
    public List<CarModel> getPendingModels() {
        // For now, we'll consider inactive models as pending
        // In future, you might want to add a separate status field
        return carModelRepository.findByIsActiveFalse();
    }

    /**
     * Validate status value
     */
    private boolean isValidStatus(String status) {
        return status != null && 
               (status.equalsIgnoreCase("ACTIVE") || 
                status.equalsIgnoreCase("INACTIVE") || 
                status.equalsIgnoreCase("PENDING"));
    }

    /**
     * Validates that a model is active and can be used for new listings.
     * Industry best practice: Prevent NEW listings with inactive models, but keep existing ones visible.
     */
    public void validateModelActiveForNewListing(Long modelId) {
        CarModel model = getModelById(modelId);
        if (!model.getIsActive()) {
            throw new IllegalArgumentException("Cannot create new listings with inactive model: " + model.getDisplayNameEn() + 
                ". This model is marked as discontinued or under review. Please contact support if you believe this is an error.");
        }
    }
}
