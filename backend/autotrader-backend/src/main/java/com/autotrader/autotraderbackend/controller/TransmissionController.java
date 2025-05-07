package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.Transmission;
import com.autotrader.autotraderbackend.service.TransmissionService;
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
@RequestMapping("/api/transmissions")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Transmissions", description = "Manage transmission reference data")
public class TransmissionController {

    private final TransmissionService transmissionService;

    @GetMapping
    @Operation(
        summary = "Get all transmissions",
        description = "Returns all transmissions in the system.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of transmissions retrieved successfully")
        }
    )
    public ResponseEntity<List<Transmission>> getAllTransmissions() {
        log.debug("Request received to get all transmissions");
        List<Transmission> transmissions = transmissionService.getAllTransmissions();
        log.debug("Returning {} transmissions", transmissions.size());
        return ResponseEntity.ok(transmissions);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get transmission by ID",
        description = "Returns a specific transmission by its ID.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Transmission retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Transmission not found")
        }
    )
    public ResponseEntity<Transmission> getTransmissionById(
            @Parameter(description = "Transmission ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to get transmission with ID: {}", id);
        Transmission transmission = transmissionService.getTransmissionById(id);
        log.debug("Returning transmission with ID: {}", id);
        return ResponseEntity.ok(transmission);
    }

    @GetMapping("/name/{name}")
    @Operation(
        summary = "Get transmission by name",
        description = "Returns a specific transmission by its name.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Transmission retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Transmission not found")
        }
    )
    public ResponseEntity<Transmission> getTransmissionByName(
            @Parameter(description = "Transmission name", required = true)
            @PathVariable String name) {
        log.debug("Request received to get transmission with name: {}", name);
        Transmission transmission = transmissionService.getTransmissionByName(name);
        log.debug("Returning transmission with name: {}", name);
        return ResponseEntity.ok(transmission);
    }

    @GetMapping("/search")
    @Operation(
        summary = "Search transmissions",
        description = "Search for transmissions by name (works with both English and Arabic names).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
        }
    )
    public ResponseEntity<List<Transmission>> searchTransmissions(
            @Parameter(description = "Search query", required = true)
            @RequestParam String q) {
        log.debug("Request received to search transmissions with query: {}", q);
        List<Transmission> results = transmissionService.searchTransmissions(q);
        log.debug("Returning {} search results for transmissions", results.size());
        return ResponseEntity.ok(results);
    }

    // Admin-only endpoints

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create a new transmission",
        description = "Creates a new transmission in the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Transmission created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
        }
    )
    public ResponseEntity<Transmission> createTransmission(
            @Valid @RequestBody Transmission transmission) {
        log.debug("Request received to create a new transmission");
        Transmission createdTransmission = transmissionService.createTransmission(transmission);
        log.info("Created new transmission with ID: {}", createdTransmission.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTransmission);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update a transmission",
        description = "Updates an existing transmission. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Transmission updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Transmission not found")
        }
    )
    public ResponseEntity<Transmission> updateTransmission(
            @Parameter(description = "Transmission ID", required = true)
            @PathVariable Long id,
            @Valid @RequestBody Transmission transmission) {
        log.debug("Request received to update transmission with ID: {}", id);
        Transmission updatedTransmission = transmissionService.updateTransmission(id, transmission);
        log.info("Updated transmission with ID: {}", id);
        return ResponseEntity.ok(updatedTransmission);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a transmission",
        description = "Deletes a transmission from the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Transmission deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Transmission not found")
        }
    )
    public void deleteTransmission(
            @Parameter(description = "Transmission ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to delete transmission with ID: {}", id);
        transmissionService.deleteTransmission(id);
        log.info("Deleted transmission with ID: {}", id);
    }
}
