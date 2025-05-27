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
            // Update the first 3 media entries to use our uploaded sample images
            // Note: H2 table names might be case-sensitive
            int count1 = jdbcTemplate.update("UPDATE media SET file_key = 'listings/1/main.jpg' WHERE id = 4");
            int count2 = jdbcTemplate.update("UPDATE media SET file_key = 'listings/2/main.jpg' WHERE id = 5");
            int count3 = jdbcTemplate.update("UPDATE media SET file_key = 'listings/3/main.jpg' WHERE id = 6");
            
            return ResponseEntity.ok(String.format("Sample image URLs updated successfully. Updated %d, %d, %d rows.", count1, count2, count3));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating sample images: " + e.getMessage());
        }
    }
}
