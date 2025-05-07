package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.CarCondition;
import com.autotrader.autotraderbackend.repository.CarConditionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for handling car condition operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarConditionService {

    private final CarConditionRepository carConditionRepository;

    /**
     * Get all car conditions
     * @return List of all car conditions
     */
    public List<CarCondition> getAllConditions() {
        return carConditionRepository.findAll();
    }
    
    /**
     * Get a car condition by its ID
     * @param id Condition ID
     * @return Car condition
     * @throws ResourceNotFoundException if condition not found
     */
    public CarCondition getConditionById(Long id) {
        return carConditionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarCondition", "id", id));
    }
    
    /**
     * Get a car condition by its name
     * @param name Condition name
     * @return Car condition
     * @throws ResourceNotFoundException if condition not found
     */
    public CarCondition getConditionByName(String name) {
        return carConditionRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("CarCondition", "name", name));
    }
    
    /**
     * Search for car conditions by name (in English or Arabic)
     * @param query Search query
     * @return List of matching conditions
     */
    public List<CarCondition> searchConditions(String query) {
        if (query == null || query.trim().isEmpty()) {
            return carConditionRepository.findAll();
        }
        return carConditionRepository.searchByName(query);
    }
    
    /**
     * Create a new car condition
     * @param condition Condition to create
     * @return Created condition
     */
    @Transactional
    public CarCondition createCondition(CarCondition condition) {
        log.info("Creating new car condition: {}", condition.getName());
        return carConditionRepository.save(condition);
    }
    
    /**
     * Update an existing car condition
     * @param id Condition ID
     * @param conditionDetails Updated condition details
     * @return Updated condition
     * @throws ResourceNotFoundException if condition not found
     */
    @Transactional
    public CarCondition updateCondition(Long id, CarCondition conditionDetails) {
        CarCondition condition = getConditionById(id);
        
        condition.setName(conditionDetails.getName());
        condition.setDisplayNameEn(conditionDetails.getDisplayNameEn());
        condition.setDisplayNameAr(conditionDetails.getDisplayNameAr());
        
        log.info("Updated car condition with id: {}", id);
        return carConditionRepository.save(condition);
    }
    
    /**
     * Delete a car condition
     * @param id Condition ID
     */
    @Transactional
    public void deleteCondition(Long id) {
        CarCondition condition = getConditionById(id);
        log.info("Deleting car condition with id: {}", id);
        carConditionRepository.delete(condition);
    }
}
