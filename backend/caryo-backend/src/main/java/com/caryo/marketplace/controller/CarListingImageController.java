package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.BadRequestException;
import com.caryo.marketplace.service.CarListingService;
import com.caryo.marketplace.service.I18nService;
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
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

import static com.caryo.marketplace.payload.response.ApiResponse.success;

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

        if (file.isEmpty()) {
            log.warn("Upload request for listing ID {} received empty file.", listingId);
            String errorMessage = i18nService.getMessage("error.image.upload.empty", request);
            throw new BadRequestException(errorMessage);
        }

        String imageKey = carListingService.uploadListingImage(listingId, file, userDetails.getUsername());
        log.info("Successfully processed image upload for listing ID: {}. Image Key: {}", listingId, imageKey);
        String successMessage = i18nService.getMessage("image.upload.success", request);
        return ResponseEntity.ok(success(Map.of("imageKey", imageKey), successMessage));
    }
}
