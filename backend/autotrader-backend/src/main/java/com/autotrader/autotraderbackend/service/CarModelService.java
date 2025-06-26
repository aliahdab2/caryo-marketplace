package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
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
    public List<CarModel> getModelsByBrandSlug(String brandSlug) {
        CarBrand brand = carBrandService.getBrandBySlug(brandSlug);
        return carModelRepository.findByBrand(brand);
    }
    
    /**
     * Get active car models by brand slug
     * @param brandSlug Slug of the brand
     * @return List of active car models belonging to the brand
     */
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
    public CarModel getModelBySlug(String slug) {
        return carModelRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("CarModel", "slug", slug));
    }
    
    /**
     * Search for models by name (in English or Arabic)
     * @param query Search query
     * @return List of matching models
     */
    public List<CarModel> searchModels(String query) {
        if (query == null || query.trim().isEmpty()) {
            return carModelRepository.findAll();
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
    public CarModel createModel(CarModel model) {
        // Ensure the brand exists
        CarBrand brand = carBrandService.getBrandById(model.getBrand().getId());
        model.setBrand(brand);
        
        log.info("Creating new car model: {} for brand: {}", model.getName(), brand.getName());
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
    public CarModel updateModel(Long id, CarModel modelDetails) {
        CarModel model = getModelById(id);
        
        model.setName(modelDetails.getName());
        model.setDisplayNameEn(modelDetails.getDisplayNameEn());
        model.setDisplayNameAr(modelDetails.getDisplayNameAr());
        model.setIsActive(modelDetails.getIsActive());
        // Don't update slug as it should be immutable for URL stability
        
        // If brand has changed, validate the new brand
        if (!model.getBrand().getId().equals(modelDetails.getBrand().getId())) {
            CarBrand newBrand = carBrandService.getBrandById(modelDetails.getBrand().getId());
            model.setBrand(newBrand);
        }
        
        log.info("Updated car model with id: {}", id);
        return carModelRepository.save(model);
    }
    
    /**
     * Change activation status of a model
     * @param id Model ID
     * @param isActive New activation status
     * @return Updated model
     */
    @Transactional
    public CarModel updateModelActivation(Long id, boolean isActive) {
        CarModel model = getModelById(id);
        model.setIsActive(isActive);
        
        log.info("Updated activation status of model with id: {} to: {}", id, isActive);
        return carModelRepository.save(model);
    }
    
    /**
     * Delete a car model
     * @param id Model ID
     */
    @Transactional
    public void deleteModel(Long id) {
        CarModel model = getModelById(id);
        log.info("Deleting car model with id: {}", id);
        carModelRepository.delete(model);
    }
}
