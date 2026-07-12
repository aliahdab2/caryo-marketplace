package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.DriveType;
import com.caryo.marketplace.repository.DriveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling drive type operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DriveTypeService {

    private final DriveTypeRepository driveTypeRepository;

    /**
     * Get all drive types
     * @return List of all drive types
     */
    @Cacheable(value = "driveTypes", key = "'all'")
    public List<DriveType> getAllDriveTypes() {
        return driveTypeRepository.findAll();
    }

    /**
     * Get a drive type by its ID
     * @param id Drive type ID
     * @return Drive type
     * @throws ResourceNotFoundException if drive type not found
     */
    @Cacheable(value = "driveTypes", key = "#id")
    public DriveType getDriveTypeById(Long id) {
        return driveTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DriveType", "id", id));
    }

    /**
     * Get a drive type by its name
     * @param name Drive type name
     * @return Drive type
     * @throws ResourceNotFoundException if drive type not found
     */
    @Cacheable(value = "driveTypes", key = "'name:' + #name.toLowerCase()")
    public DriveType getDriveTypeByName(String name) {
        return driveTypeRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("DriveType", "name", name));
    }

    /**
     * Search for drive types by name (in English or Arabic)
     * @param query Search query
     * @return List of matching drive types
     */
    public List<DriveType> searchDriveTypes(String query) {
        if (query == null || query.trim().isEmpty()) {
            return driveTypeRepository.findAll();
        }
        return driveTypeRepository.searchByName(query);
    }

    /**
     * Create a new drive type
     * @param driveType Drive type to create
     * @return Created drive type
     */
    @Transactional
    @CacheEvict(value = "driveTypes", allEntries = true)
    public DriveType createDriveType(DriveType driveType) {
        log.info("Creating new drive type: {}", driveType.getName());
        return driveTypeRepository.save(driveType);
    }

    /**
     * Update an existing drive type
     * @param id Drive type ID
     * @param driveTypeDetails Updated drive type details
     * @return Updated drive type
     * @throws ResourceNotFoundException if drive type not found
     */
    @Transactional
    @CacheEvict(value = "driveTypes", allEntries = true)
    public DriveType updateDriveType(Long id, DriveType driveTypeDetails) {
        DriveType driveType = getDriveTypeById(id);

        driveType.setName(driveTypeDetails.getName());
        driveType.setDisplayNameEn(driveTypeDetails.getDisplayNameEn());
        driveType.setDisplayNameAr(driveTypeDetails.getDisplayNameAr());

        log.info("Updated drive type with id: {}", id);
        return driveTypeRepository.save(driveType);
    }

    /**
     * Delete a drive type
     * @param id Drive type ID
     */
    @Transactional
    @CacheEvict(value = "driveTypes", allEntries = true)
    public void deleteDriveType(Long id) {
        DriveType driveType = getDriveTypeById(id);
        log.info("Deleting drive type with id: {}", id);
        driveTypeRepository.delete(driveType);
    }
}
