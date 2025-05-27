package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.response.GovernorateResponse;
import com.autotrader.autotraderbackend.service.GovernorateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger; // Added for logging
import org.slf4j.LoggerFactory; // Added for logging

import java.util.List;

@RestController
@RequestMapping("/api/reference-data/governorates")
public class GovernorateController {

    private final GovernorateService governorateService;
    private static final Logger logger = LoggerFactory.getLogger(GovernorateController.class); // Added logger

    public GovernorateController(GovernorateService governorateService) {
        this.governorateService = governorateService;
    }

    @GetMapping
    public ResponseEntity<List<GovernorateResponse>> getAllGovernorates() {
        logger.info("Received request to get all governorates");
        List<GovernorateResponse> governorates = governorateService.getAllActiveGovernorates(); // Changed to getAllActiveGovernorates
        if (governorates.isEmpty()) {
            logger.info("No governorates found, returning 200 with empty list");
            return ResponseEntity.ok(List.of());
        }
        logger.info("Returning {} governorates", governorates.size());
        return ResponseEntity.ok(governorates);
    }

    @GetMapping(value = {"/{slug}", "/"})
    public ResponseEntity<GovernorateResponse> getGovernorateBySlug(
            @PathVariable(required = false) String slug) {
        logger.debug("Received request to get governorate by slug: {}", slug);
        
        // Handle null or empty slug
        if (slug == null || slug.trim().isEmpty()) {
            logger.warn("Slug is null or empty. Returning 404 Not Found.");
            return ResponseEntity.notFound().build();
        }
        
        try {
            GovernorateResponse governorate = governorateService.getGovernorateBySlug(slug.trim());
            if (governorate == null) {
                logger.info("No governorate found for slug: {}. Returning 404 Not Found.", slug);
                return ResponseEntity.notFound().build();
            }
            logger.info("Governorate found for slug: {}. Returning 200 OK.", slug);
            return ResponseEntity.ok(governorate);
        } catch (Exception e) {
            logger.error("Error retrieving governorate for slug: {}", slug, e);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping(value = {"/country/{countryCode}", "/country/"})
    public ResponseEntity<List<GovernorateResponse>> getGovernoratesByCountry(
            @PathVariable(required = false) String countryCode) {
        logger.debug("Received request to get governorates by country code: {}", countryCode);
        
        // Handle null or empty country code
        if (countryCode == null || countryCode.trim().isEmpty()) {
            logger.warn("Country code is null or empty. Returning 200 OK with empty list.");
            return ResponseEntity.ok(List.of());
        }
        
        try {
            List<GovernorateResponse> governorates = governorateService.getGovernoratesByCountry(countryCode.trim());
            logger.info("Found {} governorates for country code: {}. Returning 200 OK.", 
                        governorates.size(), countryCode);
            return ResponseEntity.ok(governorates);
        } catch (Exception e) {
            logger.error("Error retrieving governorates for country code: {}", countryCode, e);
            return ResponseEntity.ok(List.of()); // Return empty list on error
        }
    }
}
