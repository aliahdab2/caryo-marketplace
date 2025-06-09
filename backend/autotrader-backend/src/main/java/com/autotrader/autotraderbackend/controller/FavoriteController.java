package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.ErrorResponse;
import com.autotrader.autotraderbackend.payload.response.FavoriteResponse;
import com.autotrader.autotraderbackend.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Favorites", description = "Endpoints for managing user favorites/watchlist for car listings")
public class FavoriteController {
    private final FavoriteService favoriteService;

    @PostMapping("/{listingId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Add listing to favorites",
        description = "Adds the specified car listing to the authenticated user's favorites/watchlist. If the listing is already in favorites, returns the existing favorite entry.",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Listing added to favorites successfully",
                content = @Content(schema = @Schema(implementation = FavoriteResponse.class))
            ),
            @ApiResponse(
                responseCode = "404",
                description = "Listing not found",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                responseCode = "401",
                description = "Unauthorized - User must be authenticated",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
        }
    )
    public ResponseEntity<FavoriteResponse> addToFavorites(
            @Parameter(description = "The authenticated user", hidden = true)
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID of the car listing to add to favorites", required = true)
            @PathVariable Long listingId) {
        log.debug("REST request to add listing {} to favorites for user {}", listingId, userDetails.getUsername());
        try {
            return ResponseEntity.ok(favoriteService.addToFavorites(userDetails.getUsername(), listingId));
        } catch (ResourceNotFoundException e) {
            log.error("Resource not found while adding to favorites: {}", e.getMessage());
            throw e; // Re-throw the exception so tests can catch it
        } catch (Exception e) {
            log.error("Error adding to favorites: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{listingId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Remove listing from favorites",
        description = "Removes the specified car listing from the authenticated user's favorites/watchlist. If the listing is not in favorites, the operation is silently ignored.",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Listing removed from favorites successfully"
            ),
            @ApiResponse(
                responseCode = "404",
                description = "Listing not found",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                responseCode = "401",
                description = "Unauthorized - User must be authenticated",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
        }
    )
    public ResponseEntity<Void> removeFromFavorites(
            @Parameter(description = "The authenticated user", hidden = true)
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID of the car listing to remove from favorites", required = true)
            @PathVariable Long listingId) {
        log.debug("REST request to remove listing {} from favorites for user {}", listingId, userDetails.getUsername());
        try {
            favoriteService.removeFromFavorites(userDetails.getUsername(), listingId);
            return ResponseEntity.ok().build();
        } catch (ResourceNotFoundException e) {
            log.error("Error removing from favorites: {}", e.getMessage());
            throw e; // Re-throw the exception so tests can catch it
        } catch (Exception e) {
            log.error("Error removing from favorites: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Get user favorites",
        description = "Returns all car listings that the authenticated user has marked as favorite/watchlist. The list is ordered by the date the listings were added to favorites, with the most recent first.",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "List of favorite listings retrieved successfully",
                content = @Content(schema = @Schema(implementation = CarListingResponse.class))
            ),
            @ApiResponse(
                responseCode = "401",
                description = "Unauthorized - User must be authenticated",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
        }
    )
    public ResponseEntity<List<CarListingResponse>> getUserFavorites(
            @Parameter(description = "The authenticated user", hidden = true)
            @AuthenticationPrincipal UserDetails userDetails) {
        log.debug("REST request to get favorites for user {}", userDetails.getUsername());
        try {
            return ResponseEntity.ok(favoriteService.getUserFavoriteListingResponses(userDetails.getUsername()));
        } catch (Exception e) {
            log.error("Error getting user favorites: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/check/{listingId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Check if listing is favorite",
        description = "Checks if the specified car listing is in the authenticated user's favorites/watchlist.",
        responses = {
            @ApiResponse(
                responseCode = "200",
                description = "Returns true if the listing is in favorites, false if user/listing not found or listing is not favorited",
                content = @Content(schema = @Schema(implementation = Boolean.class))
            ),
            @ApiResponse(
                responseCode = "401",
                description = "Unauthorized - User must be authenticated",
                content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
        }
    )
    public ResponseEntity<Boolean> isFavorite(
            @Parameter(description = "The authenticated user", hidden = true)
            @AuthenticationPrincipal UserDetails userDetails,
            @Parameter(description = "ID of the car listing to check favorite status", required = true)
            @PathVariable Long listingId) {
        log.debug("REST request to check if listing {} is favorite for user {}", listingId, userDetails.getUsername());
        try {
            boolean isFavorite = favoriteService.isFavorite(userDetails.getUsername(), listingId);
            log.debug("Listing {} is {} favorite for user {}", listingId, isFavorite ? "a" : "not a", userDetails.getUsername());
            return ResponseEntity.ok(isFavorite);
        } catch (Exception e) {
            log.error("Error checking favorite status: {}", e.getMessage());
            // Always return false on error to keep frontend working
            return ResponseEntity.ok(false);
        }
    }
}