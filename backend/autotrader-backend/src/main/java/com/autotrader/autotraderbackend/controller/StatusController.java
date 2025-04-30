package com.autotrader.autotraderbackend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatusController {
    
    @GetMapping("/status")
    public ResponseEntity<String> status() {
        return ResponseEntity.ok("Service is up!");
    }
    
    @GetMapping("/api/status")
    public ResponseEntity<String> apiStatus() {
        return ResponseEntity.ok("API is working!");
    }
}
