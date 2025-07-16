package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceAlreadyExistsException;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.SellerType;
import com.autotrader.autotraderbackend.payload.request.SellerTypeRequest;
import com.autotrader.autotraderbackend.payload.response.SellerTypeResponse;
import com.autotrader.autotraderbackend.repository.SellerTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling seller type operations with enhanced caching and validation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SellerTypeService {

    private final SellerTypeRepository sellerTypeRepository;

    /**
     * Get all seller types ordered by English display name
     * @return List of all seller types
     */
    @Cacheable(value = "sellerTypes", key = "'all'")
    public List<SellerTypeResponse> getAllSellerTypes() {
        log.debug("Fetching all seller types");
        List<SellerType> sellerTypes = sellerTypeRepository.findAllOrderByDisplayNameEn();
        List<SellerTypeResponse> responses = sellerTypes.stream()
                .map(SellerTypeResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Retrieved {} seller types", responses.size());
        return responses;
    }
    
    /**
     * Get a seller type by its ID
     * @param id Seller type ID
     * @return Seller type response
     * @throws ResourceNotFoundException if seller type not found
     */
    @Cacheable(value = "sellerTypes", key = "#id")
    public SellerTypeResponse getSellerTypeById(Long id) {
        log.debug("Fetching seller type by ID: {}", id);
        SellerType sellerType = sellerTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerType", "id", id));
        return SellerTypeResponse.fromEntity(sellerType);
    }
    
    /**
     * Get a seller type entity by its ID (for internal use)
     * @param id Seller type ID
     * @return Seller type entity
     * @throws ResourceNotFoundException if seller type not found
     */
    @Cacheable(value = "sellerTypes", key = "'entity:' + #id")
    public SellerType getSellerTypeEntityById(Long id) {
        log.debug("Fetching seller type entity by ID: {}", id);
        return sellerTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerType", "id", id));
    }
    
    /**
     * Get a seller type by its name (case insensitive)
     * @param name Seller type name
     * @return Seller type response
     * @throws ResourceNotFoundException if seller type not found
     */
    @Cacheable(value = "sellerTypes", key = "'name:' + #name.toLowerCase()")
    public SellerTypeResponse getSellerTypeByName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Seller type name cannot be null or empty");
        }
        
        log.debug("Fetching seller type by name: {}", name);
        SellerType sellerType = sellerTypeRepository.findByNameIgnoreCase(name.trim())
                .orElseThrow(() -> new ResourceNotFoundException("SellerType", "name", name));
        return SellerTypeResponse.fromEntity(sellerType);
    }
    
    /**
     * Get a seller type entity by its name (for internal use)
     * @param name Seller type name
     * @return Seller type entity
     * @throws ResourceNotFoundException if seller type not found
     */
    public SellerType getSellerTypeEntityByName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Seller type name cannot be null or empty");
        }
        
        log.debug("Fetching seller type entity by name: {}", name);
        return sellerTypeRepository.findByNameIgnoreCase(name.trim())
                .orElseThrow(() -> new ResourceNotFoundException("SellerType", "name", name));
    }
    
    /**
     * Search for seller types by name (in English, Arabic, or system name)
     * @param query Search query
     * @return List of matching seller types
     */
    public List<SellerTypeResponse> searchSellerTypes(String query) {
        if (!StringUtils.hasText(query)) {
            log.debug("Empty search query, returning all seller types");
            return getAllSellerTypes();
        }
        
        log.debug("Searching seller types with query: {}", query);
        List<SellerType> results = sellerTypeRepository.searchByName(query.trim());
        List<SellerTypeResponse> responses = results.stream()
                .map(SellerTypeResponse::fromEntity)
                .collect(Collectors.toList());
        log.debug("Found {} seller types matching query: {}", responses.size(), query);
        return responses;
    }
    
    /**
     * Create a new seller type
     * @param request Seller type request
     * @return Created seller type response
     * @throws ResourceAlreadyExistsException if seller type with same name already exists
     */
    @Transactional
    @CacheEvict(value = "sellerTypes", allEntries = true)
    public SellerTypeResponse createSellerType(SellerTypeRequest request) {
        validateSellerTypeRequest(request);
        
        // Check for duplicate name
        if (sellerTypeRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new ResourceAlreadyExistsException("SellerType", "name", request.getName());
        }
        
        SellerType sellerType = SellerType.builder()
                .name(request.getName().trim().toUpperCase())
                .displayNameEn(request.getDisplayNameEn().trim())
                .displayNameAr(request.getDisplayNameAr().trim())
                .build();
        
        try {
            log.info("Creating new seller type: {}", sellerType.getName());
            SellerType savedSellerType = sellerTypeRepository.save(sellerType);
            log.info("Successfully created seller type with ID: {}", savedSellerType.getId());
            return SellerTypeResponse.fromEntity(savedSellerType);
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation while creating seller type: {}", e.getMessage());
            throw new ResourceAlreadyExistsException("SellerType", "name", request.getName());
        }
    }
    
    /**
     * Update an existing seller type
     * @param id Seller type ID
     * @param request Updated seller type request
     * @return Updated seller type response
     * @throws ResourceNotFoundException if seller type not found
     * @throws ResourceAlreadyExistsException if updated name conflicts with existing seller type
     */
    @Transactional
    @CacheEvict(value = "sellerTypes", allEntries = true)
    public SellerTypeResponse updateSellerType(Long id, SellerTypeRequest request) {
        validateSellerTypeRequest(request);
        
        SellerType sellerType = sellerTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerType", "id", id));
        
        String newName = request.getName().trim().toUpperCase();
        
        // Check for duplicate name (excluding current entity)
        if (!sellerType.getName().equalsIgnoreCase(newName) && 
            sellerTypeRepository.existsByNameIgnoreCase(newName)) {
            throw new ResourceAlreadyExistsException("SellerType", "name", newName);
        }
        
        sellerType.setName(newName);
        sellerType.setDisplayNameEn(request.getDisplayNameEn().trim());
        sellerType.setDisplayNameAr(request.getDisplayNameAr().trim());
        
        try {
            log.info("Updating seller type with ID: {}", id);
            SellerType updatedSellerType = sellerTypeRepository.save(sellerType);
            log.info("Successfully updated seller type with ID: {}", id);
            return SellerTypeResponse.fromEntity(updatedSellerType);
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation while updating seller type: {}", e.getMessage());
            throw new ResourceAlreadyExistsException("SellerType", "name", newName);
        }
    }
    
    /**
     * Delete a seller type
     * @param id Seller type ID
     * @throws ResourceNotFoundException if seller type not found
     */
    @Transactional
    @CacheEvict(value = "sellerTypes", allEntries = true)
    public void deleteSellerType(Long id) {
        SellerType sellerType = sellerTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerType", "id", id));
        
        log.info("Deleting seller type with ID: {}", id);
        sellerTypeRepository.delete(sellerType);
        log.info("Successfully deleted seller type with ID: {}", id);
    }
    
    /**
     * Check if a seller type exists by ID
     * @param id Seller type ID
     * @return true if exists, false otherwise
     */
    public boolean existsById(Long id) {
        return sellerTypeRepository.existsById(id);
    }
    
    /**
     * Validate seller type request
     * @param request Seller type request to validate
     * @throws IllegalArgumentException if validation fails
     */
    private void validateSellerTypeRequest(SellerTypeRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Seller type request cannot be null");
        }
        
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("Seller type name is required");
        }
        
        if (!StringUtils.hasText(request.getDisplayNameEn())) {
            throw new IllegalArgumentException("English display name is required");
        }
        
        if (!StringUtils.hasText(request.getDisplayNameAr())) {
            throw new IllegalArgumentException("Arabic display name is required");
        }
    }
}
