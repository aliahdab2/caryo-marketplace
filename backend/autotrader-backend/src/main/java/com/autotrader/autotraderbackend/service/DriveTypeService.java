package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.DriveType;
import com.autotrader.autotraderbackend.repository.DriveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    public List<DriveType> getAllDriveTypes() {
        return driveTypeRepository.findAll();
    }
    
    /**
     * Get a drive type by its ID
     * @param id Drive type ID
     * @return Drive type
     * @throws ResourceNotFoundException if drive type not found
     */
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
    public void deleteDriveType(Long id) {
        DriveType driveType = getDriveTypeById(id);
        log.info("Deleting drive type with id: {}", id);
        driveTypeRepository.delete(driveType);
    }
}
