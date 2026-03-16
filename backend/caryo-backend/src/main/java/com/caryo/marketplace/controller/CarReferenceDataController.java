package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.*;
import com.caryo.marketplace.payload.response.CarReferenceDataResponse;
import com.caryo.marketplace.payload.response.CarBrandResponse;
import com.caryo.marketplace.payload.response.CarModelResponse;
import com.caryo.marketplace.payload.response.SellerTypeResponse;
import com.caryo.marketplace.payload.request.UpdateBrandRequest;
import com.caryo.marketplace.payload.request.UpdateModelRequest;
import com.caryo.marketplace.payload.request.CreateBrandRequest;
import com.caryo.marketplace.payload.request.CreateModelRequest;
import com.caryo.marketplace.payload.request.CreateBrandWithModelRequest;
import com.caryo.marketplace.service.CarDataManagementService;
import com.caryo.marketplace.service.*;
import com.caryo.marketplace.service.BrandModelStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/reference-data")
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
    private final CarDataManagementService carDataManagementService;
    private final BrandModelStatusService brandModelStatusService;

    @GetMapping
    @Operation(
        summary = "Get all car reference data",
        description = "Returns all car-related reference data in a single request. This includes car conditions, drive types, body styles, fuel types, transmissions, and seller types.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Reference data retrieved successfully")
        }
    )
    public ResponseEntity<CarReferenceDataResponse> getAllReferenceData() {
        log.debug("Request received to get all car reference data");

        List<CarCondition> carConditions = carConditionService.getAllConditions();
        List<DriveType> driveTypes = driveTypeService.getAllDriveTypes();
        List<BodyStyle> bodyStyles = bodyStyleService.getAllBodyStyles();
        List<FuelType> fuelTypes = fuelTypeService.getAllFuelTypes();
        List<Transmission> transmissions = transmissionService.getAllTransmissions();
        List<SellerTypeResponse> sellerTypes = sellerTypeService.getAllSellerTypes();

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
    public ResponseEntity<List<CarBrandResponse>> getAllActiveBrands() {
        log.debug("Request received to get all active car brands");
        List<CarBrand> brands = carBrandService.getActiveBrands();

        // Convert entities to DTOs to prevent lazy initialization issues
        List<CarBrandResponse> brandResponses = brands.stream()
            .map(CarBrandResponse::fromEntity)
            .collect(Collectors.toList());

        log.debug("Returning {} active car brands", brandResponses.size());
        return ResponseEntity.ok(brandResponses);
    }

    @GetMapping("/models")
    @Operation(
        summary = "Get all car models",
        description = "Returns a list of all car models in the system. Primarily used for admin data management purposes.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of all car models retrieved successfully")
        }
    )
    public ResponseEntity<List<CarModelResponse>> getAllModels() {
        log.debug("Request received to get all car models");
        List<CarModel> models = carModelService.getAllModels();

        // Convert entities to DTOs and filter out models without valid brand relationships
        List<CarModelResponse> modelResponses = models.stream()
            .filter(model -> model.getBrand() != null) // Only include models with valid brands
            .map(CarModelResponse::fromEntity)
            .collect(Collectors.toList());

        log.debug("Returning {} car models (filtered from {} total)", modelResponses.size(), models.size());
        return ResponseEntity.ok(modelResponses);
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
    public ResponseEntity<List<CarModelResponse>> getActiveModelsByBrand(
            @Parameter(description = "ID of the car brand", required = true)
            @PathVariable Long brandId) {
        log.debug("Request received to get active car models for brand ID: {}", brandId);
        List<CarModel> models = carModelService.getActiveModelsByBrandId(brandId);

        // Convert entities to DTOs to prevent lazy initialization issues
        List<CarModelResponse> modelResponses = models.stream()
            .map(CarModelResponse::fromEntity)
            .collect(Collectors.toList());

        log.debug("Returning {} active car models for brand ID: {}", modelResponses.size(), brandId);
        return ResponseEntity.ok(modelResponses);
    }

    @PostMapping("/brands")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create new car brand (Admin Only)",
        description = "Create a new car brand with English and Arabic names. Only administrators can create brands manually.",
        responses = {
            @ApiResponse(responseCode = "201", description = "Brand created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid brand data"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
        }
    )
    public ResponseEntity<CarBrandResponse> createBrand(
            @Valid @RequestBody CreateBrandRequest createRequest) {
        log.debug("Request received to create new brand: {}", createRequest);

        CarBrand createdBrand = carBrandService.createBrand(createRequest);
        CarBrandResponse response = CarBrandResponse.fromEntity(createdBrand);

        log.debug("Brand created successfully: {}", response);
        return ResponseEntity.status(201).body(response);
    }

    @PostMapping("/brands-with-model")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create new car brand with model (Admin Only)",
        description = "Create a new car brand with its first model atomically. Only administrators can create brands manually.",
        responses = {
            @ApiResponse(responseCode = "201", description = "Brand and model created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid brand or model data"),
            @ApiResponse(responseCode = "409", description = "Brand or model already exists")
        }
    )
    public ResponseEntity<CarDataManagementService.BrandWithModelResponse> createBrandWithModel(
            @Valid @RequestBody CreateBrandWithModelRequest createRequest) {
        log.debug("Request received to create new brand with model: {}", createRequest);

        CarDataManagementService.BrandWithModelResponse response =
            carDataManagementService.createBrandWithModel(createRequest);

        log.debug("Brand with model created successfully: brand={}, model={}",
                response.getBrand().getName(), response.getModel().getName());
        return ResponseEntity.status(201).body(response);
    }

    @PostMapping("/models")
    @Operation(
        summary = "Create new car model",
        description = "Create a new car model with English and Arabic names for a specific brand",
        responses = {
            @ApiResponse(responseCode = "201", description = "Model created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid model data"),
            @ApiResponse(responseCode = "404", description = "Brand not found")
        }
    )
    public ResponseEntity<CarModelResponse> createModel(
            @Valid @RequestBody CreateModelRequest createRequest) {
        log.debug("Request received to create new model: {}", createRequest);

        CarModel createdModel = carModelService.createModel(createRequest);
        CarModelResponse response = CarModelResponse.fromEntity(createdModel);

        log.debug("Model created successfully: {}", response);
        return ResponseEntity.status(201).body(response);
    }

    @PutMapping("/brands/{brandId}")
    @Operation(
        summary = "Update car brand",
        description = "Update an existing car brand's information including names and status",
        responses = {
            @ApiResponse(responseCode = "200", description = "Brand updated successfully"),
            @ApiResponse(responseCode = "404", description = "Brand not found"),
            @ApiResponse(responseCode = "400", description = "Invalid brand data")
        }
    )
    public ResponseEntity<CarBrandResponse> updateBrand(
            @Parameter(description = "ID of the car brand", required = true)
            @PathVariable Long brandId,
            @Valid @RequestBody UpdateBrandRequest updateRequest) {
        log.debug("Request received to update brand ID: {} with data: {}", brandId, updateRequest);

        CarBrand updatedBrand = carBrandService.updateBrand(brandId, updateRequest);
        CarBrandResponse response = CarBrandResponse.fromEntity(updatedBrand);

        log.debug("Brand updated successfully: {}", response);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/models/{modelId}")
    @Operation(
        summary = "Update car model",
        description = "Update an existing car model's information including names and status",
        responses = {
            @ApiResponse(responseCode = "200", description = "Model updated successfully"),
            @ApiResponse(responseCode = "404", description = "Model not found"),
            @ApiResponse(responseCode = "400", description = "Invalid model data")
        }
    )
    public ResponseEntity<CarModelResponse> updateModel(
            @Parameter(description = "ID of the car model", required = true)
            @PathVariable Long modelId,
            @Valid @RequestBody UpdateModelRequest updateRequest) {
        log.debug("Request received to update model ID: {} with data: {}", modelId, updateRequest);

        CarModel updatedModel = carModelService.updateModel(modelId, updateRequest);
        CarModelResponse response = CarModelResponse.fromEntity(updatedModel);

        log.debug("Model updated successfully: {}", response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/brands/{brandId}/status-impact")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Check impact of brand status change (Admin Only)",
        description = "Check how many active listings would be affected if this brand is deactivated. Use this before deactivating brands to understand the impact.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Impact analysis completed"),
            @ApiResponse(responseCode = "404", description = "Brand not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
        }
    )
    public ResponseEntity<BrandModelStatusService.StatusChangeImpact> checkBrandStatusImpact(
            @Parameter(description = "ID of the car brand", required = true)
            @PathVariable Long brandId) {
        log.debug("Request received to check brand deactivation impact: brandId={}", brandId);

        BrandModelStatusService.StatusChangeImpact impact = brandModelStatusService.checkBrandDeactivationImpact(brandId);

        log.debug("Brand impact analysis completed: {} listings affected, severity: {}",
                impact.getAffectedListingsCount(), impact.getSeverityLevel());
        return ResponseEntity.ok(impact);
    }

    @PutMapping("/brands/{brandId}/status")
    @Operation(
        summary = "Update car brand status",
        description = "Update the status of a car brand (ACTIVE, INACTIVE, PENDING). WARNING: Deactivating a brand will immediately hide all its listings from users. Check impact first using GET /brands/{brandId}/status-impact",
        responses = {
            @ApiResponse(responseCode = "200", description = "Brand status updated successfully"),
            @ApiResponse(responseCode = "404", description = "Brand not found"),
            @ApiResponse(responseCode = "400", description = "Invalid status value")
        }
    )
    public ResponseEntity<CarBrandResponse> updateBrandStatus(
            @Parameter(description = "ID of the car brand", required = true)
            @PathVariable Long brandId,
            @Parameter(description = "New status for the brand", required = true)
            @RequestParam String status) {
        log.debug("Request received to update brand ID: {} to status: {}", brandId, status);

        // Log impact warning for deactivation
        if ("false".equalsIgnoreCase(status) || "inactive".equalsIgnoreCase(status)) {
            BrandModelStatusService.StatusChangeImpact impact = brandModelStatusService.checkBrandDeactivationImpact(brandId);
            log.warn("BRAND DEACTIVATION WARNING: {} active listings will be hidden from users. Impact severity: {}",
                    impact.getAffectedListingsCount(), impact.getSeverityLevel());
        }

        CarBrand updatedBrand = carBrandService.updateBrandStatus(brandId, status);
        CarBrandResponse response = CarBrandResponse.fromEntity(updatedBrand);

        log.debug("Brand status updated successfully: {}", response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/models/{modelId}/status-impact")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Check impact of model status change (Admin Only)",
        description = "Check how many active listings would be affected if this model is deactivated. Use this before deactivating models to understand the impact.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Impact analysis completed"),
            @ApiResponse(responseCode = "404", description = "Model not found"),
            @ApiResponse(responseCode = "403", description = "Access denied - Admin role required")
        }
    )
    public ResponseEntity<BrandModelStatusService.StatusChangeImpact> checkModelStatusImpact(
            @Parameter(description = "ID of the car model", required = true)
            @PathVariable Long modelId) {
        log.debug("Request received to check model deactivation impact: modelId={}", modelId);

        BrandModelStatusService.StatusChangeImpact impact = brandModelStatusService.checkModelDeactivationImpact(modelId);

        log.debug("Model impact analysis completed: {} listings affected, severity: {}",
                impact.getAffectedListingsCount(), impact.getSeverityLevel());
        return ResponseEntity.ok(impact);
    }

    @PutMapping("/models/{modelId}/status")
    @Operation(
        summary = "Update car model status",
        description = "Update the status of a car model (ACTIVE, INACTIVE, PENDING). WARNING: Deactivating a model will immediately hide all its listings from users. Check impact first using GET /models/{modelId}/status-impact",
        responses = {
            @ApiResponse(responseCode = "200", description = "Model status updated successfully"),
            @ApiResponse(responseCode = "404", description = "Model not found"),
            @ApiResponse(responseCode = "400", description = "Invalid status value")
        }
    )
    public ResponseEntity<CarModelResponse> updateModelStatus(
            @Parameter(description = "ID of the car model", required = true)
            @PathVariable Long modelId,
            @Parameter(description = "New status for the model", required = true)
            @RequestParam String status) {
        log.debug("Request received to update model ID: {} to status: {}", modelId, status);

        // Log impact warning for deactivation
        if ("false".equalsIgnoreCase(status) || "inactive".equalsIgnoreCase(status)) {
            BrandModelStatusService.StatusChangeImpact impact = brandModelStatusService.checkModelDeactivationImpact(modelId);
            log.warn("MODEL DEACTIVATION WARNING: {} active listings will be hidden from users. Impact severity: {}",
                    impact.getAffectedListingsCount(), impact.getSeverityLevel());
        }

        CarModel updatedModel = carModelService.updateModelStatus(modelId, status);
        CarModelResponse response = CarModelResponse.fromEntity(updatedModel);

        log.debug("Model status updated successfully: {}", response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/brands/pending")
    @Operation(
        summary = "Get pending car brands",
        description = "Returns all car brands that are pending admin approval",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of pending car brands retrieved successfully")
        }
    )
    public ResponseEntity<List<CarBrandResponse>> getPendingBrands() {
        log.debug("Request received to get pending car brands");

        List<CarBrand> pendingBrands = carBrandService.getPendingBrands();
        List<CarBrandResponse> brandResponses = pendingBrands.stream()
                .map(CarBrandResponse::fromEntity)
                .toList();

        log.debug("Returning {} pending car brands", brandResponses.size());
        return ResponseEntity.ok(brandResponses);
    }

    @GetMapping("/models/pending")
    @Operation(
        summary = "Get pending car models",
        description = "Returns all car models that are pending admin approval",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of pending car models retrieved successfully")
        }
    )
    public ResponseEntity<List<CarModelResponse>> getPendingModels() {
        log.debug("Request received to get pending car models");

        List<CarModel> pendingModels = carModelService.getPendingModels();
        List<CarModelResponse> modelResponses = pendingModels.stream()
                .map(CarModelResponse::fromEntity)
                .toList();

        log.debug("Returning {} pending car models", modelResponses.size());
        return ResponseEntity.ok(modelResponses);
    }
}
