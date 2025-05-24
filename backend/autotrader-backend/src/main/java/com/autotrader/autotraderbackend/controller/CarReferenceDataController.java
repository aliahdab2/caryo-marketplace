package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.payload.response.CarReferenceDataResponse; // Added import
import com.autotrader.autotraderbackend.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List; // Removed java.util.Map and java.util.HashMap imports as they are no longer needed.

@RestController
@RequestMapping("/api/reference-data")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Car Reference Data", description = "Combined endpoint for all car-related reference data")
public class CarReferenceDataController {

    private final CarConditionService carConditionService;
    private final DriveTypeService driveTypeService;
    private final BodyStyleService bodyStyleService;
    private final FuelTypeService fuelTypeService;
    private final TransmissionService transmissionService;
    private final SellerTypeService sellerTypeService;
    private final CarBrandService carBrandService;
    private final CarModelService carModelService;

    @GetMapping
    @Operation(
        summary = "Get all car reference data",
        description = "Returns all car-related reference data in a single request. This includes car conditions, drive types, body styles, fuel types, transmissions, and seller types.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Reference data retrieved successfully")
        }
    )
    public ResponseEntity<CarReferenceDataResponse> getAllReferenceData() { // Changed return type
        log.debug("Request received to get all car reference data");
        
        List<CarCondition> carConditions = carConditionService.getAllConditions();
        List<DriveType> driveTypes = driveTypeService.getAllDriveTypes();
        List<BodyStyle> bodyStyles = bodyStyleService.getAllBodyStyles();
        List<FuelType> fuelTypes = fuelTypeService.getAllFuelTypes();
        List<Transmission> transmissions = transmissionService.getAllTransmissions();
        List<SellerType> sellerTypes = sellerTypeService.getAllSellerTypes();
        
        CarReferenceDataResponse referenceData = new CarReferenceDataResponse(
            carConditions,
            driveTypes,
            bodyStyles,
            fuelTypes,
            transmissions,
            sellerTypes
        );
        
        log.debug("Returning all car reference data");
        return ResponseEntity.ok(referenceData);
    }
    
    @GetMapping("/brands")
    @Operation(
        summary = "Get all active car brands",
        description = "Returns a list of all active car brands. These can be used to populate dropdown lists in the UI.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of active car brands retrieved successfully")
        }
    )
    public ResponseEntity<List<CarBrand>> getAllActiveBrands() {
        log.debug("Request received to get all active car brands");
        List<CarBrand> brands = carBrandService.getActiveBrands();
        log.debug("Returning {} active car brands", brands.size());
        return ResponseEntity.ok(brands);
    }
    
    @GetMapping("/brands/{brandId}/models")
    @Operation(
        summary = "Get all active car models for a specific brand",
        description = "Returns a list of all active car models belonging to the specified brand ID. These can be used to populate dependent dropdown lists in the UI.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of active car models retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Brand not found")
        }
    )
    public ResponseEntity<List<CarModel>> getActiveModelsByBrand(
            @Parameter(description = "ID of the car brand", required = true) 
            @PathVariable Long brandId) {
        log.debug("Request received to get active car models for brand ID: {}", brandId);
        List<CarModel> models = carModelService.getActiveModelsByBrandId(brandId);
        log.debug("Returning {} active car models for brand ID: {}", models.size(), brandId);
        return ResponseEntity.ok(models);
    }
}
