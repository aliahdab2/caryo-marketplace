package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.payload.request.CreateCarBrandRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateCarBrandRequest;
import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import com.autotrader.autotraderbackend.payload.response.CarBrandResponse;
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
 * Admin controller for car brand management
 * Provides CRUD operations for car brands with proper validation and pagination
 */
@RestController
@RequestMapping("/api/admin/car-brands")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Car Brands", description = "Admin endpoints for managing car brands")
public class AdminCarBrandController {

    private final CarBrandService carBrandService;
    private final CarModelService carModelService;

    /**
     * Create a new car brand
     */
    @PostMapping
    @Operation(
        summary = "Create Car Brand",
        description = "Create a new car brand with bilingual support"
    )
    public ResponseEntity<ApiResponse<CarBrandResponse>> createBrand(
            @Valid @RequestBody CreateCarBrandRequest request) {

        log.info("Admin creating new car brand: {}", request.getName());

        try {
            CarBrand brand = new CarBrand();
            brand.setName(request.getName());
            brand.setSlug(request.getSlug());
            brand.setDisplayNameEn(request.getDisplayNameEn());
            brand.setDisplayNameAr(request.getDisplayNameAr());
            brand.setIsActive(request.isActive());

            CarBrand createdBrand = carBrandService.createBrand(brand);
            CarBrandResponse response = CarBrandResponse.fromEntity(createdBrand);

            log.info("Successfully created car brand with ID: {}", createdBrand.getId());
            return ResponseEntity.ok(ApiResponse.success("Brand created successfully", response));

        } catch (Exception e) {
            log.error("Error creating car brand: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to create brand: " + e.getMessage()));
        }
    }

    /**
     * Update an existing car brand
     */
    @PutMapping("/{id}")
    @Operation(
        summary = "Update Car Brand",
        description = "Update an existing car brand"
    )
    public ResponseEntity<ApiResponse<CarBrandResponse>> updateBrand(
            @Parameter(description = "Brand ID", required = true) @PathVariable Long id,
            @Valid @RequestBody UpdateCarBrandRequest request) {

        log.info("Admin updating car brand ID: {}", id);

        try {
            CarBrand existingBrand = carBrandService.getBrandById(id);

            // Update fields
            existingBrand.setName(request.getName());
            existingBrand.setSlug(request.getSlug());
            existingBrand.setDisplayNameEn(request.getDisplayNameEn());
            existingBrand.setDisplayNameAr(request.getDisplayNameAr());
            existingBrand.setIsActive(request.isActive());

            CarBrand updatedBrand = carBrandService.updateBrand(id, existingBrand);
            CarBrandResponse response = CarBrandResponse.fromEntity(updatedBrand);

            log.info("Successfully updated car brand ID: {}", id);
            return ResponseEntity.ok(ApiResponse.success("Brand updated successfully", response));

        } catch (Exception e) {
            log.error("Error updating car brand ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to update brand: " + e.getMessage()));
        }
    }

    /**
     * Delete a car brand
     */
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete Car Brand",
        description = "Delete a car brand (only if no models are associated)"
    )
    public ResponseEntity<ApiResponse<Void>> deleteBrand(
            @Parameter(description = "Brand ID", required = true) @PathVariable Long id) {

        log.info("Admin deleting car brand ID: {}", id);

        try {
            // Check if brand has associated models
            List<CarModel> models = carModelService.getModelsByBrandId(id);
            if (!models.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cannot delete brand with associated models"));
            }

            carBrandService.deleteBrand(id);

            log.info("Successfully deleted car brand ID: {}", id);
            return ResponseEntity.ok(ApiResponse.success("Brand deleted successfully", null));

        } catch (Exception e) {
            log.error("Error deleting car brand ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to delete brand: " + e.getMessage()));
        }
    }

    /**
     * Get paginated list of car brands
     */
    @GetMapping
    @Operation(
        summary = "Get Car Brands",
        description = "Get paginated list of car brands with optional search"
    )
    public ResponseEntity<ApiResponse<PageResponse<CarBrandResponse>>> getBrands(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Search term") @RequestParam(required = false) String search,
            @Parameter(description = "Sort field") @RequestParam(defaultValue = "name") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "asc") String sortDir) {

        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            Page<CarBrand> brandPage;
            if (search != null && !search.trim().isEmpty()) {
                List<CarBrand> searchResults = carBrandService.searchBrands(search);
                // Convert to Page manually since the service doesn't support pagination yet
                int start = (int) pageable.getOffset();
                int end = Math.min(start + pageable.getPageSize(), searchResults.size());
                List<CarBrand> pageContent = searchResults.subList(start, end);
                brandPage = new org.springframework.data.domain.PageImpl<>(pageContent, pageable, searchResults.size());
            } else {
                // For now, get all brands and paginate manually
                List<CarBrand> allBrands = carBrandService.getAllBrands();
                int start = (int) pageable.getOffset();
                int end = Math.min(start + pageable.getPageSize(), allBrands.size());
                List<CarBrand> pageContent = allBrands.subList(start, end);
                brandPage = new org.springframework.data.domain.PageImpl<>(pageContent, pageable, allBrands.size());
            }

            List<CarBrandResponse> brandResponses = brandPage.getContent().stream()
                .map(CarBrandResponse::fromEntity)
                .collect(Collectors.toList());

            PageResponse<CarBrandResponse> pagedResponse = new PageResponse<>(
                brandResponses,
                brandPage.getNumber(),
                brandPage.getSize(),
                brandPage.getTotalElements(),
                brandPage.getTotalPages(),
                brandPage.isLast()
            );

            return ResponseEntity.ok(ApiResponse.success("Brands retrieved successfully", pagedResponse));

        } catch (Exception e) {
            log.error("Error retrieving car brands: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve brands: " + e.getMessage()));
        }
    }

    /**
     * Get a specific car brand by ID
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get Car Brand",
        description = "Get a specific car brand by ID"
    )
    public ResponseEntity<ApiResponse<CarBrandResponse>> getBrand(
            @Parameter(description = "Brand ID", required = true) @PathVariable Long id) {

        try {
            CarBrand brand = carBrandService.getBrandById(id);
            CarBrandResponse response = CarBrandResponse.fromEntity(brand);

            return ResponseEntity.ok(ApiResponse.success("Brand retrieved successfully", response));

        } catch (Exception e) {
            log.error("Error retrieving car brand ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to retrieve brand: " + e.getMessage()));
        }
    }

    /**
     * Toggle brand active status
     */
    @PatchMapping("/{id}/toggle-active")
    @Operation(
        summary = "Toggle Brand Status",
        description = "Toggle the active status of a car brand"
    )
    public ResponseEntity<ApiResponse<CarBrandResponse>> toggleBrandStatus(
            @Parameter(description = "Brand ID", required = true) @PathVariable Long id) {

        log.info("Admin toggling active status for car brand ID: {}", id);

        try {
            CarBrand brand = carBrandService.getBrandById(id);
            brand.setIsActive(!brand.getIsActive());

            CarBrand updatedBrand = carBrandService.updateBrand(id, brand);
            CarBrandResponse response = CarBrandResponse.fromEntity(updatedBrand);

            log.info("Successfully toggled status for car brand ID: {} to {}", id, updatedBrand.getIsActive());
            return ResponseEntity.ok(ApiResponse.success("Brand status updated successfully", response));

        } catch (Exception e) {
            log.error("Error toggling status for car brand ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to update brand status: " + e.getMessage()));
        }
    }

    /**
     * Search car brands by name
     */
    @GetMapping("/search")
    @Operation(
        summary = "Search Car Brands",
        description = "Search car brands by name or display name (English/Arabic)"
    )
    public ResponseEntity<ApiResponse<List<CarBrandResponse>>> searchBrands(
            @Parameter(description = "Search term (brand name, English or Arabic)", required = true)
            @RequestParam String query,
            @Parameter(description = "Maximum results to return") @RequestParam(defaultValue = "50") int limit) {

        log.info("Admin searching car brands with query: '{}', limit: {}", query, limit);

        try {
            List<CarBrand> searchResults = carBrandService.searchBrands(query);

            // Apply limit if results are too many
            if (searchResults.size() > limit) {
                searchResults = searchResults.subList(0, limit);
            }

            List<CarBrandResponse> brandResponses = searchResults.stream()
                .map(CarBrandResponse::fromEntity)
                .collect(Collectors.toList());

            log.info("Found {} brands matching search query '{}'", brandResponses.size(), query);
            return ResponseEntity.ok(ApiResponse.success(
                "Brands found: " + brandResponses.size(), brandResponses));

        } catch (Exception e) {
            log.error("Error searching car brands: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to search brands: " + e.getMessage()));
        }
    }

    /**
     * Get brands by status (active/inactive)
     */
    @GetMapping("/status/{active}")
    @Operation(
        summary = "Get Brands by Status",
        description = "Get car brands filtered by active status"
    )
    public ResponseEntity<ApiResponse<List<CarBrandResponse>>> getBrandsByStatus(
            @Parameter(description = "Active status") @PathVariable boolean active) {

        log.info("Admin getting car brands with active status: {}", active);

        try {
            List<CarBrand> brands = carBrandService.getAllBrands().stream()
                .filter(brand -> brand.getIsActive() == active)
                .collect(Collectors.toList());

            List<CarBrandResponse> brandResponses = brands.stream()
                .map(CarBrandResponse::fromEntity)
                .collect(Collectors.toList());

            log.info("Found {} {} brands", brandResponses.size(), active ? "active" : "inactive");
            return ResponseEntity.ok(ApiResponse.success(
                "Found " + brandResponses.size() + " " + (active ? "active" : "inactive") + " brands",
                brandResponses));

        } catch (Exception e) {
            log.error("Error getting brands by status: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Failed to get brands by status: " + e.getMessage()));
        }
    }

    /**
     * API Response wrapper
     */
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;

        public ApiResponse(boolean success, String message, T data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }

        public static <T> ApiResponse<T> success(String message, T data) {
            return new ApiResponse<>(true, message, data);
        }

        public static <T> ApiResponse<T> error(String message) {
            return new ApiResponse<>(false, message, null);
        }

        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public T getData() { return data; }
        public void setData(T data) { this.data = data; }
    }
}
