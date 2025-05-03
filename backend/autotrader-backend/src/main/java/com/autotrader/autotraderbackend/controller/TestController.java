package com.autotrader.autotraderbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.HashMap;
import java.util.Map;

@RestController
@Tag(name = "Debug", description = "Test and debug endpoints (for internal use)")
public class TestController {

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
}
