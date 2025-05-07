package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.FuelType;
import com.autotrader.autotraderbackend.service.FuelTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fuel-types")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Fuel Types", description = "Manage fuel type reference data")
public class FuelTypeController {

    private final FuelTypeService fuelTypeService;

    @GetMapping
    @Operation(
        summary = "Get all fuel types",
        description = "Returns all fuel types in the system.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of fuel types retrieved successfully")
        }
    )
    public ResponseEntity<List<FuelType>> getAllFuelTypes() {
        log.debug("Request received to get all fuel types");
        List<FuelType> fuelTypes = fuelTypeService.getAllFuelTypes();
        log.debug("Returning {} fuel types", fuelTypes.size());
        return ResponseEntity.ok(fuelTypes);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get fuel type by ID",
        description = "Returns a specific fuel type by its ID.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Fuel type retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Fuel type not found")
        }
    )
    public ResponseEntity<FuelType> getFuelTypeById(
            @Parameter(description = "Fuel type ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to get fuel type with ID: {}", id);
        FuelType fuelType = fuelTypeService.getFuelTypeById(id);
        log.debug("Returning fuel type with ID: {}", id);
        return ResponseEntity.ok(fuelType);
    }

    @GetMapping("/name/{name}")
    @Operation(
        summary = "Get fuel type by name",
        description = "Returns a specific fuel type by its name.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Fuel type retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Fuel type not found")
        }
    )
    public ResponseEntity<FuelType> getFuelTypeByName(
            @Parameter(description = "Fuel type name", required = true)
            @PathVariable String name) {
        log.debug("Request received to get fuel type with name: {}", name);
        FuelType fuelType = fuelTypeService.getFuelTypeByName(name);
        log.debug("Returning fuel type with name: {}", name);
        return ResponseEntity.ok(fuelType);
    }

    @GetMapping("/search")
    @Operation(
        summary = "Search fuel types",
        description = "Search for fuel types by name (works with both English and Arabic names).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
        }
    )
    public ResponseEntity<List<FuelType>> searchFuelTypes(
            @Parameter(description = "Search query", required = true)
            @RequestParam String q) {
        log.debug("Request received to search fuel types with query: {}", q);
        List<FuelType> results = fuelTypeService.searchFuelTypes(q);
        log.debug("Returning {} search results for fuel types", results.size());
        return ResponseEntity.ok(results);
    }

    // Admin-only endpoints

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create a new fuel type",
        description = "Creates a new fuel type in the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Fuel type created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
        }
    )
    public ResponseEntity<FuelType> createFuelType(
            @Valid @RequestBody FuelType fuelType) {
        log.debug("Request received to create a new fuel type");
        FuelType createdFuelType = fuelTypeService.createFuelType(fuelType);
        log.info("Created new fuel type with ID: {}", createdFuelType.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdFuelType);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update a fuel type",
        description = "Updates an existing fuel type. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Fuel type updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Fuel type not found")
        }
    )
    public ResponseEntity<FuelType> updateFuelType(
            @Parameter(description = "Fuel type ID", required = true)
            @PathVariable Long id,
            @Valid @RequestBody FuelType fuelType) {
        log.debug("Request received to update fuel type with ID: {}", id);
        FuelType updatedFuelType = fuelTypeService.updateFuelType(id, fuelType);
        log.info("Updated fuel type with ID: {}", id);
        return ResponseEntity.ok(updatedFuelType);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a fuel type",
        description = "Deletes a fuel type from the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Fuel type deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Fuel type not found")
        }
    )
    public void deleteFuelType(
            @Parameter(description = "Fuel type ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to delete fuel type with ID: {}", id);
        fuelTypeService.deleteFuelType(id);
        log.info("Deleted fuel type with ID: {}", id);
    }
}
