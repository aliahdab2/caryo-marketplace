package com.caryo.marketplace.controller;

import com.caryo.marketplace.payload.request.SavedSearchRequest;
import com.caryo.marketplace.payload.response.SavedSearchResponse;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.security.ratelimit.RateLimit;
import com.caryo.marketplace.security.ratelimit.RateLimitKeyType;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.service.SavedSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing saved searches
 */
@RestController
@RequestMapping("/api/v1/saved-searches")

@RequiredArgsConstructor
@Slf4j
@Tag(name = "Saved Searches", description = "Manage user saved searches and notifications")
public class SavedSearchController {

    private final SavedSearchService savedSearchService;
    private final UserRepository userRepository;

    @Operation(
        summary = "Create a new saved search",
        description = "Create a new saved search with filter criteria and notification preferences"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Saved search created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @RateLimit(maxRequests = 20, windowSeconds = 3600, keyType = RateLimitKeyType.USER,
        message = "Too many saved searches created. Please try again later.")
    public ResponseEntity<SavedSearchResponse> createSavedSearch(
            @Valid @RequestBody SavedSearchRequest request,
            Authentication authentication) {

        log.info("Creating saved search for user: {}", authentication.getName());

        SavedSearchResponse response = savedSearchService.createSavedSearch(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
        summary = "Get all saved searches for current user",
        description = "Retrieve all saved searches created by the current user"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Saved searches retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<SavedSearchResponse>> getUserSavedSearches(
            Authentication authentication) {

        List<SavedSearchResponse> savedSearches = savedSearchService.getUserSavedSearches(authentication.getName());
        return ResponseEntity.ok(savedSearches);
    }



    @Operation(
        summary = "Get a specific saved search",
        description = "Retrieve a specific saved search by ID (user must own the search)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Saved search retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Saved search not found or access denied"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<SavedSearchResponse> getSavedSearch(
            @Parameter(description = "Saved search ID") @PathVariable UUID id,
            Authentication authentication) {

        try {
            SavedSearchResponse response = savedSearchService.getSavedSearchById(id, authentication.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Saved search {} not found or access denied for user {}", id, authentication.getName());
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
        summary = "Update a saved search",
        description = "Update an existing saved search (user must own the search)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Saved search updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "404", description = "Saved search not found or access denied"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<SavedSearchResponse> updateSavedSearch(
            @Parameter(description = "Saved search ID") @PathVariable UUID id,
            @Valid @RequestBody SavedSearchRequest request,
            Authentication authentication) {

        try {
            SavedSearchResponse response = savedSearchService.updateSavedSearch(id, request, authentication.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Saved search {} not found or access denied for user {}", id, authentication.getName());
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
        summary = "Deactivate a saved search",
        description = "Deactivate a saved search (stops notifications but keeps the search)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Saved search deactivated successfully"),
        @ApiResponse(responseCode = "404", description = "Saved search not found or access denied"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateSavedSearch(
            @Parameter(description = "Saved search ID") @PathVariable UUID id,
            Authentication authentication) {

        try {
            savedSearchService.deleteSavedSearch(id, authentication.getName());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.warn("Saved search {} not found or access denied for user {}", id, authentication.getName());
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
        summary = "Delete a saved search",
        description = "Permanently delete a saved search and all associated notifications"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Saved search deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Saved search not found or access denied"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSavedSearch(
            @Parameter(description = "Saved search ID") @PathVariable UUID id,
            Authentication authentication) {

        try {
            savedSearchService.deleteSavedSearch(id, authentication.getName());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.warn("Saved search {} not found or access denied for user {}", id, authentication.getName());
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
        summary = "Get saved search count",
        description = "Get the count of active saved searches for the current user"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Count retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @GetMapping("/count")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Long> getActiveSavedSearchCount(Authentication authentication) {
        long count = savedSearchService.getUserSavedSearchCount(authentication.getName());
        return ResponseEntity.ok(count);
    }

    /**
     * Helper method to get the current user from authentication
     */
    private User getCurrentUser(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
