package com.autotrader.autotraderbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class SimpleController {

    @GetMapping("/simple")
    public ResponseEntity<?> simple() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Simple endpoint is working");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
}
