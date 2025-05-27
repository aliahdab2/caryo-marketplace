package com.autotrader.autotraderbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@Tag(name = "Debug", description = "Test and debug endpoints (for internal use)")
public class TestController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/hello")
    @Operation(
        summary = "Hello test endpoint",
        description = "Returns a hello message. For internal testing only.",
        deprecated = true,
        responses = {
            @ApiResponse(responseCode = "200", description = "Hello message returned")
        }
    )
    public ResponseEntity<?> hello() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Hello from AutoTrader API!");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/test/public")
    @Operation(
        summary = "Public test endpoint",
        description = "Returns a message from a public test endpoint. For internal testing only.",
        deprecated = true,
        responses = {
            @ApiResponse(responseCode = "200", description = "Public test message returned")
        }
    )
    public ResponseEntity<?> publicEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Public endpoint is working!");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/test/user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Operation(
        summary = "User test endpoint",
        description = "Returns a message from a protected user endpoint. Requires user role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "User test message returned"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - No token provided"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not enough privileges")
        }
    )
    public ResponseEntity<?> userEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "User endpoint is working!");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/test/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Admin test endpoint",
        description = "Returns a message from a protected admin endpoint. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Admin test message returned"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - No token provided"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Not enough privileges")
        }
    )
    public ResponseEntity<?> adminEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin endpoint is working!");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/api/test/update-sample-images")
    @Operation(
        summary = "Update sample images",
        description = "Updates the first 3 listings to use uploaded sample images. For testing only.",
        deprecated = true,
        responses = {
            @ApiResponse(responseCode = "200", description = "Sample images updated successfully")
        }
    )
    public ResponseEntity<String> updateSampleImages() {
        try {
            // First, let's get the listing IDs for the first 3 sample listings
            String getListingsQuery = "SELECT id FROM car_listings WHERE title LIKE '%Test Listing%' ORDER BY id LIMIT 3";
            List<Long> listingIds = jdbcTemplate.queryForList(getListingsQuery, Long.class);
            
            if (listingIds.size() < 3) {
                return ResponseEntity.status(400).body("Not enough sample listings found. Expected 3, found " + listingIds.size());
            }
            
            // Update the media for these listings to point to our uploaded images
            String[] fileKeys = {
                "listings/1/main.jpg",
                "listings/2/main.jpg", 
                "listings/3/main.jpg"
            };
            
            int totalUpdated = 0;
            for (int i = 0; i < 3; i++) {
                String updateQuery = "UPDATE listing_media SET file_key = ? WHERE listing_id = ? AND is_primary = true";
                int rowsUpdated = jdbcTemplate.update(updateQuery, fileKeys[i], listingIds.get(i));
                
                if (rowsUpdated == 0) {
                    // If no primary media exists, update any media for this listing
                    String fallbackQuery = "UPDATE listing_media SET file_key = ? WHERE listing_id = ?";
                    rowsUpdated = jdbcTemplate.update(fallbackQuery, fileKeys[i], listingIds.get(i));
                }
                totalUpdated += rowsUpdated;
            }
            
            return ResponseEntity.ok(String.format("Sample images updated successfully for listings: %s. Total rows updated: %d", listingIds, totalUpdated));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating sample images: " + e.getMessage());
        }
    }
}
