package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.Transmission;
import com.autotrader.autotraderbackend.repository.TransmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling transmission operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransmissionService {

    private final TransmissionRepository transmissionRepository;

    /**
     * Get all transmissions
     * @return List of all transmissions
     */
    public List<Transmission> getAllTransmissions() {
        return transmissionRepository.findAll();
    }
    
    /**
     * Get a transmission by its ID
     * @param id Transmission ID
     * @return Transmission
     * @throws ResourceNotFoundException if transmission not found
     */
    public Transmission getTransmissionById(Long id) {
        return transmissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transmission", "id", id));
    }
    
    /**
     * Get a transmission by its name
     * @param name Transmission name
     * @return Transmission
     * @throws ResourceNotFoundException if transmission not found
     */
    public Transmission getTransmissionByName(String name) {
        return transmissionRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Transmission", "name", name));
    }
    
    /**
     * Search for transmissions by name (in English or Arabic)
     * @param query Search query
     * @return List of matching transmissions
     */
    public List<Transmission> searchTransmissions(String query) {
        if (query == null || query.trim().isEmpty()) {
            return transmissionRepository.findAll();
        }
        return transmissionRepository.searchByName(query);
    }
    
    /**
     * Create a new transmission
     * @param transmission Transmission to create
     * @return Created transmission
     */
    @Transactional
    public Transmission createTransmission(Transmission transmission) {
        log.info("Creating new transmission: {}", transmission.getName());
        return transmissionRepository.save(transmission);
    }
    
    /**
     * Update an existing transmission
     * @param id Transmission ID
     * @param transmissionDetails Updated transmission details
     * @return Updated transmission
     * @throws ResourceNotFoundException if transmission not found
     */
    @Transactional
    public Transmission updateTransmission(Long id, Transmission transmissionDetails) {
        Transmission transmission = getTransmissionById(id);
        
        transmission.setName(transmissionDetails.getName());
        transmission.setDisplayNameEn(transmissionDetails.getDisplayNameEn());
        transmission.setDisplayNameAr(transmissionDetails.getDisplayNameAr());
        
        log.info("Updated transmission with id: {}", id);
        return transmissionRepository.save(transmission);
    }
    
    /**
     * Delete a transmission
     * @param id Transmission ID
     */
    @Transactional
    public void deleteTransmission(Long id) {
        Transmission transmission = getTransmissionById(id);
        log.info("Deleting transmission with id: {}", id);
        transmissionRepository.delete(transmission);
    }
}
