package com.autotrader.autotraderbackend.controller.pub;

import com.autotrader.autotraderbackend.service.SyrianCarsDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public test controller for development and testing purposes
 */
@RestController
@RequestMapping("/api/public")
@Slf4j
@Tag(name = "Public Test", description = "Public endpoints for testing (development only)")
public class PublicTestController {

    private final SyrianCarsDataService syrianCarsDataService;

    // Constructor to handle optional SyrianCarsDataService
    public PublicTestController(@Autowired(required = false) SyrianCarsDataService syrianCarsDataService) {
        this.syrianCarsDataService = syrianCarsDataService;
    }

    /**
     * Test endpoint for SyrianCars data import (no auth required for testing)
     */
    @PostMapping("/test-syriacars")
    @Operation(
        summary = "Test SyrianCars Data Import",
        description = "Test endpoint to import SyrianCars data without authentication (for development only)"
    )
    public ResponseEntity<ApiResponse<String>> testSyrianCarsData() {
        log.info("Public test endpoint triggered for SyrianCars data import");

        try {
            if (syrianCarsDataService == null) {
                log.warn("SyrianCars data service is not available");
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("SyrianCars data service is not enabled"));
            }

            var result = syrianCarsDataService.loadCompleteDataset();

            if (result.isSuccess()) {
                log.info("SyrianCars test import completed successfully");
                return ResponseEntity.ok(ApiResponse.success(
                    "SyrianCars test import successful", "Import completed"));
            } else {
                log.warn("SyrianCars test import failed: {}", result.getErrorMessage());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to import SyrianCars data: " + result.getErrorMessage()));
            }

        } catch (Exception e) {
            log.error("Error during SyrianCars test import", e);
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

