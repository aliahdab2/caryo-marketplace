package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.SellerType;
import com.autotrader.autotraderbackend.repository.SellerTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling seller type operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SellerTypeService {

    private final SellerTypeRepository sellerTypeRepository;

    /**
     * Get all seller types
     * @return List of all seller types
     */
    public List<SellerType> getAllSellerTypes() {
        return sellerTypeRepository.findAll();
    }
    
    /**
     * Get a seller type by its ID
     * @param id Seller type ID
     * @return Seller type
     * @throws ResourceNotFoundException if seller type not found
     */
    public SellerType getSellerTypeById(Long id) {
        return sellerTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SellerType", "id", id));
    }
    
    /**
     * Get a seller type by its name
     * @param name Seller type name
     * @return Seller type
     * @throws ResourceNotFoundException if seller type not found
     */
    public SellerType getSellerTypeByName(String name) {
        return sellerTypeRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("SellerType", "name", name));
    }
    
    /**
     * Search for seller types by name (in English or Arabic)
     * @param query Search query
     * @return List of matching seller types
     */
    public List<SellerType> searchSellerTypes(String query) {
        if (query == null || query.trim().isEmpty()) {
            return sellerTypeRepository.findAll();
        }
        return sellerTypeRepository.searchByName(query);
    }
    
    /**
     * Create a new seller type
     * @param sellerType Seller type to create
     * @return Created seller type
     */
    @Transactional
    public SellerType createSellerType(SellerType sellerType) {
        log.info("Creating new seller type: {}", sellerType.getName());
        return sellerTypeRepository.save(sellerType);
    }
    
    /**
     * Update an existing seller type
     * @param id Seller type ID
     * @param sellerTypeDetails Updated seller type details
     * @return Updated seller type
     * @throws ResourceNotFoundException if seller type not found
     */
    @Transactional
    public SellerType updateSellerType(Long id, SellerType sellerTypeDetails) {
        SellerType sellerType = getSellerTypeById(id);
        
        sellerType.setName(sellerTypeDetails.getName());
        sellerType.setDisplayNameEn(sellerTypeDetails.getDisplayNameEn());
        sellerType.setDisplayNameAr(sellerTypeDetails.getDisplayNameAr());
        
        log.info("Updated seller type with id: {}", id);
        return sellerTypeRepository.save(sellerType);
    }
    
    /**
     * Delete a seller type
     * @param id Seller type ID
     */
    @Transactional
    public void deleteSellerType(Long id) {
        SellerType sellerType = getSellerTypeById(id);
        log.info("Deleting seller type with id: {}", id);
        sellerTypeRepository.delete(sellerType);
    }
}
