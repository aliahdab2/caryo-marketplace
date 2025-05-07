package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for providing combined reference data for car listings
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarReferenceDataService {

    private final CarBrandService carBrandService;
    private final CarModelService carModelService;
    private final CarTrimService carTrimService;
    private final CarConditionService carConditionService;
    private final DriveTypeService driveTypeService;
    private final BodyStyleService bodyStyleService;
    private final FuelTypeService fuelTypeService;
    private final TransmissionService transmissionService;
    private final SellerTypeService sellerTypeService;
    private final CarReferenceFilterService carReferenceFilterService;

    /**
     * Get all reference data needed for car listings
     * @return Map containing all reference data categories
     */
    public Map<String, Object> getAllReferenceData() {
        Map<String, Object> referenceData = new HashMap<>();
        
        // Get hierarchical car data (brands, models, trims)
        List<CarBrand> carHierarchy = carReferenceFilterService.getActiveCarHierarchy();
        referenceData.put("carHierarchy", carHierarchy);
        
        // Get simple reference data lists
        referenceData.put("conditions", carConditionService.getAllConditions());
        referenceData.put("driveTypes", driveTypeService.getAllDriveTypes());
        referenceData.put("bodyStyles", bodyStyleService.getAllBodyStyles());
        referenceData.put("fuelTypes", fuelTypeService.getAllFuelTypes());
        referenceData.put("transmissions", transmissionService.getAllTransmissions());
        referenceData.put("sellerTypes", sellerTypeService.getAllSellerTypes());
        
        return referenceData;
    }
    
    /**
     * Get filtered reference data based on a search query
     * @param query Search query
     * @return Map containing filtered reference data categories
     */
    public Map<String, Object> searchReferenceData(String query) {
        Map<String, Object> referenceData = new HashMap<>();
        
        // Search hierarchical car data
        List<CarBrand> carHierarchy = carReferenceFilterService.searchCarHierarchy(query);
        referenceData.put("carHierarchy", carHierarchy);
        
        // Search simple reference data lists
        referenceData.put("conditions", carConditionService.searchConditions(query));
        referenceData.put("driveTypes", driveTypeService.searchDriveTypes(query));
        referenceData.put("bodyStyles", bodyStyleService.searchBodyStyles(query));
        referenceData.put("fuelTypes", fuelTypeService.searchFuelTypes(query));
        referenceData.put("transmissions", transmissionService.searchTransmissions(query));
        referenceData.put("sellerTypes", sellerTypeService.searchSellerTypes(query));
        
        return referenceData;
    }
    
    /**
     * Get only the basic car reference data (brands, models, trims)
     * @return Car hierarchy data
     */
    public List<CarBrand> getCarHierarchy() {
        return carReferenceFilterService.getActiveCarHierarchy();
    }
}
