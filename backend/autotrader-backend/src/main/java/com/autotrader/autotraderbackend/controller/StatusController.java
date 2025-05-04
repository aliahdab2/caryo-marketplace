package com.autotrader.autotraderbackend.controller;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Status", description = "Endpoints for service and API status checks")
public class StatusController {
    
    @GetMapping("/service-status")
    @Operation(
        summary = "Service status",
        description = "Returns a simple message indicating the service is up.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Service is up!")
        }
    )
    public ResponseEntity<String> status() {
        return ResponseEntity.ok("Service is up!");
    }

    @GetMapping("/api/status")
    @Operation(
        summary = "API status",
        description = "Returns a simple message indicating the API is working.",
        responses = {
            @ApiResponse(responseCode = "200", description = "API is working!")
        }
    )
    public ResponseEntity<String> apiStatus() {
        return ResponseEntity.ok("API is working!");
    }
}
