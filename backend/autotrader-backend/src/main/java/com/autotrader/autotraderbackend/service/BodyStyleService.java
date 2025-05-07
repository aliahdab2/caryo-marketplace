package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.BodyStyle;
import com.autotrader.autotraderbackend.repository.BodyStyleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling body style operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BodyStyleService {

    private final BodyStyleRepository bodyStyleRepository;

    /**
     * Get all body styles
     * @return List of all body styles
     */
    public List<BodyStyle> getAllBodyStyles() {
        return bodyStyleRepository.findAll();
    }
    
    /**
     * Get a body style by its ID
     * @param id Body style ID
     * @return Body style
     * @throws ResourceNotFoundException if body style not found
     */
    public BodyStyle getBodyStyleById(Long id) {
        return bodyStyleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BodyStyle", "id", id));
    }
    
    /**
     * Get a body style by its name
     * @param name Body style name
     * @return Body style
     * @throws ResourceNotFoundException if body style not found
     */
    public BodyStyle getBodyStyleByName(String name) {
        return bodyStyleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("BodyStyle", "name", name));
    }
    
    /**
     * Search for body styles by name (in English or Arabic)
     * @param query Search query
     * @return List of matching body styles
     */
    public List<BodyStyle> searchBodyStyles(String query) {
        if (query == null || query.trim().isEmpty()) {
            return bodyStyleRepository.findAll();
        }
        return bodyStyleRepository.searchByName(query);
    }
    
    /**
     * Create a new body style
     * @param bodyStyle Body style to create
     * @return Created body style
     */
    @Transactional
    public BodyStyle createBodyStyle(BodyStyle bodyStyle) {
        log.info("Creating new body style: {}", bodyStyle.getName());
        return bodyStyleRepository.save(bodyStyle);
    }
    
    /**
     * Update an existing body style
     * @param id Body style ID
     * @param bodyStyleDetails Updated body style details
     * @return Updated body style
     * @throws ResourceNotFoundException if body style not found
     */
    @Transactional
    public BodyStyle updateBodyStyle(Long id, BodyStyle bodyStyleDetails) {
        BodyStyle bodyStyle = getBodyStyleById(id);
        
        bodyStyle.setName(bodyStyleDetails.getName());
        bodyStyle.setDisplayNameEn(bodyStyleDetails.getDisplayNameEn());
        bodyStyle.setDisplayNameAr(bodyStyleDetails.getDisplayNameAr());
        
        log.info("Updated body style with id: {}", id);
        return bodyStyleRepository.save(bodyStyle);
    }
    
    /**
     * Delete a body style
     * @param id Body style ID
     */
    @Transactional
    public void deleteBodyStyle(Long id) {
        BodyStyle bodyStyle = getBodyStyleById(id);
        log.info("Deleting body style with id: {}", id);
        bodyStyleRepository.delete(bodyStyle);
    }
}
