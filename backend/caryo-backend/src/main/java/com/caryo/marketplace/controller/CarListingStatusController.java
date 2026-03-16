package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.service.CarListingStatusService;
import com.caryo.marketplace.service.I18nService;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

/**
 * REST controller for car listing status management.
 * Provides endpoints for pausing and resuming car listings.
 *
 * This controller was extracted from CarListingController during refactoring
 * to improve code organization and maintainability while maintaining
 * backward compatibility with existing API endpoints.
 */
@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing Status", description = "Manage car listing status (pause/resume)")
public class CarListingStatusController {

    private final CarListingStatusService carListingStatusService;
    private final I18nService i18nService;

    /**
     * Validates that the user is authenticated and returns username.
     * Returns null if user is not authenticated (caller should return 401).
     */
    private String validateAndGetUsername(UserDetails userDetails) {
        if (userDetails == null) {
            return null;
        }
        return userDetails.getUsername();
    }

    /**
     * Creates an unauthorized response for unauthenticated users.
     */
    private ResponseEntity<Map<String, String>> createUnauthorizedResponse(HttpServletRequest request) {
        String errorMessage = i18nService.getMessage("error.unauthorized.access", request);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", errorMessage));
    }

    @PutMapping("/{id}/pause")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Pause a car listing",
        description = "Allows the owner of a listing to temporarily pause (hide) it. The listing must be approved, not sold, and not archived.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing paused successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner or listing not in correct state)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., listing already paused or in a state that cannot be paused)")
        }
    )
    public ResponseEntity<?> pauseListing(
            @Parameter(description = "ID of the listing to pause", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        String username = validateAndGetUsername(userDetails);
        if (username == null) {
            return createUnauthorizedResponse(request);
        }
        try {
            log.info("User {} attempting to pause listing ID {}", username, id);
            CarListingResponse response = carListingStatusService.pauseListing(id, username);
            log.info("Successfully paused listing ID {} by user {}", id, username);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Pause listing failed for listing ID {}: {}", id, e.getMessage());
            String errorMessage = i18nService.getMessage("error.resource.not.found", request,
                    e.getResourceName(), e.getFieldName(), e.getFieldValue().toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", errorMessage));
        } catch (SecurityException | AccessDeniedException e) {
            log.warn("User {} not authorized to pause listing ID {}: {}", username, id, e.getMessage());
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
            @ApiResponse(responseCode = "200", description = "Listing resumed successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner or listing not in correct state)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., listing already active or in a state that cannot be resumed)")
        }
    )
    public ResponseEntity<?> resumeListing(
            @Parameter(description = "ID of the listing to resume", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        String username = validateAndGetUsername(userDetails);
        if (username == null) {
            return createUnauthorizedResponse(request);
        }
        try {
            log.info("User {} attempting to resume listing ID {}", username, id);
            CarListingResponse response = carListingStatusService.resumeListing(id, username);
            log.info("Successfully resumed listing ID {} by user {}", id, username);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Resume listing failed for listing ID {}: {}", id, e.getMessage());
            String errorMessage = i18nService.getMessage("error.resource.not.found", request,
                    e.getResourceName(), e.getFieldName(), e.getFieldValue().toString());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", errorMessage));
        } catch (SecurityException | AccessDeniedException e) {
            log.warn("User {} not authorized to resume listing ID {}: {}", username, id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Resume listing failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }
}
