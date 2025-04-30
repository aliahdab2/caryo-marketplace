package com.autotrader.autotraderbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class TestController {

    @GetMapping("/hello")
    public ResponseEntity<?> hello() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Hello from AutoTrader API!");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/test/public")
    public ResponseEntity<?> publicEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Public endpoint is working!");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
}
