package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.BodyStyle;
import com.autotrader.autotraderbackend.service.BodyStyleService;
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
@RequestMapping("/api/body-styles")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Body Styles", description = "Manage body style reference data")
public class BodyStyleController {

    private final BodyStyleService bodyStyleService;

    @GetMapping
    @Operation(
        summary = "Get all body styles",
        description = "Returns all body styles in the system.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of body styles retrieved successfully")
        }
    )
    public ResponseEntity<List<BodyStyle>> getAllBodyStyles() {
        log.debug("Request received to get all body styles");
        List<BodyStyle> bodyStyles = bodyStyleService.getAllBodyStyles();
        log.debug("Returning {} body styles", bodyStyles.size());
        return ResponseEntity.ok(bodyStyles);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get body style by ID",
        description = "Returns a specific body style by its ID.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Body style retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Body style not found")
        }
    )
    public ResponseEntity<BodyStyle> getBodyStyleById(
            @Parameter(description = "Body style ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to get body style with ID: {}", id);
        BodyStyle bodyStyle = bodyStyleService.getBodyStyleById(id);
        log.debug("Returning body style with ID: {}", id);
        return ResponseEntity.ok(bodyStyle);
    }

    @GetMapping("/name/{name}")
    @Operation(
        summary = "Get body style by name",
        description = "Returns a specific body style by its name.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Body style retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Body style not found")
        }
    )
    public ResponseEntity<BodyStyle> getBodyStyleByName(
            @Parameter(description = "Body style name", required = true)
            @PathVariable String name) {
        log.debug("Request received to get body style with name: {}", name);
        BodyStyle bodyStyle = bodyStyleService.getBodyStyleByName(name);
        log.debug("Returning body style with name: {}", name);
        return ResponseEntity.ok(bodyStyle);
    }

    @GetMapping("/search")
    @Operation(
        summary = "Search body styles",
        description = "Search for body styles by name (works with both English and Arabic names).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
        }
    )
    public ResponseEntity<List<BodyStyle>> searchBodyStyles(
            @Parameter(description = "Search query", required = true)
            @RequestParam String q) {
        log.debug("Request received to search body styles with query: {}", q);
        List<BodyStyle> results = bodyStyleService.searchBodyStyles(q);
        log.debug("Returning {} search results for body styles", results.size());
        return ResponseEntity.ok(results);
    }

    // Admin-only endpoints

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create a new body style",
        description = "Creates a new body style in the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Body style created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
        }
    )
    public ResponseEntity<BodyStyle> createBodyStyle(
            @Valid @RequestBody BodyStyle bodyStyle) {
        log.debug("Request received to create a new body style");
        BodyStyle createdBodyStyle = bodyStyleService.createBodyStyle(bodyStyle);
        log.info("Created new body style with ID: {}", createdBodyStyle.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBodyStyle);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update a body style",
        description = "Updates an existing body style. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Body style updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Body style not found")
        }
    )
    public ResponseEntity<BodyStyle> updateBodyStyle(
            @Parameter(description = "Body style ID", required = true)
            @PathVariable Long id,
            @Valid @RequestBody BodyStyle bodyStyle) {
        log.debug("Request received to update body style with ID: {}", id);
        BodyStyle updatedBodyStyle = bodyStyleService.updateBodyStyle(id, bodyStyle);
        log.info("Updated body style with ID: {}", id);
        return ResponseEntity.ok(updatedBodyStyle);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a body style",
        description = "Deletes a body style from the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Body style deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Body style not found")
        }
    )
    public void deleteBodyStyle(
            @Parameter(description = "Body style ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to delete body style with ID: {}", id);
        bodyStyleService.deleteBodyStyle(id);
        log.info("Deleted body style with ID: {}", id);
    }
}
