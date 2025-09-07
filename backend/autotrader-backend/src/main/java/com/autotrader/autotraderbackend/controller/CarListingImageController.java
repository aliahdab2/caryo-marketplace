package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.service.I18nService;
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

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing Images", description = "Manage car listing images")
public class CarListingImageController {

    private final CarListingService carListingService;
    private final I18nService i18nService;

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
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        log.info("Received request to upload image for listing ID: {}", listingId);

        // UserDetails null check might be redundant due to @PreAuthorize, but good practice
        if (userDetails == null) {
            log.warn("Unauthorized attempt to upload image for listing ID: {} (UserDetails is null)", listingId);
            String errorMessage = i18nService.getMessage("error.image.upload.unauthorized", request);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", errorMessage));
        }
        if (file.isEmpty()) {
            log.warn("Upload request for listing ID {} received empty file.", listingId);
            String errorMessage = i18nService.getMessage("error.image.upload.empty", request);
            return ResponseEntity.badRequest().body(Map.of("message", errorMessage));
        }
        try {
            // Corrected argument order: listingId, file, username
            String imageKey = carListingService.uploadListingImage(listingId, file, userDetails.getUsername());
            log.info("Successfully processed image upload for listing ID: {}. Image Key: {}", listingId, imageKey);
            // Return the key or a message. Generating signed URL here might be premature.
            String successMessage = i18nService.getMessage("image.upload.success", request);
            return ResponseEntity.ok(Map.of("message", successMessage, "imageKey", imageKey));
        } catch (StorageException e) {
            log.error("Storage exception during image upload for listing ID: {}", listingId, e);
            String errorMessage = i18nService.getMessage("error.image.upload.failed", request, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", errorMessage));
        } catch (ResourceNotFoundException e) {
            log.warn("Resource not found during image upload attempt for listing ID: {}", listingId);
            String errorMessage = i18nService.getMessage("error.listing.not.found", request);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", errorMessage));
        } catch (AccessDeniedException | SecurityException e) { // Catch SecurityException from service too
             log.warn("Access denied during image upload attempt for listing ID: {} by user: {}", listingId, userDetails.getUsername());
             String errorMessage = i18nService.getMessage("error.unauthorized.access", request);
             return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", errorMessage));
        } catch (Exception e) { // Catch any other unexpected errors
            log.error("Error uploading image for listing ID {}: {}", listingId, e.getMessage(), e);
            String errorMessage = i18nService.getMessage("error.image.upload.generic", request, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", errorMessage));
        }
    }
}
