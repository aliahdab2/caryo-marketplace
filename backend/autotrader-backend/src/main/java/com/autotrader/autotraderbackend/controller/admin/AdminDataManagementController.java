package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.service.CarQueryDataService;
import com.autotrader.autotraderbackend.service.SyrianCarsDataService;
import com.autotrader.autotraderbackend.service.CaryoDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Simplified admin controller for data import operations
 * Direct import endpoints without complex approval workflows
 */
@RestController
@RequestMapping("/api/admin/data")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Data Management", description = "Admin endpoints for data imports")
public class AdminDataManagementController {

    private final CarQueryDataService carQueryDataService;
    private final SyrianCarsDataService syrianCarsDataService;
    private final CaryoDataService caryoDataService;

    /**
     * Import data from CarQuery API directly to database
     */
    @PostMapping("/load-carquery")
    @Operation(
        summary = "Load CarQuery Data",
        description = "Import car brands and models from CarQuery API directly to database"
    )
    public ResponseEntity<ApiResponse<String>> loadCarQueryData() {
        log.info("Admin triggered CarQuery data import");

        try {
            var result = carQueryDataService.loadCompleteCarDataset();

            if (result.isSuccess()) {
                log.info("CarQuery data import completed successfully");
                return ResponseEntity.ok(ApiResponse.success(
                    "CarQuery data imported successfully", "Import completed"));
            } else {
                log.warn("CarQuery data import failed: {}", result.getErrorMessage());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to import CarQuery data: " + result.getErrorMessage()));
            }

        } catch (Exception e) {
            log.error("Error during CarQuery data import", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Import data from SyrianCars.net directly to database
     */
    @PostMapping("/load-syrian-cars")
    @Operation(
        summary = "Load SyrianCars Data",
        description = "Import car brands and models from SyrianCars.net directly to database"
    )
    public ResponseEntity<ApiResponse<String>> loadSyrianCarsData() {
        log.info("Admin triggered SyrianCars data import");

        try {
            var result = syrianCarsDataService.loadCompleteDataset();

            if (result.isSuccess()) {
                log.info("SyrianCars data import completed successfully");
                return ResponseEntity.ok(ApiResponse.success(
                    "SyrianCars data imported successfully", "Import completed"));
            } else {
                log.warn("SyrianCars data import failed: {}", result.getErrorMessage());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to import SyrianCars data: " + result.getErrorMessage()));
            }

        } catch (Exception e) {
            log.error("Error during SyrianCars data import", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error: " + e.getMessage()));
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