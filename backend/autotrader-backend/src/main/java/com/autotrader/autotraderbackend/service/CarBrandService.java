package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import com.autotrader.autotraderbackend.payload.request.UpdateBrandRequest;
import com.autotrader.autotraderbackend.payload.request.CreateBrandRequest;
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
    @Transactional(readOnly = true)
    @Cacheable(value = "activeBrands", key = "'active'")
    public List<CarBrand> getActiveBrands() {
        log.debug("Fetching active car brands from database");
        return carBrandRepository.findByIsActiveTrue();
    }
    
    /**
     * Get a car brand by its name
     * @param name Brand name
     * @return Car brand
     * @throws ResourceNotFoundException if brand not found
     */
    @Transactional(readOnly = true)
    public CarBrand getBrandByName(String name) {
        log.debug("Fetching car brand by name: {}", name);
        return carBrandRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("CarBrand", "name", name));
    }

    /**
     * Get a car brand by its ID
     * @param id Brand ID
     * @return Car brand
     * @throws ResourceNotFoundException if brand not found
     */
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public CarBrand getBrandBySlug(String slug) {
        return carBrandRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("CarBrand", "slug", slug));
    }
    
    /**
     * Search for brands by name (in English or Arabic)
     * @param query Search query
     * @return List of matching brands
     */
    @Transactional(readOnly = true)
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
     * Create a new car brand using request DTO
     * @param createRequest Brand creation details from request
     * @return Created brand
     */
    @Transactional
    @CacheEvict(value = {"carBrands", "activeBrands"}, allEntries = true)
    public CarBrand createBrand(CreateBrandRequest createRequest) {
        // Validate brand uniqueness
        validateBrandUniqueness(createRequest);
        
        CarBrand brand = new CarBrand();
        brand.setName(createRequest.getName());
        brand.setDisplayNameEn(createRequest.getDisplayNameEn());
        brand.setDisplayNameAr(createRequest.getDisplayNameAr());
        brand.setIsActive(true); // Admin-created brands are active by default
        
        // Generate unique slug from name
        String baseSlug = createRequest.getName().toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", ""); // Remove leading/trailing dashes
        
        String slug = baseSlug;
        int counter = 1;
        while (carBrandRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        brand.setSlug(slug);
        
        log.info("Creating new car brand using request DTO: {}", createRequest.getName());
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
        
        // Validation: Warn if trying to deactivate a brand that has active models
        if (!brandDetails.getIsActive() && brand.getIsActive()) {
            // Check if brand has active models (we'll need to inject CarModelService for this)
            log.warn("Attempting to deactivate brand '{}' - this may hide active models from users", 
                    brand.getDisplayNameEn());
        }
        
        brand.setName(brandDetails.getName());
        brand.setDisplayNameEn(brandDetails.getDisplayNameEn());
        brand.setDisplayNameAr(brandDetails.getDisplayNameAr());
        brand.setIsActive(brandDetails.getIsActive());
        // Don't update slug as it should be immutable for URL stability
        
        log.info("Updated car brand with id: {}", id);
        return carBrandRepository.save(brand);
    }
    
    /**
     * Update an existing car brand using request DTO
     * @param id Brand ID
     * @param updateRequest Updated brand details from request
     * @return Updated brand
     * @throws ResourceNotFoundException if brand not found
     */
    @Transactional
    @CacheEvict(value = {"carBrands", "activeBrands"}, allEntries = true)
    public CarBrand updateBrand(Long id, UpdateBrandRequest updateRequest) {
        CarBrand brand = getBrandById(id);
        
        brand.setName(updateRequest.getName());
        brand.setDisplayNameEn(updateRequest.getDisplayNameEn());
        brand.setDisplayNameAr(updateRequest.getDisplayNameAr());
        brand.setIsActive(updateRequest.getIsActive());
        // Don't update slug as it should be immutable for URL stability
        
        log.info("Updated car brand with id: {} using request DTO", id);
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
    @CacheEvict(value = {"carBrands", "activeBrands"}, allEntries = true)
    public void deleteBrand(Long id) {
        CarBrand brand = getBrandById(id);
        log.info("Deleting car brand with id: {}", id);
        carBrandRepository.delete(brand);
    }
    
    /**
     * Validate that a brand doesn't already exist
     */
    private void validateBrandUniqueness(CreateBrandRequest brandRequest) {
        String name = brandRequest.getName().trim();
        String displayNameEn = brandRequest.getDisplayNameEn().trim();
        String displayNameAr = brandRequest.getDisplayNameAr().trim();
        
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
     * Update brand status (ACTIVE, INACTIVE, PENDING)
     */
    public CarBrand updateBrandStatus(Long brandId, String status) {
        CarBrand brand = getBrandById(brandId);
        
        // Validate status
        if (!isValidStatus(status)) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Valid values are: ACTIVE, INACTIVE, PENDING");
        }
        
        boolean isActive = "ACTIVE".equalsIgnoreCase(status);
        brand.setIsActive(isActive);
        
        return carBrandRepository.save(brand);
    }

    /**
     * Get all pending brands (for admin approval)
     */
    public List<CarBrand> getPendingBrands() {
        // For now, we'll consider inactive brands as pending
        // In future, you might want to add a separate status field
        return carBrandRepository.findByIsActiveFalse();
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
     * Validates that a brand is active and can be used for new listings.
     * Industry best practice: Prevent NEW listings with inactive brands, but keep existing ones visible.
     */
    public void validateBrandActiveForNewListing(Long brandId) {
        CarBrand brand = getBrandById(brandId);
        if (!brand.getIsActive()) {
            throw new IllegalArgumentException("Cannot create new listings with inactive brand: " + brand.getDisplayNameEn() + 
                ". This brand is marked as discontinued or under review. Please contact support if you believe this is an error.");
        }
    }
}
