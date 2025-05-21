package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/listings-status")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing Status", description = "Manage car listing status changes (pause/resume, archive/unarchive, mark as sold)")
public class ListingStatusController {
    private final CarListingStatusService carListingStatusService;

    @PutMapping("/{id}/pause")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Pause a car listing",
        description = "Allows the owner of a listing to temporarily pause (hide) it. The listing must be approved, not sold, and not archived.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing paused successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner or listing not in correct state)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., listing already paused)")
        }
    )
    public ResponseEntity<?> pauseListing(
            @Parameter(description = "ID of the listing to pause", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("User {} attempting to pause listing ID {}", userDetails.getUsername(), id);
            CarListingResponse response = carListingStatusService.pauseListing(id, userDetails.getUsername());
            log.info("Successfully paused listing ID {} by user {}", id, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Pause listing failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            log.warn("User {} not authorized to pause listing ID {}: {}", userDetails.getUsername(), id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Pause listing failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/resume")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Resume a car listing",
        description = "Allows the owner of a paused listing to resume (unhide) it. The listing must not be sold or archived.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing resumed successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner or listing not in correct state)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., listing already active)")
        }
    )
    public ResponseEntity<?> resumeListing(
            @Parameter(description = "ID of the listing to resume", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("User {} attempting to resume listing ID {}", userDetails.getUsername(), id);
            CarListingResponse response = carListingStatusService.resumeListing(id, userDetails.getUsername());
            log.info("Successfully resumed listing ID {} by user {}", id, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Resume listing failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            log.warn("User {} not authorized to resume listing ID {}: {}", userDetails.getUsername(), id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Resume listing failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/mark-sold")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Mark a car listing as sold",
        description = "Marks the specified car listing as sold. Only the owner of the listing can perform this action. Cannot be performed on an archived listing.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing marked as sold successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., listing is archived or already sold)")
        }
    )
    public ResponseEntity<?> markListingAsSold(
            @Parameter(description = "ID of the listing to mark as sold", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("User {} attempting to mark listing ID {} as sold", userDetails.getUsername(), id);
            CarListingResponse response = carListingStatusService.markListingAsSold(id, userDetails.getUsername());
            log.info("Successfully marked listing ID {} as sold by user {}", id, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Mark as sold failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            log.warn("User {} not authorized to mark listing ID {} as sold: {}", userDetails.getUsername(), id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Mark as sold failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Archive a car listing",
        description = "Archives the specified car listing. Only the owner of the listing can perform this action.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing archived successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., listing already archived)")
        }
    )
    public ResponseEntity<?> archiveListing(
            @Parameter(description = "ID of the listing to archive", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("User {} attempting to archive listing ID {}", userDetails.getUsername(), id);
            CarListingResponse response = carListingStatusService.archiveListing(id, userDetails.getUsername());
            log.info("Successfully archived listing ID {} by user {}", id, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Archive failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            log.warn("User {} not authorized to archive listing ID {}: {}", userDetails.getUsername(), id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Archive failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/unarchive")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Unarchive a car listing",
        description = "Unarchives the specified car listing. Only the owner of the listing can perform this action.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing unarchived successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., listing not archived)")
        }
    )
    public ResponseEntity<?> unarchiveListing(
            @Parameter(description = "ID of the listing to unarchive", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("User {} attempting to unarchive listing ID {}", userDetails.getUsername(), id);
            CarListingResponse response = carListingStatusService.unarchiveListing(id, userDetails.getUsername());
            log.info("Successfully unarchived listing ID {} by user {}", id, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Unarchive failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            log.warn("User {} not authorized to unarchive listing ID {}: {}", userDetails.getUsername(), id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Unarchive failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @RequestMapping(value = "/admin/{id}/approve", method = {RequestMethod.POST, RequestMethod.PUT})
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

    @PostMapping("/admin/{id}/mark-sold")
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

    @PostMapping("/admin/{id}/archive")
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

    @PostMapping("/admin/{id}/unarchive")
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

    @PutMapping("/admin/{id}/expire")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Expire a car listing",
        description = "Marks a car listing as expired and deactivates it. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing expired successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Listing is already expired, archived, or sold")
        }
    )
    public ResponseEntity<?> expireListing(@PathVariable Long id) {
        log.info("Admin API: Received request to expire listing ID: {}", id);
        try {
            CarListingResponse expiredListing = carListingStatusService.expireListing(id);
            log.info("Admin API: Successfully expired listing ID: {}", id);
            return ResponseEntity.ok(expiredListing);
        } catch (ResourceNotFoundException e) {
            log.warn("Admin API: Resource not found when trying to expire listing ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Admin API: Failed to expire listing ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }
}
