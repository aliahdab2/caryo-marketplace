package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.DriveType;
import com.autotrader.autotraderbackend.service.DriveTypeService;
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
@RequestMapping("/api/drive-types")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Drive Types", description = "Manage drive type reference data")
public class DriveTypeController {

    private final DriveTypeService driveTypeService;

    @GetMapping
    @Operation(
        summary = "Get all drive types",
        description = "Returns all drive types in the system.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of drive types retrieved successfully")
        }
    )
    public ResponseEntity<List<DriveType>> getAllDriveTypes() {
        log.debug("Request received to get all drive types");
        List<DriveType> driveTypes = driveTypeService.getAllDriveTypes();
        log.debug("Returning {} drive types", driveTypes.size());
        return ResponseEntity.ok(driveTypes);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get drive type by ID",
        description = "Returns a specific drive type by its ID.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Drive type retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Drive type not found")
        }
    )
    public ResponseEntity<DriveType> getDriveTypeById(
            @Parameter(description = "Drive type ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to get drive type with ID: {}", id);
        DriveType driveType = driveTypeService.getDriveTypeById(id);
        log.debug("Returning drive type with ID: {}", id);
        return ResponseEntity.ok(driveType);
    }

    @GetMapping("/name/{name}")
    @Operation(
        summary = "Get drive type by name",
        description = "Returns a specific drive type by its name.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Drive type retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Drive type not found")
        }
    )
    public ResponseEntity<DriveType> getDriveTypeByName(
            @Parameter(description = "Drive type name", required = true)
            @PathVariable String name) {
        log.debug("Request received to get drive type with name: {}", name);
        DriveType driveType = driveTypeService.getDriveTypeByName(name);
        log.debug("Returning drive type with name: {}", name);
        return ResponseEntity.ok(driveType);
    }

    @GetMapping("/search")
    @Operation(
        summary = "Search drive types",
        description = "Search for drive types by name (works with both English and Arabic names).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
        }
    )
    public ResponseEntity<List<DriveType>> searchDriveTypes(
            @Parameter(description = "Search query", required = true)
            @RequestParam String q) {
        log.debug("Request received to search drive types with query: {}", q);
        List<DriveType> results = driveTypeService.searchDriveTypes(q);
        log.debug("Returning {} search results for drive types", results.size());
        return ResponseEntity.ok(results);
    }

    // Admin-only endpoints

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create a new drive type",
        description = "Creates a new drive type in the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Drive type created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
        }
    )
    public ResponseEntity<DriveType> createDriveType(
            @Valid @RequestBody DriveType driveType) {
        log.debug("Request received to create a new drive type");
        DriveType createdDriveType = driveTypeService.createDriveType(driveType);
        log.info("Created new drive type with ID: {}", createdDriveType.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDriveType);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update a drive type",
        description = "Updates an existing drive type. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Drive type updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Drive type not found")
        }
    )
    public ResponseEntity<DriveType> updateDriveType(
            @Parameter(description = "Drive type ID", required = true)
            @PathVariable Long id,
            @Valid @RequestBody DriveType driveType) {
        log.debug("Request received to update drive type with ID: {}", id);
        DriveType updatedDriveType = driveTypeService.updateDriveType(id, driveType);
        log.info("Updated drive type with ID: {}", id);
        return ResponseEntity.ok(updatedDriveType);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a drive type",
        description = "Deletes a drive type from the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Drive type deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Drive type not found")
        }
    )
    public void deleteDriveType(
            @Parameter(description = "Drive type ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to delete drive type with ID: {}", id);
        driveTypeService.deleteDriveType(id);
        log.info("Deleted drive type with ID: {}", id);
    }
}
