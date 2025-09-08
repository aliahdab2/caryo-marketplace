package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST controller for car listing creation operations.
 * Provides endpoints for creating new car listings with or without images.
 *
 * This controller was extracted from CarListingController during refactoring
 * to improve code organization and maintainability while maintaining
 * backward compatibility with existing API endpoints.
 */
@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing Creation", description = "Create new car listings with or without images")
public class CarListingCreationController {

    private final CarListingService carListingService;

    @PostMapping(consumes = "application/json")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Create a new car listing (no image)",
        description = "Creates a new car listing with the provided details. Authentication and email verification required. The response will include an empty 'media' array initially.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Listing created successfully, includes empty media array", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Email verification required")
        }
    )
    public ResponseEntity<?> createListing(
            @Valid @RequestBody CreateListingRequest createRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Received request to create listing from user: {}", userDetails.getUsername());

        // Check if user can create listings (email verified)
        if (!carListingService.canUserCreateListings(userDetails.getUsername())) {
            log.warn("User {} attempted to create listing without email verification", userDetails.getUsername());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Email verification required to create listings. Please check your email and verify your account."));
        }

        CarListingResponse response = carListingService.createListingWithMedia(createRequest, null, userDetails.getUsername());
        log.info("Successfully created listing with ID: {}", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/with-image", consumes = "multipart/form-data")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Create a new car listing with image",
        description = "Creates a new car listing with the provided details and an initial image. Authentication and email verification required. The response includes the uploaded image in the 'media' array.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Listing created successfully, includes initial media item", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or image"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
        }
    )
    public ResponseEntity<?> createListingWithImage(
            @Parameter(description = "Car listing details", required = true)
            @Valid @RequestPart("listing") CreateListingRequest createRequest,
            @Parameter(description = "Image file (JPEG, PNG, GIF, or WebP)", required = true, schema = @Schema(type = "string", format = "binary"))
            @RequestPart("image") MultipartFile image,
            @Parameter(hidden = true)
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            log.warn("Unauthorized attempt to create listing with image (UserDetails is null)");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User must be logged in to create listings."));
        }

        log.debug("Received request to create listing with image from user: {}", userDetails.getUsername());

        // Check if user can create listings (email verified)
        if (!carListingService.canUserCreateListings(userDetails.getUsername())) {
            log.warn("User {} attempted to create listing with image without email verification", userDetails.getUsername());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Email verification required to create listings. Please check your email and verify your account."));
        }

        if (image == null || image.isEmpty()) {
            log.warn("Create listing with image request received empty file.");
            return ResponseEntity.badRequest().body(Map.of("message", "Image file is required and cannot be empty."));
        }
        CarListingResponse response = carListingService.createListingWithMedia(createRequest, image, userDetails.getUsername());
        log.info("Successfully created listing with ID: {} and image", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
