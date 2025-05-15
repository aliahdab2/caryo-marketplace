package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Favorite;
import com.autotrader.autotraderbackend.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
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
@Tag(name = "Favorites", description = "Endpoints for managing user favorites")
public class FavoriteController {
    private final FavoriteService favoriteService;

    @PostMapping("/{listingId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Add listing to favorites",
        description = "Adds the specified car listing to the authenticated user's favorites",
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing added to favorites"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
        }
    )
    public ResponseEntity<Favorite> addToFavorites(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long listingId) {
        log.debug("REST request to add listing {} to favorites for user {}", listingId, userDetails.getUsername());
        return ResponseEntity.ok(favoriteService.addToFavorites(userDetails.getUsername(), listingId));
    }

    @DeleteMapping("/{listingId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Remove listing from favorites",
        description = "Removes the specified car listing from the authenticated user's favorites",
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing removed from favorites"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
        }
    )
    public ResponseEntity<Void> removeFromFavorites(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long listingId) {
        log.debug("REST request to remove listing {} from favorites for user {}", listingId, userDetails.getUsername());
        favoriteService.removeFromFavorites(userDetails.getUsername(), listingId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Get user favorites",
        description = "Returns all car listings that the authenticated user has marked as favorite",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of favorite listings"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
        }
    )
    public ResponseEntity<List<CarListing>> getUserFavorites(@AuthenticationPrincipal UserDetails userDetails) {
        log.debug("REST request to get favorites for user {}", userDetails.getUsername());
        return ResponseEntity.ok(favoriteService.getUserFavorites(userDetails.getUsername()));
    }

    @GetMapping("/{listingId}/check")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Check if listing is favorite",
        description = "Checks if the specified listing is in the authenticated user's favorites",
        responses = {
            @ApiResponse(responseCode = "200", description = "Returns true if listing is favorite, false otherwise"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
        }
    )
    public ResponseEntity<Boolean> isFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long listingId) {
        log.debug("REST request to check if listing {} is favorite for user {}", listingId, userDetails.getUsername());
        return ResponseEntity.ok(favoriteService.isFavorite(userDetails.getUsername(), listingId));
    }
} 