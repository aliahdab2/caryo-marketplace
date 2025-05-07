package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.CarTrim;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling complex filtering operations across car reference entities
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarReferenceFilterService {

    private final CarBrandService carBrandService;
    private final CarModelService carModelService;
    private final CarTrimService carTrimService;

    /**
     * Get hierarchical data for car selection filters
     * @return List of brands with their models and trims (only active ones)
     */
    public List<CarBrand> getActiveCarHierarchy() {
        List<CarBrand> activeBrands = carBrandService.getActiveBrands();
        
        // For each brand, populate its active models
        for (CarBrand brand : activeBrands) {
            List<CarModel> activeModels = carModelService.getActiveModelsByBrandId(brand.getId());
            
            // For each model, populate its active trims
            for (CarModel model : activeModels) {
                List<CarTrim> activeTrims = carTrimService.getActiveTrimsByModelId(model.getId());
                model.setTrims(activeTrims);
            }
            
            brand.setModels(activeModels);
        }
        
        return activeBrands;
    }
    
    /**
     * Search for car brands, models, and trims by name
     * @param query Search query
     * @return List of matching brands with their matching models and trims
     */
    public List<CarBrand> searchCarHierarchy(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getActiveCarHierarchy();
        }
        
        // Search brands
        List<CarBrand> matchingBrands = carBrandService.searchBrands(query);
        
        // Search models 
        List<CarModel> matchingModels = carModelService.searchModels(query);
        
        // Search trims
        List<CarTrim> matchingTrims = carTrimService.searchTrims(query);
        
        // Combine results into a hierarchical structure
        return buildHierarchicalResult(matchingBrands, matchingModels, matchingTrims);
    }
    
    /**
     * Build a hierarchical structure from matching entities
     * @param matchingBrands Matching brands
     * @param matchingModels Matching models
     * @param matchingTrims Matching trims
     * @return Hierarchical structure of matching entities
     */
    private List<CarBrand> buildHierarchicalResult(
            List<CarBrand> matchingBrands, 
            List<CarModel> matchingModels,
            List<CarTrim> matchingTrims) {
        
        // Make copies to avoid modifying the original entities
        List<CarBrand> result = matchingBrands.stream()
                .map(this::copyBrandWithoutRelations)
                .collect(Collectors.toList());
        
        // Add brands that have matching models but weren't matched themselves
        for (CarModel model : matchingModels) {
            CarBrand parentBrand = model.getBrand();
            
            // Check if this brand is already in our result
            boolean brandExists = result.stream()
                    .anyMatch(b -> b.getId().equals(parentBrand.getId()));
            
            if (!brandExists) {
                result.add(copyBrandWithoutRelations(parentBrand));
            }
        }
        
        // Add brands that have matching trims but weren't matched themselves
        for (CarTrim trim : matchingTrims) {
            CarModel parentModel = trim.getModel();
            CarBrand parentBrand = parentModel.getBrand();
            
            // Check if this brand is already in our result
            boolean brandExists = result.stream()
                    .anyMatch(b -> b.getId().equals(parentBrand.getId()));
            
            if (!brandExists) {
                result.add(copyBrandWithoutRelations(parentBrand));
            }
        }
        
        // For each brand in our result, add matching models
        for (CarBrand brand : result) {
            // Add models that match this brand
            List<CarModel> brandModels = matchingModels.stream()
                    .filter(m -> m.getBrand().getId().equals(brand.getId()))
                    .map(this::copyModelWithoutRelations)
                    .collect(Collectors.toList());
            
            // Add models that have matching trims but weren't matched themselves
            for (CarTrim trim : matchingTrims) {
                CarModel parentModel = trim.getModel();
                
                if (parentModel.getBrand().getId().equals(brand.getId())) {
                    boolean modelExists = brandModels.stream()
                            .anyMatch(m -> m.getId().equals(parentModel.getId()));
                    
                    if (!modelExists) {
                        brandModels.add(copyModelWithoutRelations(parentModel));
                    }
                }
            }
            
            brand.setModels(brandModels);
            
            // For each model, add matching trims
            for (CarModel model : brandModels) {
                List<CarTrim> modelTrims = matchingTrims.stream()
                        .filter(t -> t.getModel().getId().equals(model.getId()))
                        .map(this::copyTrimWithoutRelations)
                        .collect(Collectors.toList());
                
                model.setTrims(modelTrims);
            }
        }
        
        return result;
    }
    
    // Helper methods to create copies without circular references
    
    private CarBrand copyBrandWithoutRelations(CarBrand brand) {
        CarBrand copy = new CarBrand();
        copy.setId(brand.getId());
        copy.setName(brand.getName());
        copy.setSlug(brand.getSlug());
        copy.setDisplayNameEn(brand.getDisplayNameEn());
        copy.setDisplayNameAr(brand.getDisplayNameAr());
        copy.setIsActive(brand.getIsActive());
        copy.setModels(Collections.emptyList());  // Will be populated later if needed
        return copy;
    }
    
    private CarModel copyModelWithoutRelations(CarModel model) {
        CarModel copy = new CarModel();
        copy.setId(model.getId());
        copy.setName(model.getName());
        copy.setSlug(model.getSlug());
        copy.setDisplayNameEn(model.getDisplayNameEn());
        copy.setDisplayNameAr(model.getDisplayNameAr());
        copy.setIsActive(model.getIsActive());
        copy.setTrims(Collections.emptyList());  // Will be populated later if needed
        // Don't set brand to avoid circular reference
        return copy;
    }
    
    private CarTrim copyTrimWithoutRelations(CarTrim trim) {
        CarTrim copy = new CarTrim();
        copy.setId(trim.getId());
        copy.setName(trim.getName());
        copy.setDisplayNameEn(trim.getDisplayNameEn());
        copy.setDisplayNameAr(trim.getDisplayNameAr());
        copy.setIsActive(trim.getIsActive());
        // Don't set model to avoid circular reference
        return copy;
    }
}
