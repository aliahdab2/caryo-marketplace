package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.service.CarQueryDataService;
import com.autotrader.autotraderbackend.service.SyrianCarsDataService;
import com.autotrader.autotraderbackend.service.CaryoDataService;
import com.autotrader.autotraderbackend.service.CarDataExcelService;
import com.autotrader.autotraderbackend.service.CarBrandService;
import com.autotrader.autotraderbackend.service.CarModelService;
import com.autotrader.autotraderbackend.service.ApiSyncTrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * Simplified admin controller for data import operations
 * Direct import endpoints without complex approval workflows
 */
@RestController
@RequestMapping("/api/admin/data")
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
@Tag(name = "Admin Data Management", description = "Admin endpoints for data imports")
public class AdminDataManagementController {

    private final CarQueryDataService carQueryDataService;
    private final SyrianCarsDataService syrianCarsDataService;
    private final CaryoDataService caryoDataService;
    private final CarDataExcelService carDataExcelService;
    private final CarBrandService carBrandService;
    private final CarModelService carModelService;
    private final ApiSyncTrackingService apiSyncTrackingService;

    // Constructor to handle optional SyrianCarsDataService
    public AdminDataManagementController(
            CarQueryDataService carQueryDataService,
            @Autowired(required = false) SyrianCarsDataService syrianCarsDataService,
            CaryoDataService caryoDataService,
            CarDataExcelService carDataExcelService,
            CarBrandService carBrandService,
            CarModelService carModelService,
            ApiSyncTrackingService apiSyncTrackingService) {
        this.carQueryDataService = carQueryDataService;
        this.syrianCarsDataService = syrianCarsDataService;
        this.caryoDataService = caryoDataService;
        this.carDataExcelService = carDataExcelService;
        this.carBrandService = carBrandService;
        this.carModelService = carModelService;
        this.apiSyncTrackingService = apiSyncTrackingService;
    }

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
            // Check if sync is allowed (rate limiting protection)
            ApiSyncTrackingService.SyncStatus syncStatus = apiSyncTrackingService.checkCarQuerySyncStatus();
            
            if (!syncStatus.isAllowed()) {
                log.warn("CarQuery sync blocked: {}", syncStatus.getMessage());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Sync blocked to prevent API rate limiting: " + syncStatus.getMessage()));
            }

            var result = carQueryDataService.loadCompleteCarDataset();

