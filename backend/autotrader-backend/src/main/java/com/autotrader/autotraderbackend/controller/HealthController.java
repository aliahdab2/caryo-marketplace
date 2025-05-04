package com.autotrader.autotraderbackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@RestController
@Tag(name = "Health Check", description = "System health monitoring endpoints")
@Slf4j
@RequiredArgsConstructor
public class HealthController {

    @GetMapping("/health")
    @Operation(
        summary = "Health check",
        description = "Returns the health status of the API.",
        responses = {
            @ApiResponse(responseCode = "200", description = "API is healthy")
        }
    )
    public ResponseEntity<?> health() {
        log.debug("Health check called on /health endpoint");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "API is functioning properly");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/status")
    @Operation(
        summary = "Status check",
        description = "Simple status endpoint used by dev-env.sh and monitoring tools.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Service is running")
        }
    )
    public ResponseEntity<Map<String, String>> status() {
        log.debug("Status check called on /status endpoint");
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "autotrader-backend");
        return ResponseEntity.ok(response);
    }
}
