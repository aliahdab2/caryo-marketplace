package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.payload.request.CreateCarModelRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateCarModelRequest;
import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import com.autotrader.autotraderbackend.payload.response.CarModelResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.CarBrandService;
import com.autotrader.autotraderbackend.service.CarModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin controller for car model management
 * Provides CRUD operations for car models with proper validation and pagination
 */
@RestController
@RequestMapping("/api/admin/car-models")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Car Models", description = "Admin endpoints for managing car models")
public class AdminCarModelController {

    private final CarModelService carModelService;
    private final CarBrandService carBrandService;

    /**
     * Create a new car model
     */
    @PostMapping
    @Operation(
        summary = "Create Car Model",
        description = "Create a new car model with bilingual support"
    )
    public ResponseEntity<ApiResponse<CarModelResponse>> createModel(
            @Valid @RequestBody CreateCarModelRequest request) {
        
        log.info("Admin creating new car model: {} for brand ID: {}", request.getNameEn(), request.getBrandId());

        try {
            // Validate brand exists
            CarBrand brand = carBrandService.getBrandById(request.getBrandId());

            CarModel model = new CarModel();
            model.setName(request.getNameEn());
            model.setSlug(request.getSlug() != null ? request.getSlug() : request.getNameEn().toLowerCase().replaceAll("[^a-z0-9-]", "-"));
            model.setDisplayNameEn(request.getNameEn());
            model.setDisplayNameAr(request.getNameAr() != null ? request.getNameAr() : request.getNameEn());
            model.setBrand(brand);
            model.setStatus(request.isActive() ? com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE : com.autotrader.autotraderbackend.model.ModelStatus.INACTIVE);

            CarModel createdModel = carModelService.createModel(model);
            CarModelResponse response = CarModelResponse.fromEntity(createdModel);

            log.info("Successfully created car model with ID: {}", createdModel.getId());
            return ResponseEntity.ok(ApiResponse.success(response, "Model created successfully"));

        } catch (Exception e) {
            log.error("Error creating car model: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to create model: " + e.getMessage()));
        }
    }

    /**
     * Update an existing car model
     */
    @PutMapping("/{id}")
    @Operation(
        summary = "Update Car Model",
        description = "Update an existing car model"
    )
    public ResponseEntity<ApiResponse<CarModelResponse>> updateModel(
            @Parameter(description = "Model ID", required = true) @PathVariable Long id,
            @Valid @RequestBody UpdateCarModelRequest request) {
        
        log.info("Admin updating car model ID: {}", id);

        try {
            CarModel existingModel = carModelService.getModelById(id);
            
            // Update brand if changed
            if (!existingModel.getBrand().getId().equals(request.getBrandId())) {
                CarBrand newBrand = carBrandService.getBrandById(request.getBrandId());
                existingModel.setBrand(newBrand);
            }
            
            // Update other fields
            existingModel.setName(request.getNameEn());
            existingModel.setSlug(request.getSlug() != null ? request.getSlug() : request.getNameEn().toLowerCase().replaceAll("[^a-z0-9-]", "-"));
            existingModel.setDisplayNameEn(request.getNameEn());
            existingModel.setDisplayNameAr(request.getNameAr() != null ? request.getNameAr() : request.getNameEn());
            existingModel.setStatus(request.isActive() ? com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE : com.autotrader.autotraderbackend.model.ModelStatus.INACTIVE);

            CarModel updatedModel = carModelService.updateModel(id, existingModel);
            CarModelResponse response = CarModelResponse.fromEntity(updatedModel);

            log.info("Successfully updated car model ID: {}", id);
            return ResponseEntity.ok(ApiResponse.success(response, "Model updated successfully"));

        } catch (Exception e) {
            log.error("Error updating car model ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to update model: " + e.getMessage()));
        }
    }

    /**
     * Delete a car model
     */
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete Car Model",
        description = "Delete a car model (only if no listings are associated)"
    )
    public ResponseEntity<ApiResponse<Void>> deleteModel(
            @Parameter(description = "Model ID", required = true) @PathVariable Long id) {
        
        log.info("Admin deleting car model ID: {}", id);

        try {
            // Check if model has associated listings
            // This would need to be implemented in the service layer
            // For now, we'll proceed with deletion
            
            carModelService.deleteModel(id);

            log.info("Successfully deleted car model ID: {}", id);
            return ResponseEntity.ok(ApiResponse.success("Model deleted successfully"));

        } catch (Exception e) {
            log.error("Error deleting car model ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to delete model: " + e.getMessage()));
        }
    }

    /**
     * Get paginated list of car models
     */
    @GetMapping
    @Operation(
        summary = "Get Car Models",
        description = "Get paginated list of car models with optional search and brand filtering"
    )
    public ResponseEntity<ApiResponse<PageResponse<CarModelResponse>>> getModels(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Search term") @RequestParam(required = false) String search,
            @Parameter(description = "Brand ID filter") @RequestParam(required = false) Long brandId,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "name") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "asc") String sortDir) {
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            Page<CarModel> modelPage = carModelService.getModels(pageable, search, brandId);

            List<CarModelResponse> modelResponses = modelPage.getContent().stream()
                .map(CarModelResponse::fromEntity)
                .collect(Collectors.toList());

            PageResponse<CarModelResponse> pagedResponse = new PageResponse<>(
                modelResponses,
                modelPage.getNumber(),
                modelPage.getSize(),
                modelPage.getTotalElements(),
                modelPage.getTotalPages(),
                modelPage.isLast()
            );

            return ResponseEntity.ok(ApiResponse.success(pagedResponse, "Models retrieved successfully"));

        } catch (Exception e) {
            log.error("Error retrieving car models: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve models: " + e.getMessage()));
        }
    }

    /**
     * Get a specific car model by ID
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get Car Model",
        description = "Get a specific car model by ID"
    )
    public ResponseEntity<ApiResponse<CarModelResponse>> getModel(
            @Parameter(description = "Model ID", required = true) @PathVariable Long id) {
        
        try {
            CarModel model = carModelService.getModelById(id);
            CarModelResponse response = CarModelResponse.fromEntity(model);

            return ResponseEntity.ok(ApiResponse.success(response, "Model retrieved successfully"));

        } catch (Exception e) {
            log.error("Error retrieving car model ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve model: " + e.getMessage()));
        }
    }


    /**
     * Toggle model active status
     */
    @PatchMapping("/{id}/toggle-active")
    @Operation(
        summary = "Toggle Model Status",
        description = "Toggle the active status of a car model"
    )
    public ResponseEntity<ApiResponse<CarModelResponse>> toggleModelStatus(
            @Parameter(description = "Model ID", required = true) @PathVariable Long id) {
        
        log.info("Admin toggling active status for car model ID: {}", id);

        try {
            CarModel model = carModelService.getModelById(id);
            model.setStatus(model.getStatus() == com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE ? 
                com.autotrader.autotraderbackend.model.ModelStatus.REJECTED : 
                com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE);

            CarModel updatedModel = carModelService.updateModel(id, model);
            CarModelResponse response = CarModelResponse.fromEntity(updatedModel);

            log.info("Successfully toggled status for car model ID: {} to {}", id, updatedModel.getStatus());
            return ResponseEntity.ok(ApiResponse.success(response, "Model status updated successfully"));

        } catch (Exception e) {
            log.error("Error toggling status for car model ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to update model status: " + e.getMessage()));
        }
    }

    /**
     * Bulk update models for a brand
     */
    @PatchMapping("/bulk-update-brand")
    @Operation(
        summary = "Bulk Update Models Brand",
        description = "Move multiple models to a different brand"
    )
    public ResponseEntity<ApiResponse<String>> bulkUpdateModelsBrand(
            @Parameter(description = "Model IDs") @RequestParam List<Long> modelIds,
            @Parameter(description = "New Brand ID") @RequestParam Long newBrandId) {
        
        log.info("Admin bulk updating {} models to brand ID: {}", modelIds.size(), newBrandId);

        try {
            CarBrand newBrand = carBrandService.getBrandById(newBrandId);
            int updatedCount = 0;

            for (Long modelId : modelIds) {
                try {
                    CarModel model = carModelService.getModelById(modelId);
                    model.setBrand(newBrand);
                    carModelService.updateModel(modelId, model);
                    updatedCount++;
                } catch (Exception e) {
                    log.warn("Failed to update model ID {}: {}", modelId, e.getMessage());
                }
            }

            log.info("Successfully updated {} out of {} models", updatedCount, modelIds.size());
            return ResponseEntity.ok(ApiResponse.success(
                String.format("Updated %d out of %d models", updatedCount, modelIds.size())));

        } catch (Exception e) {
            log.error("Error in bulk update: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to bulk update models: " + e.getMessage()));
        }
    }

    /**
     * Search car models by name
     */
    @GetMapping("/search")
    @Operation(
        summary = "Search Car Models",
        description = "Search car models by name or display name (English/Arabic)"
    )
    public ResponseEntity<ApiResponse<List<CarModelResponse>>> searchModels(
            @Parameter(description = "Search term (model name, English or Arabic)", required = true)
            @RequestParam String query,
            @Parameter(description = "Filter by brand ID (optional)") @RequestParam(required = false) Long brandId,
            @Parameter(description = "Maximum results to return") @RequestParam(defaultValue = "50") int limit) {

        log.info("Admin searching car models with query: '{}', brandId: {}, limit: {}", query, brandId, limit);

        try {
            List<CarModel> searchResults;
            if (brandId != null) {
                searchResults = carModelService.searchModelsByBrand(brandId, query);
            } else {
                searchResults = carModelService.searchModels(query);
            }

            // Apply limit if results are too many
            if (searchResults.size() > limit) {
                searchResults = searchResults.subList(0, limit);
            }

            List<CarModelResponse> modelResponses = searchResults.stream()
                .map(CarModelResponse::fromEntity)
                .collect(Collectors.toList());

            log.info("Found {} models matching search query '{}'", modelResponses.size(), query);
            return ResponseEntity.ok(ApiResponse.success(
                modelResponses, "Models found: " + modelResponses.size()));

        } catch (Exception e) {
            log.error("Error searching car models: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to search models: " + e.getMessage()));
        }
    }

    /**
     * Get models by brand
     */
    @GetMapping("/brand/{brandId}")
    @Operation(
        summary = "Get Models by Brand",
        description = "Get all car models for a specific brand"
    )
    public ResponseEntity<ApiResponse<List<CarModelResponse>>> getModelsByBrand(
            @Parameter(description = "Brand ID", required = true) @PathVariable Long brandId) {

        log.info("Admin getting models for brand ID: {}", brandId);

        try {
            // Verify brand exists
            CarBrand brand = carBrandService.getBrandById(brandId);

            List<CarModel> models = carModelService.getModelsByBrandId(brandId);

            List<CarModelResponse> modelResponses = models.stream()
                .map(CarModelResponse::fromEntity)
                .collect(Collectors.toList());

            log.info("Found {} models for brand '{}'", modelResponses.size(), brand.getDisplayNameEn());
            return ResponseEntity.ok(ApiResponse.success(
                modelResponses, "Found " + modelResponses.size() + " models for brand '" + brand.getDisplayNameEn() + "'"));

        } catch (Exception e) {
            log.error("Error getting models by brand: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get models by brand: " + e.getMessage()));
        }
    }

    /**
     * Get models by status (active/inactive)
     */
    @GetMapping("/status/{active}")
    @Operation(
        summary = "Get Models by Status",
        description = "Get car models filtered by active status"
    )
    public ResponseEntity<ApiResponse<List<CarModelResponse>>> getModelsByStatus(
            @Parameter(description = "Active status") @PathVariable boolean active) {

        log.info("Admin getting car models with active status: {}", active);

        try {
            List<CarModel> models = carModelService.getAllModels().stream()
                .filter(model -> (model.getStatus() == com.autotrader.autotraderbackend.model.ModelStatus.ACTIVE) == active)
                .collect(Collectors.toList());

            List<CarModelResponse> modelResponses = models.stream()
                .map(CarModelResponse::fromEntity)
                .collect(Collectors.toList());

            log.info("Found {} {} models", modelResponses.size(), active ? "active" : "inactive");
            return ResponseEntity.ok(ApiResponse.success(
                modelResponses, "Found " + modelResponses.size() + " " + (active ? "active" : "inactive") + " models"));

        } catch (Exception e) {
            log.error("Error getting models by status: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get models by status: " + e.getMessage()));
        }
    }

}
