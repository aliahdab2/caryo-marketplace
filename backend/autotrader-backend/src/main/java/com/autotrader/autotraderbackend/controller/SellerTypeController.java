package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.SellerTypeRequest;
import com.autotrader.autotraderbackend.payload.response.SellerTypeResponse;
import com.autotrader.autotraderbackend.service.SellerTypeService;
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
@RequestMapping("/api/seller-types")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Seller Types", description = "Manage seller type reference data")
public class SellerTypeController {

    private final SellerTypeService sellerTypeService;

    @GetMapping
    @Operation(
        summary = "Get all seller types",
        description = "Returns all seller types in the system ordered by English display name.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of seller types retrieved successfully")
        }
    )
    public ResponseEntity<List<SellerTypeResponse>> getAllSellerTypes() {
        log.debug("Request received to get all seller types");
        List<SellerTypeResponse> sellerTypes = sellerTypeService.getAllSellerTypes();
        log.debug("Returning {} seller types", sellerTypes.size());
        return ResponseEntity.ok(sellerTypes);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get seller type by ID",
        description = "Returns a specific seller type by its ID.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Seller type retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Seller type not found")
        }
    )
    public ResponseEntity<SellerTypeResponse> getSellerTypeById(
            @Parameter(description = "Seller type ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to get seller type with ID: {}", id);
        SellerTypeResponse sellerType = sellerTypeService.getSellerTypeById(id);
        log.debug("Returning seller type with ID: {}", id);
        return ResponseEntity.ok(sellerType);
    }

    @GetMapping("/name/{name}")
    @Operation(
        summary = "Get seller type by name",
        description = "Returns a specific seller type by its name (case insensitive).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Seller type retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Seller type not found")
        }
    )
    public ResponseEntity<SellerTypeResponse> getSellerTypeByName(
            @Parameter(description = "Seller type name", required = true)
            @PathVariable String name) {
        log.debug("Request received to get seller type with name: {}", name);
        SellerTypeResponse sellerType = sellerTypeService.getSellerTypeByName(name);
        log.debug("Returning seller type with name: {}", name);
        return ResponseEntity.ok(sellerType);
    }

    @GetMapping("/search")
    @Operation(
        summary = "Search seller types",
        description = "Search for seller types by name (works with English, Arabic names, and system names).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Search results retrieved successfully")
        }
    )
    public ResponseEntity<List<SellerTypeResponse>> searchSellerTypes(
            @Parameter(description = "Search query", required = true)
            @RequestParam String q) {
        log.debug("Request received to search seller types with query: {}", q);
        List<SellerTypeResponse> results = sellerTypeService.searchSellerTypes(q);
        log.debug("Returning {} search results for seller types", results.size());
        return ResponseEntity.ok(results);
    }

    // Admin-only endpoints

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Create a new seller type",
        description = "Creates a new seller type in the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Seller type created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "409", description = "Seller type with same name already exists")
        }
    )
    public ResponseEntity<SellerTypeResponse> createSellerType(
            @Valid @RequestBody SellerTypeRequest request) {
        log.debug("Request received to create a new seller type");
        SellerTypeResponse createdSellerType = sellerTypeService.createSellerType(request);
        log.info("Created new seller type with ID: {}", createdSellerType.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSellerType);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Update a seller type",
        description = "Updates an existing seller type. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Seller type updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Seller type not found"),
            @ApiResponse(responseCode = "409", description = "Seller type with same name already exists")
        }
    )
    public ResponseEntity<SellerTypeResponse> updateSellerType(
            @Parameter(description = "Seller type ID", required = true)
            @PathVariable Long id,
            @Valid @RequestBody SellerTypeRequest request) {
        log.debug("Request received to update seller type with ID: {}", id);
        SellerTypeResponse updatedSellerType = sellerTypeService.updateSellerType(id, request);
        log.info("Updated seller type with ID: {}", id);
        return ResponseEntity.ok(updatedSellerType);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a seller type",
        description = "Deletes a seller type from the system. Requires admin role.",
        security = @SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Seller type deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Seller type not found")
        }
    )
    public void deleteSellerType(
            @Parameter(description = "Seller type ID", required = true)
            @PathVariable Long id) {
        log.debug("Request received to delete seller type with ID: {}", id);
        sellerTypeService.deleteSellerType(id);
        log.info("Deleted seller type with ID: {}", id);
    }
}
