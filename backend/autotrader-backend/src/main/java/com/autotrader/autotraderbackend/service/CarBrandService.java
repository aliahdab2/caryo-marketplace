package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling car brand operations including CRUD operations and filtering
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarBrandService {

    private final CarBrandRepository carBrandRepository;

    /**
     * Get all car brands
     * @return List of all car brands
     */
    @Cacheable(value = "carBrands", key = "'all'")
    public List<CarBrand> getAllBrands() {
        return carBrandRepository.findAll();
    }
    
    /**
     * Get only active car brands
     * @return List of active car brands
     */
    @Cacheable(value = "carBrands", key = "'active'")
    public List<CarBrand> getActiveBrands() {
        return carBrandRepository.findByIsActiveTrue();
    }
    
    /**
     * Get a car brand by its ID
     * @param id Brand ID
     * @return Car brand
     * @throws ResourceNotFoundException if brand not found
     */
    @Cacheable(value = "carBrands", key = "#id")
    public CarBrand getBrandById(Long id) {
        return carBrandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarBrand", "id", id));
    }
    
    /**
     * Get a car brand by its slug
     * @param slug Brand slug
     * @return Car brand
     * @throws ResourceNotFoundException if brand not found
     */
    public CarBrand getBrandBySlug(String slug) {
        return carBrandRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("CarBrand", "slug", slug));
    }
    
    /**
     * Search for brands by name (in English or Arabic)
     * @param query Search query
     * @return List of matching brands
     */
    public List<CarBrand> searchBrands(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getActiveBrands();
        }
        return carBrandRepository.searchByName(query);
    }
    
    /**
     * Create a new car brand
     * @param brand Brand to create
     * @return Created brand
     */
    @Transactional
    @CacheEvict(value = {"carBrands", "activeBrands"}, allEntries = true)
    public CarBrand createBrand(CarBrand brand) {
        log.info("Creating new car brand: {}", brand.getName());
        return carBrandRepository.save(brand);
    }
    
    /**
     * Update an existing car brand
     * @param id Brand ID
     * @param brandDetails Updated brand details
     * @return Updated brand
     * @throws ResourceNotFoundException if brand not found
     */
    @Transactional
    @CacheEvict(value = {"carBrands", "activeBrands"}, allEntries = true)
    public CarBrand updateBrand(Long id, CarBrand brandDetails) {
        CarBrand brand = getBrandById(id);
        
        brand.setName(brandDetails.getName());
        brand.setDisplayNameEn(brandDetails.getDisplayNameEn());
        brand.setDisplayNameAr(brandDetails.getDisplayNameAr());
        brand.setIsActive(brandDetails.getIsActive());
        // Don't update slug as it should be immutable for URL stability
        
        log.info("Updated car brand with id: {}", id);
        return carBrandRepository.save(brand);
    }
    
    /**
     * Change activation status of a brand
     * @param id Brand ID
     * @param isActive New activation status
     * @return Updated brand
     */
    @Transactional
    @CacheEvict(value = {"carBrands", "activeBrands"}, allEntries = true)
    public CarBrand updateBrandActivation(Long id, boolean isActive) {
        CarBrand brand = getBrandById(id);
        brand.setIsActive(isActive);
        
        log.info("Updated activation status of brand with id: {} to: {}", id, isActive);
        return carBrandRepository.save(brand);
    }
    
    /**
     * Delete a car brand
     * @param id Brand ID
     */
    @Transactional
    @CacheEvict(value = "carBrands", key = "#id")
    public void deleteBrand(Long id) {
        CarBrand brand = getBrandById(id);
        log.info("Deleting car brand with id: {}", id);
        carBrandRepository.delete(brand);
    }
}