            if (result.isSuccess()) {
                // Record successful sync to prevent future rate limiting
                apiSyncTrackingService.recordCarQuerySync();
                log.info("CarQuery data import completed successfully and sync recorded");
                return ResponseEntity.ok(ApiResponse.success(
                    "CarQuery data imported successfully", "Import completed. Next sync allowed in 2 hours."));
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
    @PostMapping("/load-syriacars")
    @Operation(
        summary = "Load SyrianCars Data",
        description = "Import car brands and models from SyrianCars.net directly to database"
    )
    public ResponseEntity<ApiResponse<String>> loadSyrianCarsData() {
        log.info("Admin triggered SyrianCars data import");

        try {
            if (syrianCarsDataService == null) {
                log.warn("SyrianCars data service is not available");
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("SyrianCars data service is not enabled"));
            }

            // Check if sync is allowed (rate limiting protection)
            ApiSyncTrackingService.SyncStatus syncStatus = apiSyncTrackingService.checkSyrianCarsSyncStatus();
            
            if (!syncStatus.isAllowed()) {
                log.warn("SyrianCars sync blocked: {}", syncStatus.getMessage());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Sync blocked to prevent rate limiting: " + syncStatus.getMessage()));
            }

            var result = syrianCarsDataService.loadCompleteDataset();

            if (result.isSuccess()) {
                // Record successful sync to prevent future rate limiting
                apiSyncTrackingService.recordSyrianCarsSync();
                log.info("SyrianCars data import completed successfully and sync recorded");
                return ResponseEntity.ok(ApiResponse.success(
                    "SyrianCars data imported successfully", "Import completed. Next sync allowed in 1 hour."));
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
     * Export car brands and models data to Excel
     */
    @GetMapping("/export-excel")
    @Operation(
        summary = "Export Car Data to Excel",
        description = "Export all car brands and models to Excel file with bilingual support"
    )
    public ResponseEntity<byte[]> exportCarDataToExcel() {
        log.info("Admin requested car data export to Excel");

        try {
            byte[] excelData = carDataExcelService.exportCarDataToExcel();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "caryo-car-data-export.xlsx");
            headers.setContentLength(excelData.length);
            
            log.info("Successfully exported car data to Excel ({} bytes)", excelData.length);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
                    
        } catch (Exception e) {
            log.error("Error exporting car data to Excel", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Import car brands and models data from Excel
     */
    @PostMapping("/import-excel")
    @Operation(
        summary = "Import Car Data from Excel",
        description = "Import car brands and models from Excel file with data validation"
    )
    public ResponseEntity<ApiResponse<String>> importCarDataFromExcel(
            @RequestParam("file") MultipartFile file) {
        log.info("Admin requested car data import from Excel file: {}", file.getOriginalFilename());

        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File is empty"));
            }
            
            if (!isExcelFile(file)) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File must be an Excel file (.xlsx or .xls)"));
            }
            
            // Import data
            CarDataExcelService.ExcelImportResult result = carDataExcelService.importCarDataFromExcel(file);
            
            if (result.isSuccess()) {
                log.info("Car data import completed successfully: {}", result.getSummary());
                return ResponseEntity.ok(ApiResponse.success(
                    "Car data imported successfully", result.getSummary()));
            } else {
                log.warn("Car data import completed with errors: {}", result.getSummary());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Import completed with errors: " + result.getSummary()));
            }
            
        } catch (Exception e) {
            log.error("Error importing car data from Excel", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Get sync status for all APIs to prevent rate limiting
     */
    @GetMapping("/sync-status")
    @Operation(
        summary = "Get API Sync Status",
        description = "Get current sync status for all external APIs to prevent rate limiting"
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSyncStatus() {
        log.info("Admin requested API sync status");

        try {
            Map<String, ApiSyncTrackingService.SyncStatus> syncStatuses = apiSyncTrackingService.getAllSyncStatuses();
            
            Map<String, Object> response = new HashMap<>();
            
            for (Map.Entry<String, ApiSyncTrackingService.SyncStatus> entry : syncStatuses.entrySet()) {
                String apiName = entry.getKey();
                ApiSyncTrackingService.SyncStatus status = entry.getValue();
                
                Map<String, Object> apiStatus = new HashMap<>();
                apiStatus.put("allowed", status.isAllowed());
                apiStatus.put("message", status.getMessage());
                apiStatus.put("lastSyncTime", status.getLastSyncTime());
                apiStatus.put("hoursSinceLastSync", status.getHoursSinceLastSync());
                
                if (!status.isAllowed()) {
                    int cooldownHours = apiName.equals("carquery") ? 2 : 1;
                    apiStatus.put("remainingCooldownHours", status.getRemainingCooldownHours(cooldownHours));
                }
                
                response.put(apiName, apiStatus);
            }
            
            return ResponseEntity.ok(ApiResponse.success("Sync status retrieved", response));
            
        } catch (Exception e) {
            log.error("Error retrieving sync status", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Get current car data statistics
     */
    @GetMapping("/statistics")
    @Operation(
        summary = "Get Car Data Statistics",
        description = "Get current statistics of car brands and models in the database"
    )
    public ResponseEntity<ApiResponse<DataStatistics>> getCarDataStatistics() {
        log.info("Admin requested car data statistics");

        try {
            DataStatistics stats = new DataStatistics();
            stats.totalBrands = carBrandService.getAllBrands().size();
            stats.activeBrands = carBrandService.getActiveBrands().size();
            stats.totalModels = carModelService.getAllModels().size();
            stats.activeModels = (int) carModelService.getAllModels().stream()
                .filter(model -> model.getIsActive() != null && model.getIsActive())
                .count();
            
            return ResponseEntity.ok(ApiResponse.success("Statistics retrieved", stats));
            
        } catch (Exception e) {
            log.error("Error retrieving car data statistics", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    /**
     * Helper method to validate Excel file
     */
    private boolean isExcelFile(MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        
        return (contentType != null && (
                contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
                contentType.equals("application/vnd.ms-excel")
        )) || (filename != null && (
                filename.toLowerCase().endsWith(".xlsx") ||
                filename.toLowerCase().endsWith(".xls")
        ));
    }

    /**
     * Data statistics class
     */
    public static class DataStatistics {
        public int totalBrands;
        public int activeBrands;
        public int totalModels;
        public int activeModels;
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