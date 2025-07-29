package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.service.CarListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/listings/counts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Counts", description = "APIs for getting various counts and statistics")
public class CountsController {

    private final CarListingService carListingService;

    @GetMapping("/fuel-types")
    @Operation(
        summary = "Get count of listings by fuel type",
        description = "Returns count of listings for each fuel type (Gasoline, Diesel, etc.). Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by fuel type", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"gasoline\\\": 1500, \\\"diesel\\\": 800}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByFuelType(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage,
            @Parameter(description = "Filter by fuel type slugs") @RequestParam(required = false) List<String> fuelTypeSlugs,
            @Parameter(description = "Filter by body style IDs") @RequestParam(required = false) List<Long> bodyStyleIds) {
        
        log.info("Getting counts by fuel type with filters: brands={}, models={}, years={}-{}", 
                brandSlugs, modelSlugs, minYear, maxYear);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        filterRequest.setFuelTypeSlugs(fuelTypeSlugs);
        filterRequest.setBodyStyleIds(bodyStyleIds);
        
        Map<String, Long> fuelTypeCounts = carListingService.getCountsByFuelType(filterRequest);
        log.info("Returning fuel type counts for {} fuel types", fuelTypeCounts.size());
        return ResponseEntity.ok(fuelTypeCounts);
    }

    @GetMapping("/transmissions")
    @Operation(
        summary = "Get count of listings by transmission",
        description = "Returns count of listings for each transmission type (Manual, Automatic, etc.). Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by transmission", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"manual\\\": 1200, \\\"automatic\\\": 800}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByTransmission(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage,
            @Parameter(description = "Filter by fuel type slugs") @RequestParam(required = false) List<String> fuelTypeSlugs,
            @Parameter(description = "Filter by body style IDs") @RequestParam(required = false) List<Long> bodyStyleIds) {
        
        log.info("Getting counts by transmission with filters: brands={}, models={}, years={}-{}", 
                brandSlugs, modelSlugs, minYear, maxYear);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        filterRequest.setFuelTypeSlugs(fuelTypeSlugs);
        filterRequest.setBodyStyleIds(bodyStyleIds);
        
        Map<String, Long> transmissionCounts = carListingService.getCountsByTransmission(filterRequest);
        log.info("Returning transmission counts for {} transmission types", transmissionCounts.size());
        return ResponseEntity.ok(transmissionCounts);
    }

    @GetMapping("/all")
    @Operation(
        summary = "Get all counts in a single request",
        description = "Returns fuel type counts, transmission counts, and body style counts in a single API call. This is more efficient than making separate requests for each count type.",
        responses = {
            @ApiResponse(responseCode = "200", description = "All counts in a single response", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"fuelTypes\\\": {\\\"gasoline\\\": 1500, \\\"diesel\\\": 800}, \\\"transmissions\\\": {\\\"manual\\\": 1200, \\\"automatic\\\": 800}, \\\"bodyStyles\\\": {\\\"sedan\\\": 1000, \\\"suv\\\": 600}}")))
        }
    )
    public ResponseEntity<Map<String, Object>> getAllCounts(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage,
            @Parameter(description = "Filter by fuel type slugs") @RequestParam(required = false) List<String> fuelTypeSlugs,
            @Parameter(description = "Filter by body style IDs") @RequestParam(required = false) List<Long> bodyStyleIds) {
        
        log.info("Getting all counts with filters: brands={}, models={}, years={}-{}", 
                brandSlugs, modelSlugs, minYear, maxYear);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        filterRequest.setFuelTypeSlugs(fuelTypeSlugs);
        filterRequest.setBodyStyleIds(bodyStyleIds);
        
        Map<String, Object> allCounts = carListingService.getAllCounts(filterRequest);
        log.info("Returning all counts for {} fuel types, {} transmission types, and {} body styles", 
                ((Map<String, Long>) allCounts.get("fuelTypes")).size(),
                ((Map<String, Long>) allCounts.get("transmissions")).size(),
                ((Map<String, Long>) allCounts.get("bodyStyles")).size());
        return ResponseEntity.ok(allCounts);
    }
} 