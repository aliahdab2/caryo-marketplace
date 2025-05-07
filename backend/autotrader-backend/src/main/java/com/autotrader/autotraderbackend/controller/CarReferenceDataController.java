package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    @GetMapping
    @Operation(
        summary = "Get all car reference data",
        description = "Returns all car-related reference data in a single request. This includes car conditions, drive types, body styles, fuel types, transmissions, and seller types.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Reference data retrieved successfully")
        }
    )
    public ResponseEntity<Map<String, Object>> getAllReferenceData() {
        log.debug("Request received to get all car reference data");
        
        Map<String, Object> referenceData = new HashMap<>();
        
        List<CarCondition> carConditions = carConditionService.getAllConditions();
        List<DriveType> driveTypes = driveTypeService.getAllDriveTypes();
        List<BodyStyle> bodyStyles = bodyStyleService.getAllBodyStyles();
        List<FuelType> fuelTypes = fuelTypeService.getAllFuelTypes();
        List<Transmission> transmissions = transmissionService.getAllTransmissions();
        List<SellerType> sellerTypes = sellerTypeService.getAllSellerTypes();
        
        referenceData.put("carConditions", carConditions);
        referenceData.put("driveTypes", driveTypes);
        referenceData.put("bodyStyles", bodyStyles);
        referenceData.put("fuelTypes", fuelTypes);
        referenceData.put("transmissions", transmissions);
        referenceData.put("sellerTypes", sellerTypes);
        
        log.debug("Returning all car reference data");
        return ResponseEntity.ok(referenceData);
    }
}
