package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listings", description = "Manage car listings (create, view, filter, etc.)")
public class CarListingController {

    private final CarListingService carListingService;

    // Endpoint for approving listings moved to end of class

    @PostMapping(consumes = "application/json")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Create a new car listing (no image)",
        description = "Creates a new car listing with the provided details. Authentication required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Listing created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
        }
    )
    public ResponseEntity<CarListingResponse> createListing(
            @Valid @RequestBody CreateListingRequest createRequest,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Received request to create listing from user: {}", userDetails.getUsername());
        CarListingResponse response = carListingService.createListing(createRequest, null, userDetails.getUsername());
        log.info("Successfully created listing with ID: {}", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/with-image", consumes = "multipart/form-data")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Create a new car listing with image",
        description = "Creates a new car listing with the provided details and image. Authentication required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Listing created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input or image"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
        }
    )
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
        content = @Content(mediaType = "multipart/form-data",
            schema = @Schema(type = "object", requiredProperties = {"listing", "image"}),
            encoding = @io.swagger.v3.oas.annotations.media.Encoding(
                name = "listing",
                contentType = "application/json"
            )))
    public ResponseEntity<CarListingResponse> createListingWithImage(
            @Parameter(description = "Car listing details", required = true)
            @Valid @RequestPart("listing") CreateListingRequest createRequest,
            @Parameter(description = "Image file (JPEG, PNG, GIF, or WebP)", required = true)
            @RequestPart("image") MultipartFile image,
            @Parameter(hidden = true)
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.info("Received request to create listing with image from user: {}", userDetails.getUsername());

        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        CarListingResponse response = carListingService.createListing(createRequest, image, userDetails.getUsername());
        log.info("Successfully created listing with ID: {} and image", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/{listingId}/upload-image", consumes = {"multipart/form-data"})
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Upload an image for a car listing",
        description = "Uploads an image file for the specified car listing. Authentication required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "File uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "File cannot be empty"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "500", description = "Failed to upload file")
        }
    )
    public ResponseEntity<?> uploadListingImage(@PathVariable Long listingId,
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

    // Renamed back from /approved for clarity, filtering happens in service
    @GetMapping
    @Operation(
        summary = "Get all approved car listings",
        description = "Returns a paginated list of all approved car listings.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of car listings")
        }
    )
    public ResponseEntity<PageResponse<CarListingResponse>> getAllListings(
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        log.info("Received request to get all approved listings. Pageable: {}", pageable);
        Page<CarListingResponse> listingPage = carListingService.getAllApprovedListings(pageable);
        PageResponse<CarListingResponse> response = new PageResponse<>(
            listingPage.getContent(),
            listingPage.getNumber(),
            listingPage.getSize(),
            listingPage.getTotalElements(),
            listingPage.getTotalPages(),
            listingPage.isLast()
        );
        log.info("Returning {} approved listings", response.getContent().size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/filter")
    @Operation(
        summary = "Filter car listings",
        description = "Returns a paginated list of car listings matching the provided filter criteria.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Filtered list of car listings")
        }
    )
    public ResponseEntity<PageResponse<CarListingResponse>> getFilteredListings(
            @Valid @RequestBody ListingFilterRequest filterRequest,
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        log.info("Received request to filter listings. Filter: {}, Pageable: {}", filterRequest, pageable);
        Page<CarListingResponse> listingPage = carListingService.getFilteredListings(filterRequest, pageable);
        PageResponse<CarListingResponse> response = new PageResponse<>(
            listingPage.getContent(),
            listingPage.getNumber(),
            listingPage.getSize(),
            listingPage.getTotalElements(),
            listingPage.getTotalPages(),
            listingPage.isLast()
        );
        log.info("Returning {} filtered listings", response.getContent().size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/filter")
    @Operation(
        summary = "Filter car listings by query parameters",
        description = "Returns a paginated list of car listings matching the provided filter criteria as query parameters.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Filtered list of car listings")
        }
    )
    public ResponseEntity<PageResponse<CarListingResponse>> getFilteredListingsByParams(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) Integer minYear,
            @RequestParam(required = false) Integer maxYear,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minMileage,
            @RequestParam(required = false) Integer maxMileage,
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        log.info("Received GET request to filter listings. Pageable: {}", pageable);
        // Create filter request from query parameters
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrand(brand);
        filterRequest.setModel(model);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocation(location);
        filterRequest.setLocationId(locationId);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        Page<CarListingResponse> listingPage = carListingService.getFilteredListings(filterRequest, pageable);
        PageResponse<CarListingResponse> response = new PageResponse<>(
            listingPage.getContent(),
            listingPage.getNumber(),
            listingPage.getSize(),
            listingPage.getTotalElements(),
            listingPage.getTotalPages(),
            listingPage.isLast()
        );
        log.info("Returning {} filtered listings", response.getContent().size());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get car listing by ID",
        description = "Returns the details of a car listing by its ID.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Car listing details"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
        }
    )
    public ResponseEntity<CarListingResponse> getListingById(@PathVariable Long id) {
        log.debug("Request received for listing ID: {}", id);
        // Service method handles not found exception
        CarListingResponse listing = carListingService.getListingById(id);
        log.debug("Returning listing details for ID: {}", id);
        return ResponseEntity.ok(listing);
    }

    @GetMapping("/my-listings")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Get listings for the current user",
        description = "Returns all car listings created by the currently authenticated user.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "List of user's car listings"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
        }
    )
    public ResponseEntity<List<CarListingResponse>> getMyListings(@AuthenticationPrincipal UserDetails userDetails) {
        log.debug("Request received for listings owned by user: {}", userDetails.getUsername());
        List<CarListingResponse> myListings = carListingService.getMyListings(userDetails.getUsername());
        log.debug("Returning {} listings for user: {}", myListings.size(), userDetails.getUsername());
        return ResponseEntity.ok(myListings);
    }

    // Changed back to POST as it modifies state
    @RequestMapping(value = "/{id}/approve", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Approve a car listing",
        description = "Approves a car listing. Only accessible by admins.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing approved successfully"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Listing already approved"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
        }
    )
    public ResponseEntity<?> approveListing(@PathVariable Long id) {
        log.info("Received request to approve listing ID: {}", id);
        try {
            CarListingResponse approvedListing = carListingService.approveListing(id);
            log.info("Successfully approved listing ID: {}", id);
            return ResponseEntity.ok(approvedListing);
        } catch (ResourceNotFoundException e) {
            log.warn("Resource not found during approval attempt for listing ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) { // Catch if already approved
            log.warn("Approval attempt failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Update an existing car listing",
        description = "Updates a car listing with the provided details. Only the owner of the listing can update it.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
        }
    )
    public ResponseEntity<CarListingResponse> updateListing(
            @Parameter(description = "ID of the listing to update", required = true)
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateListingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            log.info("Received request to update listing with ID: {}", id);
            CarListingResponse updatedListing = carListingService.updateListing(id, request, userDetails.getUsername());
            log.info("Successfully updated listing with ID: {}", id);
            return ResponseEntity.ok(updatedListing);
        } catch (ResourceNotFoundException e) {
            log.error("Listing not found with ID: {}", id, e);
            throw e;
        } catch (SecurityException e) {
            log.error("User {} not authorized to update listing with ID: {}", userDetails.getUsername(), id, e);
            throw new AccessDeniedException(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating listing with ID: {}", id, e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a car listing",
        description = "Deletes a car listing. Only the owner of the listing can delete it.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Listing deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
        }
    )
    public ResponseEntity<Void> deleteListing(
            @Parameter(description = "ID of the listing to delete", required = true)
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        try {
            log.info("Received request to delete listing with ID: {}", id);
            carListingService.deleteListing(id, userDetails.getUsername());
            log.info("Successfully deleted listing with ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Listing not found with ID: {}", id, e);
            throw e;
        } catch (SecurityException e) {
            log.error("User {} not authorized to delete listing with ID: {}", userDetails.getUsername(), id, e);
            throw new AccessDeniedException(e.getMessage());
        } catch (Exception e) {
            log.error("Error deleting listing with ID: {}", id, e);
            throw e;
        }
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        summary = "Delete a car listing (Admin only)",
        description = "Deletes any car listing. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "204", description = "Listing deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
        }
    )
    public ResponseEntity<Void> deleteListingAsAdmin(
            @Parameter(description = "ID of the listing to delete", required = true)
            @PathVariable("id") Long id) {
        
        try {
            log.info("Admin requested to delete listing with ID: {}", id);
            carListingService.deleteListingAsAdmin(id);
            log.info("Admin successfully deleted listing with ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException e) {
            log.error("Listing not found with ID: {}", id, e);
            throw e;
        } catch (Exception e) {
            log.error("Error deleting listing with ID: {}", id, e);
            throw e;
        }
    }
    
    // Empty comment to preserve code structure - duplicate endpoint removed
}


