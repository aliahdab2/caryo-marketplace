package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.BodyStyle;
import com.autotrader.autotraderbackend.model.FuelType;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.service.BodyStyleService;
import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.service.FuelTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for car listing analytics and counting endpoints.
 * Provides endpoints for getting various counts and breakdowns of car listings.
 */
@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing Analytics", description = "Analytics and counting endpoints for car listings")
public class CarListingAnalyticsController {

    private final CarListingService carListingService;
    private final BodyStyleService bodyStyleService;
    private final FuelTypeService fuelTypeService;

    @GetMapping("/count")
    @Operation(
        summary = "Get total count of approved car listings",
        description = "Returns the total count of all approved, unsold, and unarchived car listings (approved=true, sold=false, archived=false).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Total count of approved listings",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"count\": 150}"))),
            @ApiResponse(responseCode = "500", description = "Internal server error")
        }
    )
    public ResponseEntity<Map<String, Long>> getApprovedListingsCount() {
        try {
            log.info("Received request to get count of all approved listings");
            long count = carListingService.getApprovedListingsCount();
            log.info("Returning count of approved listings: {}", count);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Error getting approved listings count: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("count", 0L));
        }
    }

    @PostMapping("/count")
    @Operation(
        summary = "Get count of car listings matching filter criteria (POST)",
        description = "Returns the count of car listings matching the provided filter criteria in the request body. By default, only listings with approved=true, sold=false, and archived=false are counted unless explicitly overridden in the request.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of filtered listings",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"count\": 42}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getFilteredListingsCount(
            @Valid @RequestBody ListingFilterRequest filterRequest) {
        log.info("Received request to count filtered listings. Filter: {}", filterRequest);
        long count = carListingService.getFilteredListingsCount(filterRequest);
        log.info("Returning count of filtered listings: {}", count);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/count/filter")
    @Operation(
        summary = "Get count of car listings by query parameters (GET)",
        description = "Returns the count of car listings matching the provided filter criteria as query parameters. Supports slug-based filtering (brandSlugs, modelSlugs). By default, only listings with approved=true, sold=false, and archived=false are counted unless explicitly overridden in the request.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of filtered listings",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"count\": 25}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getFilteredListingsCountByParams(
            // Slug-based parameters
            @Parameter(description = "Brand slugs (can be repeated for multiple brands)", example = "toyota")
            @RequestParam(required = false) List<String> brandSlugs,

            @Parameter(description = "Model slugs (can be repeated for multiple models)", example = "camry")
            @RequestParam(required = false) List<String> modelSlugs,

            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs (can be repeated for multiple locations)", example = "damascus")
            @RequestParam(required = false) List<String> location,
            @Parameter(description = "Location ID") @RequestParam(required = false) Long locationId,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage,
            @Parameter(description = "Show sold listings") @RequestParam(required = false) Boolean isSold,
            @Parameter(description = "Show archived listings") @RequestParam(required = false) Boolean isArchived,
            @Parameter(description = "Filter by seller type IDs") @RequestParam(required = false) List<Long> sellerTypeIds,
            @Parameter(description = "Filter by transmission IDs") @RequestParam(required = false) List<Long> transmissionIds,
            @Parameter(description = "Filter by fuel type slugs (can be repeated for multiple fuel types)", example = "gasoline") @RequestParam(required = false) List<String> fuelTypeSlugs,
            @Parameter(description = "Filter by body type") @RequestParam(required = false) List<String> bodyType,
            @Parameter(description = "Search query for text-based search (supports English and Arabic)") @RequestParam(required = false) String searchQuery) {

        log.info("Counting listings: brandSlugs={}, modelSlugs={}",
                 brandSlugs, modelSlugs);

        ListingFilterRequest filterRequest = new ListingFilterRequest();

        // Set slug-based filters
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);

        // Set existing filters (unchanged)
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setLocationId(locationId);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        filterRequest.setIsSold(isSold);
        filterRequest.setIsArchived(isArchived);
        filterRequest.setSellerTypeIds(sellerTypeIds);
        filterRequest.setTransmissionIds(transmissionIds);

        // Validate and set fuel type slugs
        if (fuelTypeSlugs != null && !fuelTypeSlugs.isEmpty()) {
            validateFuelTypeSlugs(fuelTypeSlugs);
            filterRequest.setFuelTypeSlugs(fuelTypeSlugs);
        }

        // Validate and set body type slugs
        if (bodyType != null && !bodyType.isEmpty()) {
            List<String> normalizedBodyTypes = bodyType.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toList());
            validateBodyTypeSlugs(normalizedBodyTypes);
            filterRequest.setBodyStyleSlugs(normalizedBodyTypes);
        }

        filterRequest.setSearchQuery(searchQuery);

        validateFilterRequest(filterRequest);

        long count = carListingService.getFilteredListingsCount(filterRequest);
        log.info("Returning count of filtered listings: {}", count);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/counts/breakdown")
    @Operation(
        summary = "Get count breakdown for all filter options",
        description = "Returns counts for each available filter option (brands, models, years, etc.) that can be used to display counts in filter UI.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count breakdown for filter options",
                         content = @Content(mediaType = "application/json"))
        }
    )
    public ResponseEntity<Map<String, Object>> getFilterBreakdown() {
        log.info("Received request for filter breakdown");

        Map<String, Object> breakdown = carListingService.getFilterBreakdown(null);

        return ResponseEntity.ok(breakdown);
    }

    @PostMapping("/counts/breakdown")
    @Operation(
        summary = "Get count breakdown for filter options with existing filters",
        description = "Returns counts for each available filter option (brands, models, years, etc.) that can be used to display counts in filter UI. Accepts existing filters to show counts within those constraints.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count breakdown for filter options",
                         content = @Content(mediaType = "application/json"))
        }
    )
    public ResponseEntity<Map<String, Object>> getFilterBreakdownWithFilters(
            @Valid @RequestBody(required = false) ListingFilterRequest existingFilters) {
        log.info("Received request for filter breakdown with existing filters: {}", existingFilters);

        Map<String, Object> breakdown = carListingService.getFilterBreakdown(existingFilters);

        log.info("Returning filter breakdown with {} categories", breakdown.size());
        return ResponseEntity.ok(breakdown);
    }

    @GetMapping("/counts/years")
    @Operation(
        summary = "Get count of listings by year",
        description = "Returns count of listings for each model year, sorted newest first (like AutoTrader UK). Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by year",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"2024\": 150, \"2023\": 200, \"2022\": 180}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByYear(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage) {

        log.info("Getting counts by year with filters: brands={}, models={}", brandSlugs, modelSlugs);

        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);

        Map<String, Long> yearCounts = carListingService.getCountsByYear(filterRequest);
        log.info("Returning year counts for {} years", yearCounts.size());
        return ResponseEntity.ok(yearCounts);
    }

    @GetMapping("/counts/brands")
    @Operation(
        summary = "Get count of listings by brand",
        description = "Returns count of listings for each brand. Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by brand",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"toyota\": 120, \"honda\": 95, \"nissan\": 80}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByBrand(
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice) {

        log.info("Getting counts by brand with filters: models={}, years={}-{}", modelSlugs, minYear, maxYear);

        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setModelSlugs(modelSlugs);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);

        Map<String, Long> brandCounts = carListingService.getCountsByBrand(filterRequest);
        log.info("Returning brand counts for {} brands", brandCounts.size());
        return ResponseEntity.ok(brandCounts);
    }

    @GetMapping("/counts/models")
    @Operation(
        summary = "Get count of listings by model",
        description = "Returns count of listings for each model. Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by model",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"camry\": 45, \"civic\": 38, \"corolla\": 52}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByModel(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice) {

        log.info("Getting counts by model with filters: brands={}, years={}-{}", brandSlugs, minYear, maxYear);

        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);

        Map<String, Long> modelCounts = carListingService.getCountsByModel(filterRequest);
        log.info("Returning model counts for {} models", modelCounts.size());
        return ResponseEntity.ok(modelCounts);
    }

    @GetMapping("/counts/seller-types")
    @Operation(
        summary = "Get count of listings by seller type",
        description = "Returns count of listings for each seller type (Business/Private). Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by seller type",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"private\": 22771, \"dealer\": 118102}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsBySellerType(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage) {

        log.info("Getting counts by seller type with filters: brands={}, models={}, years={}-{}",
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

        Map<String, Long> sellerTypeCounts = carListingService.getCountsBySellerType(filterRequest);
        log.info("Returning seller type counts for {} seller types", sellerTypeCounts.size());
        return ResponseEntity.ok(sellerTypeCounts);
    }

    @GetMapping("/counts/fuel-types")
    @Operation(
        summary = "Get count of listings by fuel type",
        description = "Returns count of listings for each fuel type (Gasoline, Diesel, Electric, Hybrid, etc.). Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by fuel type",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"gasoline\": 1500, \"diesel\": 800, \"electric\": 200}")))
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
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage) {

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

        Map<String, Long> fuelTypeCounts = carListingService.getCountsByFuelType(filterRequest);
        log.info("Returning fuel type counts for {} fuel types", fuelTypeCounts.size());
        return ResponseEntity.ok(fuelTypeCounts);
    }

    @GetMapping("/counts/body-styles")
    @Operation(
        summary = "Get count of listings by body style",
        description = "Returns count of listings for each body style (Sedan, SUV, Hatchback, etc.). Optionally accepts filter parameters to constrain the results. Perfect for displaying counts in category tabs like AutoTrader UK.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by body style",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"sedan\": 1500, \"suv\": 800, \"hatchback\": 400}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByBodyStyle(
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
            @Parameter(description = "Filter by transmission IDs") @RequestParam(required = false) List<Long> transmissionIds) {

        log.info("Getting counts by body style with filters: brands={}, models={}, years={}-{}",
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

        if (fuelTypeSlugs != null && !fuelTypeSlugs.isEmpty()) {
            validateFuelTypeSlugs(fuelTypeSlugs);
            filterRequest.setFuelTypeSlugs(fuelTypeSlugs);
        }

        filterRequest.setTransmissionIds(transmissionIds);

        Map<String, Long> bodyStyleCounts = carListingService.getCountsByBodyStyle(filterRequest);
        log.info("Returning body style counts for {} body styles", bodyStyleCounts.size());
        return ResponseEntity.ok(bodyStyleCounts);
    }

    @GetMapping("/counts/transmissions")
    @Operation(
        summary = "Get count of listings by transmission",
        description = "Returns count of listings for each transmission type (Manual, Automatic, etc.). Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by transmission",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"manual\": 1200, \"automatic\": 800}")))
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

        if (fuelTypeSlugs != null && !fuelTypeSlugs.isEmpty()) {
            validateFuelTypeSlugs(fuelTypeSlugs);
            filterRequest.setFuelTypeSlugs(fuelTypeSlugs);
        }

        filterRequest.setBodyStyleIds(bodyStyleIds);

        Map<String, Long> transmissionCounts = carListingService.getCountsByTransmission(filterRequest);
        log.info("Returning transmission counts for {} transmission types", transmissionCounts.size());
        return ResponseEntity.ok(transmissionCounts);
    }

    /**
     * Validates the ListingFilterRequest to ensure it doesn't have conflicting or invalid parameters.
     */
    private void validateFilterRequest(ListingFilterRequest filter) {
        if (filter.getMinYear() != null && filter.getMaxYear() != null && filter.getMinYear() > filter.getMaxYear()) {
            throw new IllegalArgumentException("Minimum year cannot be greater than maximum year");
        }
        if (filter.getMinPrice() != null && filter.getMaxPrice() != null && filter.getMinPrice().compareTo(filter.getMaxPrice()) > 0) {
            throw new IllegalArgumentException("Minimum price cannot be greater than maximum price");
        }
        if (filter.getMinMileage() != null && filter.getMaxMileage() != null && filter.getMinMileage() > filter.getMaxMileage()) {
            throw new IllegalArgumentException("Minimum mileage cannot be greater than maximum mileage");
        }
    }

    /**
     * Validates body type slugs to ensure they match valid body types from the database.
     */
    private void validateBodyTypeSlugs(List<String> bodyTypeSlugs) {
        if (bodyTypeSlugs.size() > 10) {
            throw new IllegalArgumentException("Too many body type filters (max 10)");
        }

        // Get all valid body type slugs from the database
        List<String> validSlugs = bodyStyleService.getAllBodyStyles().stream()
            .map(BodyStyle::getName)
            .collect(Collectors.toList());

        // Find invalid slugs
        List<String> invalidSlugs = bodyTypeSlugs.stream()
            .filter(slug -> !validSlugs.contains(slug))
            .collect(Collectors.toList());

        if (!invalidSlugs.isEmpty()) {
            throw new IllegalArgumentException("Invalid body type(s): " + String.join(", ", invalidSlugs) +
                ". Valid options are: " + String.join(", ", validSlugs));
        }
    }

    /**
     * Validates fuel type slugs to ensure they match valid fuel types from the database.
     */
    private void validateFuelTypeSlugs(List<String> fuelTypeSlugs) {
        if (fuelTypeSlugs.size() > 10) {
            throw new IllegalArgumentException("Too many fuel type filters (max 10)");
        }

        // Get all valid fuel type slugs from the database
        List<String> validSlugs = fuelTypeService.getAllFuelTypes().stream()
            .map(FuelType::getSlug)
            .collect(Collectors.toList());

        // Find invalid slugs
        List<String> invalidSlugs = fuelTypeSlugs.stream()
            .filter(slug -> !validSlugs.contains(slug))
            .collect(Collectors.toList());

        if (!invalidSlugs.isEmpty()) {
            throw new IllegalArgumentException("Invalid fuel type(s): " + String.join(", ", invalidSlugs) +
                ". Valid options are: " + String.join(", ", validSlugs));
        }
    }
}
