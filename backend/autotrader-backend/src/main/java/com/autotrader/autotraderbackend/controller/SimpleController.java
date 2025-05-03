package com.autotrader.autotraderbackend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@Tag(name = "Debug", description = "Test and debug endpoints (for internal use)")
public class SimpleController {

    @GetMapping("/simple")
    @Operation(
        summary = "Simple test endpoint",
        description = "Returns a simple message and timestamp. For internal testing only.",
        deprecated = true,
        responses = {
            @ApiResponse(responseCode = "200", description = "Simple test message returned")
        }
    )
    public ResponseEntity<?> simple() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Simple endpoint is working");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
}
