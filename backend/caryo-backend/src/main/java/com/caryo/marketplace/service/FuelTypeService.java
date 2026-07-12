package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.FuelType;
import com.caryo.marketplace.repository.FuelTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling fuel type operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FuelTypeService {

    private final FuelTypeRepository fuelTypeRepository;

    /**
     * Get all fuel types
     * @return List of all fuel types
     */
    @Cacheable(value = "fuelTypes", key = "'all'")
    public List<FuelType> getAllFuelTypes() {
        return fuelTypeRepository.findAll();
    }

    /**
     * Get a fuel type by its ID
     * @param id Fuel type ID
     * @return Fuel type
     * @throws ResourceNotFoundException if fuel type not found
     */
    @Cacheable(value = "fuelTypes", key = "#id")
    public FuelType getFuelTypeById(Long id) {
        return fuelTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("FuelType", "id", id));
    }

    /**
     * Get a fuel type by its name
     * @param name Fuel type name
     * @return Fuel type
     * @throws ResourceNotFoundException if fuel type not found
     */
    @Cacheable(value = "fuelTypes", key = "'name:' + #name.toLowerCase()")
    public FuelType getFuelTypeByName(String name) {
        return fuelTypeRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("FuelType", "name", name));
    }

    /**
     * Search for fuel types by name (in English or Arabic)
     * @param query Search query
     * @return List of matching fuel types
     */
    public List<FuelType> searchFuelTypes(String query) {
        if (query == null || query.trim().isEmpty()) {
            return fuelTypeRepository.findAll();
        }
        return fuelTypeRepository.searchByName(query);
    }

    /**
     * Create a new fuel type
     * @param fuelType Fuel type to create
     * @return Created fuel type
     */
    @Transactional
    @CacheEvict(value = "fuelTypes", allEntries = true)
    public FuelType createFuelType(FuelType fuelType) {
        log.info("Creating new fuel type: {}", fuelType.getName());
        return fuelTypeRepository.save(fuelType);
    }

    /**
     * Update an existing fuel type
     * @param id Fuel type ID
     * @param fuelTypeDetails Updated fuel type details
     * @return Updated fuel type
     * @throws ResourceNotFoundException if fuel type not found
     */
    @Transactional
    @CacheEvict(value = "fuelTypes", allEntries = true)
    public FuelType updateFuelType(Long id, FuelType fuelTypeDetails) {
        FuelType fuelType = getFuelTypeById(id);

        fuelType.setName(fuelTypeDetails.getName());
        fuelType.setDisplayNameEn(fuelTypeDetails.getDisplayNameEn());
        fuelType.setDisplayNameAr(fuelTypeDetails.getDisplayNameAr());

        log.info("Updated fuel type with id: {}", id);
        return fuelTypeRepository.save(fuelType);
    }

    /**
     * Delete a fuel type
     * @param id Fuel type ID
     */
    @Transactional
    @CacheEvict(value = "fuelTypes", allEntries = true)
    public void deleteFuelType(Long id) {
        FuelType fuelType = getFuelTypeById(id);
        log.info("Deleting fuel type with id: {}", id);
        fuelTypeRepository.delete(fuelType);
    }
}
