package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.service.CarListingService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/listings")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing Images", description = "Manage car listing images")
public class CarListingImageController {

    private final CarListingService carListingService;

    @PostMapping("/{listingId}/upload-image")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Upload an image for a car listing",
        description = "Uploads an image file for the specified car listing and associates it. Authentication required. The new media item will be added to the listing's media array.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "File uploaded successfully and associated with the listing.",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\"message\": \"File uploaded successfully\", \"imageKey\": \"listings/123/your-image.jpg\"}"))),
            @ApiResponse(responseCode = "400", description = "File cannot be empty or invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (e.g., not owner of the listing)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "500", description = "Failed to upload file")
        }
    )
    public ResponseEntity<?> uploadListingImage(
            @Parameter(description = "ID of the listing to upload image for", required = true)
            @PathVariable Long listingId,
            @Parameter(
                name = "file",
                description = "The image file to upload (e.g., JPEG, PNG).",
                required = true,
                schema = @Schema(type = "string", format = "binary")
            )
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Received request to upload image for listing ID: {}", listingId);
        // UserDetails null check might be redundant due to @PreAuthorize, but good practice
        if (userDetails == null) {
            log.warn("Unauthorized attempt to upload image for listing ID: {} (UserDetails is null)", listingId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User must be logged in to upload images."));
        }
        if (file.isEmpty()) {
            log.warn("Upload request for listing ID {} received empty file.", listingId);
            return ResponseEntity.badRequest().body(Map.of("message", "Error: File cannot be empty!"));
        }
        try {
            // Corrected argument order: listingId, file, username
            String imageKey = carListingService.uploadListingImage(listingId, file, userDetails.getUsername());
            log.info("Successfully processed image upload for listing ID: {}. Image Key: {}", listingId, imageKey);
            // Return the key or a message. Generating signed URL here might be premature.
            return ResponseEntity.ok(Map.of("message", "File uploaded successfully", "imageKey", imageKey));
        } catch (StorageException e) {
            log.error("Storage exception during image upload for listing ID: {}", listingId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to upload file: " + e.getMessage()));
        } catch (ResourceNotFoundException e) {
            log.warn("Resource not found during image upload attempt for listing ID: {}", listingId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (AccessDeniedException | SecurityException e) { // Catch SecurityException from service too
             log.warn("Access denied during image upload attempt for listing ID: {} by user: {}", listingId, userDetails.getUsername());
             return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) { // Catch any other unexpected errors
            log.error("Error uploading image for listing ID {}: {}", listingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Error: Could not upload the file: " + e.getMessage()));
        }
    }
}
