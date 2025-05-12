package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for admin-specific listing operations to maintain URL structure
 * as specified in the API documentation.
 */
@RestController
@RequestMapping("/api/admin/listings")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Listings", description = "Admin-only operations for car listings")
public class AdminListingController {

    private final CarListingService carListingService;

    /**
     * Admin endpoint to approve a listing.
     * Follows the documented URL pattern: /api/admin/listings/{id}/approve
     */
    @RequestMapping(value = "/{id}/approve", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Approve a car listing",
        description = "Approves a pending car listing, making it publicly visible. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing approved successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Listing already approved")
        }
    )
    public ResponseEntity<?> approveListingAdmin(@PathVariable Long id) {
        log.info("Admin API: Received request to approve listing ID: {}", id);
        try {
            CarListingResponse approvedListing = carListingService.approveListing(id);
            log.info("Admin API: Successfully approved listing ID: {}", id);
            return ResponseEntity.ok(approvedListing);
        } catch (ResourceNotFoundException e) {
            log.warn("Admin API: Resource not found during approval attempt for listing ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Admin API: Approval attempt failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Admin endpoint to mark a listing as sold.
     * Follows the documented URL pattern: /api/admin/listings/{id}/mark-sold
     */
    @PostMapping("/{id}/mark-sold")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Mark a car listing as sold",
        description = "Marks a car listing as sold. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing marked as sold successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Listing is archived or already sold")
        }
    )
    public ResponseEntity<?> markListingAsSoldAdmin(@PathVariable Long id) {
        log.info("Admin API: Received request to mark listing ID: {} as sold", id);
        try {
            CarListingResponse soldListing = carListingService.markListingAsSoldByAdmin(id);
            log.info("Admin API: Successfully marked listing ID: {} as sold", id);
            return ResponseEntity.ok(soldListing);
        } catch (ResourceNotFoundException e) {
            log.warn("Admin API: Resource not found when trying to mark listing ID: {} as sold", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Admin API: Failed to mark listing ID: {} as sold: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Admin endpoint to archive a listing.
     * Follows the documented URL pattern: /api/admin/listings/{id}/archive
     */
    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Archive a car listing",
        description = "Archives a car listing. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing archived successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Listing already archived")
        }
    )
    public ResponseEntity<?> archiveListingAdmin(@PathVariable Long id) {
        log.info("Admin API: Received request to archive listing ID: {}", id);
        try {
            CarListingResponse archivedListing = carListingService.archiveListingByAdmin(id);
            log.info("Admin API: Successfully archived listing ID: {}", id);
            return ResponseEntity.ok(archivedListing);
        } catch (ResourceNotFoundException e) {
            log.warn("Admin API: Resource not found when trying to archive listing ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Admin API: Failed to archive listing ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Admin endpoint to unarchive a listing.
     * Follows the documented URL pattern: /api/admin/listings/{id}/unarchive
     */
    @PostMapping("/{id}/unarchive")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Unarchive a car listing",
        description = "Unarchives a car listing. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing unarchived successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Listing is not archived")
        }
    )
    public ResponseEntity<?> unarchiveListingAdmin(@PathVariable Long id) {
        log.info("Admin API: Received request to unarchive listing ID: {}", id);
        try {
            CarListingResponse unarchivedListing = carListingService.unarchiveListingByAdmin(id);
            log.info("Admin API: Successfully unarchived listing ID: {}", id);
            return ResponseEntity.ok(unarchivedListing);
        } catch (ResourceNotFoundException e) {
            log.warn("Admin API: Resource not found when trying to unarchive listing ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Admin API: Failed to unarchive listing ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }
}
