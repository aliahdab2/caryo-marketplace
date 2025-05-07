package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarCondition;
import com.autotrader.autotraderbackend.service.CarConditionService;
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
@RequestMapping("/api/car-conditions")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Car Conditions", description = "Manage car condition reference data")
public class CarConditionController {

    private final CarConditionService carConditionService;

    @GetMapping
    @Operation(
        summary = "Get all car conditions",
        description = "Returns all car conditions in the system.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of car conditions retrieved successfully")
        }
    )
    public ResponseEntity<List<CarCondition>> getAllCarConditions() {
        log.debug("Request received to get all car conditions");
        List<CarCondition> carConditions = carConditionService.getAllConditions();
        log.debug("Returning {} car conditions", carConditions.size());
        return ResponseEntity.ok(carConditions);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get car condition by ID",
        description = "Returns a specific car condition by its ID.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Car condition retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Car condition not found")
        }
    )
    public ResponseEntity<CarCondition> getCarConditionById(
            @Parameter(description = "Car condition ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to get car condition with ID: {}", id);
        CarCondition carCondition = carConditionService.getConditionById(id);
        log.debug("Returning car condition with ID: {}", id);
        return ResponseEntity.ok(carCondition);
    }

    @GetMapping("/name/{name}")
    @Operation(
        summary = "Get car condition by name",
        description = "Returns a specific car condition by its name.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Car condition retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Car condition not found")
        }
    )
    public ResponseEntity<CarCondition> getCarConditionByName(
            @Parameter(description = "Car condition name", required = true)
            @PathVariable String name) {
        log.debug("Request received to get car condition with name: {}", name);
        CarCondition carCondition = carConditionService.getConditionByName(name);
        log.debug("Returning car condition with name: {}", name);
        return ResponseEntity.ok(carCondition);
    }

    @GetMapping("/search")
    @Operation(
        summary = "Search car conditions",
        description = "Search for car conditions by name (works with both English and Arabic names).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
        }
    )
    public ResponseEntity<List<CarCondition>> searchCarConditions(
            @Parameter(description = "Search query", required = true)
            @RequestParam String q) {
        log.debug("Request received to search car conditions with query: {}", q);
        List<CarCondition> results = carConditionService.searchConditions(q);
        log.debug("Returning {} search results for car conditions", results.size());
        return ResponseEntity.ok(results);
    }

    // Admin-only endpoints

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create a new car condition",
        description = "Creates a new car condition in the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Car condition created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
        }
    )
    public ResponseEntity<CarCondition> createCarCondition(
            @Valid @RequestBody CarCondition carCondition) {
        log.debug("Request received to create a new car condition");
        CarCondition createdCarCondition = carConditionService.createCondition(carCondition);
        log.info("Created new car condition with ID: {}", createdCarCondition.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCarCondition);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update a car condition",
        description = "Updates an existing car condition. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Car condition updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Car condition not found")
        }
    )
    public ResponseEntity<CarCondition> updateCarCondition(
            @Parameter(description = "Car condition ID", required = true)
            @PathVariable Long id,
            @Valid @RequestBody CarCondition carCondition) {
        log.debug("Request received to update car condition with ID: {}", id);
        CarCondition updatedCarCondition = carConditionService.updateCondition(id, carCondition);
        log.info("Updated car condition with ID: {}", id);
        return ResponseEntity.ok(updatedCarCondition);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a car condition",
        description = "Deletes a car condition from the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Car condition deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Car condition not found")
        }
    )
    public void deleteCarCondition(
            @Parameter(description = "Car condition ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to delete car condition with ID: {}", id);
        carConditionService.deleteCondition(id);
        log.info("Deleted car condition with ID: {}", id);
    }
}
