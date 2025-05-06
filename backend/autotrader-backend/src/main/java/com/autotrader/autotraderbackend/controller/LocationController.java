package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.request.LocationRequest;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/locations")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Locations", description = "Manage geographical locations")
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    @Operation(
        summary = "Get all active locations",
        description = "Returns all active locations in the system.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of locations retrieved successfully")
        }
    )
    public ResponseEntity<List<LocationResponse>> getAllLocations() {
        log.debug("Request received to get all active locations");
        List<LocationResponse> locations = locationService.getAllActiveLocations();
        log.debug("Returning {} active locations", locations.size());
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/country/{countryCode}")
    @Operation(
        summary = "Get locations by country",
        description = "Returns all active locations for a specific country.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of locations retrieved successfully")
        }
    )
    public ResponseEntity<List<LocationResponse>> getLocationsByCountry(
            @Parameter(description = "ISO country code (e.g., 'SY' for Syria)", required = true)
            @PathVariable String countryCode) {
        log.debug("Request received to get locations for country: {}", countryCode);
        List<LocationResponse> locations = locationService.getLocationsByCountry(countryCode.toUpperCase());
        log.debug("Returning {} locations for country {}", locations.size(), countryCode);
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get location by ID",
        description = "Returns a specific location by its ID.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Location retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Location not found")
        }
    )
    public ResponseEntity<LocationResponse> getLocationById(
            @Parameter(description = "Location ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to get location with ID: {}", id);
        try {
            LocationResponse location = locationService.getLocationById(id);
            log.debug("Returning location with ID: {}", id);
            return ResponseEntity.ok(location);
        } catch (ResourceNotFoundException e) {
            log.warn("Location not found with ID: {}", id);
            throw e;
        }
    }

    @GetMapping("/slug/{slug}")
    @Operation(
        summary = "Get location by slug",
        description = "Returns a specific location by its URL-friendly slug.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Location retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Location not found")
        }
    )
    public ResponseEntity<LocationResponse> getLocationBySlug(
            @Parameter(description = "Location slug (URL-friendly identifier)", required = true)
            @PathVariable String slug) {
        log.debug("Request received to get location with slug: {}", slug);
        try {
            LocationResponse location = locationService.getLocationBySlug(slug);
            log.debug("Returning location with slug: {}", slug);
            return ResponseEntity.ok(location);
        } catch (ResourceNotFoundException e) {
            log.warn("Location not found with slug: {}", slug);
            throw e;
        }
    }

    @GetMapping("/search")
    @Operation(
        summary = "Search locations",
        description = "Search for locations by name (works with both English and Arabic names).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
        }
    )
    public ResponseEntity<PageResponse<LocationResponse>> searchLocations(
            @Parameter(description = "Search query", required = true)
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.debug("Request received to search locations with query: {}", q);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("displayNameEn").ascending());
        Page<LocationResponse> resultPage = locationService.searchLocations(q, pageable);
        
        PageResponse<LocationResponse> response = new PageResponse<>(
            resultPage.getContent(),
            resultPage.getNumber(),
            resultPage.getSize(),
            resultPage.getTotalElements(),
            resultPage.getTotalPages(),
            resultPage.isLast()
        );
        
        log.debug("Returning {} search results for query: {}", response.getContent().size(), q);
        return ResponseEntity.ok(response);
    }

    // Admin-only endpoints

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create a new location",
        description = "Creates a new location in the system. Admin access required.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Location created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
        }
    )
    public ResponseEntity<LocationResponse> createLocation(
            @Valid @RequestBody LocationRequest request) {
        log.debug("Request received to create a new location");
        LocationResponse createdLocation = locationService.createLocation(request);
        log.info("Location created with ID: {}", createdLocation.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdLocation);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update a location",
        description = "Updates an existing location. Admin access required.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Location updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Location not found")
        }
    )
    public ResponseEntity<LocationResponse> updateLocation(
            @Parameter(description = "Location ID", required = true)
            @PathVariable Long id,
            @Valid @RequestBody LocationRequest request) {
        log.debug("Request received to update location with ID: {}", id);
        try {
            LocationResponse updatedLocation = locationService.updateLocation(id, request);
            log.info("Location updated with ID: {}", id);
            return ResponseEntity.ok(updatedLocation);
        } catch (ResourceNotFoundException e) {
            log.warn("Failed to update - location not found with ID: {}", id);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Delete a location",
        description = "Deletes a location from the system. Admin access required.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Location deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Location not found")
        }
    )
    public ResponseEntity<Void> deleteLocation(
            @Parameter(description = "Location ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to delete location with ID: {}", id);
        try {
            locationService.deleteLocation(id);
            log.info("Location deleted with ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.warn("Failed to delete - location not found with ID: {}", id);
            throw e;
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update location status",
        description = "Activates or deactivates a location. Admin access required.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Location status updated successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Location not found")
        }
    )
    public ResponseEntity<LocationResponse> updateLocationStatus(
            @Parameter(description = "Location ID", required = true)
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> statusUpdate) {
        Boolean active = statusUpdate.get("active");
        if (active == null) {
            return ResponseEntity.badRequest().build();
        }

        log.debug("Request received to set location {} status to active: {}", id, active);
        try {
            LocationResponse updatedLocation = locationService.setLocationActive(id, active);
            log.info("Location {} status updated to active: {}", id, active);
            return ResponseEntity.ok(updatedLocation);
        } catch (ResourceNotFoundException e) {
            log.warn("Failed to update status - location not found with ID: {}", id);
            throw e;
        }
    }
}
