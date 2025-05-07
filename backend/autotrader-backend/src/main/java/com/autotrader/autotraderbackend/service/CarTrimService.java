package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.CarTrim;
import com.autotrader.autotraderbackend.repository.CarTrimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling car trim operations including CRUD operations and filtering
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarTrimService {

    private final CarTrimRepository carTrimRepository;
    private final CarModelService carModelService;

    /**
     * Get all car trims
     * @return List of all car trims
     */
    public List<CarTrim> getAllTrims() {
        return carTrimRepository.findAll();
    }
    
    /**
     * Get car trims by model ID
     * @param modelId ID of the model
     * @return List of car trims belonging to the model
     */
    public List<CarTrim> getTrimsByModelId(Long modelId) {
        CarModel model = carModelService.getModelById(modelId);
        return carTrimRepository.findByModel(model);
    }
    
    /**
     * Get active car trims by model ID
     * @param modelId ID of the model
     * @return List of active car trims belonging to the model
     */
    public List<CarTrim> getActiveTrimsByModelId(Long modelId) {
        CarModel model = carModelService.getModelById(modelId);
        return carTrimRepository.findByModelAndIsActiveTrue(model);
    }
    
    /**
     * Get trims for a specific brand and model using their slugs
     * @param brandSlug Slug of the brand
     * @param modelSlug Slug of the model
     * @return List of car trims for that model
     */
    public List<CarTrim> getTrimsByBrandAndModelSlug(String brandSlug, String modelSlug) {
        // First get the model, which validates both brand and model exist
        CarModel model = carModelService.getModelBySlug(modelSlug);
        
        // Check if the model belongs to the specified brand
        if (!model.getBrand().getSlug().equals(brandSlug)) {
            throw new ResourceNotFoundException("CarModel", "brandMatch", 
                    "Model " + modelSlug + " does not belong to brand " + brandSlug);
        }
        
        return carTrimRepository.findByModel(model);
    }
    
    /**
     * Get active trims for a specific brand and model using their slugs
     * @param brandSlug Slug of the brand
     * @param modelSlug Slug of the model
     * @return List of active car trims for that model
     */
    public List<CarTrim> getActiveTrimsByBrandAndModelSlug(String brandSlug, String modelSlug) {
        // First get the model, which validates both brand and model exist
        CarModel model = carModelService.getModelBySlug(modelSlug);
        
        // Check if the model belongs to the specified brand
        if (!model.getBrand().getSlug().equals(brandSlug)) {
            throw new ResourceNotFoundException("CarModel", "brandMatch", 
                    "Model " + modelSlug + " does not belong to brand " + brandSlug);
        }
        
        return carTrimRepository.findByModelAndIsActiveTrue(model);
    }
    
    /**
     * Get a car trim by its ID
     * @param id Trim ID
     * @return Car trim
     * @throws ResourceNotFoundException if trim not found
     */
    public CarTrim getTrimById(Long id) {
        return carTrimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarTrim", "id", id));
    }
    
    /**
     * Search for trims by name (in English or Arabic)
     * @param query Search query
     * @return List of matching trims
     */
    public List<CarTrim> searchTrims(String query) {
        if (query == null || query.trim().isEmpty()) {
            return carTrimRepository.findAll();
        }
        return carTrimRepository.searchByName(query);
    }
    
    /**
     * Search for trims by model and name
     * @param modelId Model ID
     * @param query Search query
     * @return List of matching trims
     */
    public List<CarTrim> searchTrimsByModel(Long modelId, String query) {
        if (query == null || query.trim().isEmpty()) {
            return getTrimsByModelId(modelId);
        }
        
        // Filter the search results by model
        return carTrimRepository.searchByName(query).stream()
                .filter(trim -> trim.getModel().getId().equals(modelId))
                .toList();
    }
    
    /**
     * Create a new car trim
     * @param trim Trim to create
     * @return Created trim
     */
    @Transactional
    public CarTrim createTrim(CarTrim trim) {
        // Ensure the model exists
        CarModel model = carModelService.getModelById(trim.getModel().getId());
        trim.setModel(model);
        
        log.info("Creating new car trim: {} for model: {}", trim.getName(), model.getName());
        return carTrimRepository.save(trim);
    }
    
    /**
     * Update an existing car trim
     * @param id Trim ID
     * @param trimDetails Updated trim details
     * @return Updated trim
     * @throws ResourceNotFoundException if trim not found
     */
    @Transactional
    public CarTrim updateTrim(Long id, CarTrim trimDetails) {
        CarTrim trim = getTrimById(id);
        
        trim.setName(trimDetails.getName());
        trim.setDisplayNameEn(trimDetails.getDisplayNameEn());
        trim.setDisplayNameAr(trimDetails.getDisplayNameAr());
        trim.setIsActive(trimDetails.getIsActive());
        
        // If model has changed, validate the new model
        if (!trim.getModel().getId().equals(trimDetails.getModel().getId())) {
            CarModel newModel = carModelService.getModelById(trimDetails.getModel().getId());
            trim.setModel(newModel);
        }
        
        log.info("Updated car trim with id: {}", id);
        return carTrimRepository.save(trim);
    }
    
    /**
     * Change activation status of a trim
     * @param id Trim ID
     * @param isActive New activation status
     * @return Updated trim
     */
    @Transactional
    public CarTrim updateTrimActivation(Long id, boolean isActive) {
        CarTrim trim = getTrimById(id);
        trim.setIsActive(isActive);
        
        log.info("Updated activation status of trim with id: {} to: {}", id, isActive);
        return carTrimRepository.save(trim);
    }
    
    /**
     * Delete a car trim
     * @param id Trim ID
     */
    @Transactional
    public void deleteTrim(Long id) {
        CarTrim trim = getTrimById(id);
        log.info("Deleting car trim with id: {}", id);
        carTrimRepository.delete(trim);
    }
}
