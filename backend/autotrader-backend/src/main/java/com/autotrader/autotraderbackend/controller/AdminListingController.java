package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
import com.autotrader.autotraderbackend.service.ListingModerationService;
import com.autotrader.autotraderbackend.service.CarListingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import org.springframework.security.core.Authentication;
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

    private final CarListingStatusService carListingStatusService;
    private final ListingModerationService moderationService;
    private final CarListingService carListingService;

    /**
     * Admin endpoint to get all listings with pagination, search, and status filtering.
     * Follows the documented URL pattern: /api/admin/listings
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Get all listings for admin dashboard",
        description = "Retrieves all listings with admin-specific information including moderation status. Supports pagination, search, and filtering.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Listings retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
        }
    )
    public ResponseEntity<Page<CarListingResponse>> getAllListingsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        log.info("Admin API: Fetching all listings - page: {}, size: {}, search: '{}', status: '{}'", 
                 page, size, search, status);
        
        try {
            Pageable pageable = PageRequest.of(page, size, 
                Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy));
            
            Page<CarListingResponse> listings = carListingService.getAllListingsForAdmin(pageable, search, status);
            
            // Enhance each listing with computed moderation status
            List<CarListingResponse> enhancedListings = listings.getContent().stream()
                .map(this::enhanceWithModerationStatus)
                .toList();
            
            Page<CarListingResponse> enhancedPage = new PageImpl<>(
                enhancedListings, pageable, listings.getTotalElements());
            
            log.info("Admin API: Successfully retrieved {} listings", enhancedListings.size());
            return ResponseEntity.ok(enhancedPage);
            
        } catch (Exception e) {
            log.error("Admin API: Failed to fetch listings: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Enhance listing response with computed moderation status fields
     */
    private CarListingResponse enhanceWithModerationStatus(CarListingResponse listing) {
        Long listingId = listing.getId();
        
        // Add computed fields for admin UI
        listing.setHiddenByAdmin(moderationService.isListingHiddenByAdmin(listingId));
        listing.setIsSold(moderationService.isListingSold(listingId));
        listing.setIsArchived(moderationService.isListingArchived(listingId));
        listing.setIsExpired(moderationService.isListingExpired(listingId));
        listing.setStatus(moderationService.getListingStatus(listingId));
        
        return listing;
    }

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
            CarListingResponse approvedListing = carListingStatusService.approveListing(id);
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
            CarListingResponse soldListing = carListingStatusService.markListingAsSoldByAdmin(id);
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
            CarListingResponse archivedListing = carListingStatusService.archiveListingByAdmin(id);
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
            CarListingResponse unarchivedListing = carListingStatusService.unarchiveListingByAdmin(id);
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

    /**
     * Admin endpoint to unmark a listing as sold.
     * Follows the documented URL pattern: /api/admin/listings/{id}/unmark-sold
     */
    @PostMapping("/{id}/unmark-sold")
    @Operation(
        summary = "Unmark a car listing as sold",
        description = "Unmarks a car listing as sold. Admin access required.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing unmarked as sold successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Listing is not sold")
        }
    )
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unmarkSoldListingAdmin(@PathVariable Long id) {
        log.info("Admin API: Received request to unmark sold listing ID: {}", id);
        try {
            CarListingResponse unmarkedListing = carListingStatusService.unmarkSoldListingByAdmin(id);
            log.info("Admin API: Successfully unmarked sold listing ID: {}", id);
            return ResponseEntity.ok(unmarkedListing);
        } catch (ResourceNotFoundException e) {
            log.warn("Admin API: Resource not found when trying to unmark sold listing ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.warn("Admin API: Failed to unmark sold listing ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Admin endpoint to hide a listing.
     * Follows the documented URL pattern: /api/admin/listings/{id}/hide
     */
    @PutMapping("/{id}/hide")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Hide a car listing",
        description = "Hides a car listing from public view without deleting it. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing hidden successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
        }
    )
    public ResponseEntity<?> hideListingAdmin(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> hideData,
            Authentication authentication) {
        log.info("Admin API: Received request to hide listing ID: {}", id);
        try {
            String reason = (hideData != null && hideData.get("reason") != null && !hideData.get("reason").trim().isEmpty()) 
                ? hideData.get("reason") : "Hidden by admin";
            String adminUsername = authentication.getName();
            
            moderationService.hideListingAsAdmin(id, reason, adminUsername);
            
            log.info("Admin API: Successfully hidden listing ID: {} with reason: {}", id, reason);
            return ResponseEntity.ok(Map.of(
                "message", "Listing hidden successfully",
                "listingId", id,
                "reason", reason
            ));
        } catch (ResourceNotFoundException e) {
            log.warn("Admin API: Resource not found when trying to hide listing ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Admin API: Invalid state when trying to hide listing ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Admin API: Failed to hide listing ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to hide listing"));
        }
    }

    /**
     * Admin endpoint to unhide a listing.
     * Follows the documented URL pattern: /api/admin/listings/{id}/unhide
     */
    @PutMapping("/{id}/unhide")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Unhide a car listing",
        description = "Makes a hidden car listing visible to the public again. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing unhidden successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
        }
    )
    public ResponseEntity<?> unhideListingAdmin(
            @PathVariable Long id,
            Authentication authentication) {
        log.info("Admin API: Received request to unhide listing ID: {}", id);
        try {
            String adminUsername = authentication.getName();
            
            moderationService.unhideListingAsAdmin(id, adminUsername);
            
            log.info("Admin API: Successfully unhidden listing ID: {}", id);
            return ResponseEntity.ok(Map.of(
                "message", "Listing unhidden successfully",
                "listingId", id
            ));
        } catch (ResourceNotFoundException e) {
            log.warn("Admin API: Resource not found when trying to unhide listing ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Admin API: Invalid state when trying to unhide listing ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Admin API: Failed to unhide listing ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to unhide listing"));
        }
    }
}
