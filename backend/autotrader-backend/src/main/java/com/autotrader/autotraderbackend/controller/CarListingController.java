package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.service.CarListingStatusService;
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
    private final CarListingStatusService carListingStatusService;

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
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            log.info("User {} attempting to pause listing ID {}", userDetails.getUsername(), id);
            CarListingResponse response = carListingStatusService.pauseListing(id, userDetails.getUsername());
            log.info("Successfully paused listing ID {} by user {}", id, userDetails.getUsername());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.warn("Pause listing failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (SecurityException | AccessDeniedException e) {
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
            @ApiResponse(responseCode = "200", description = "Listing resumed successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden (not owner or listing not in correct state)"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict (e.g., listing already active or in a state that cannot be resumed)")
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
        } catch (SecurityException | AccessDeniedException e) {
            log.warn("User {} not authorized to resume listing ID {}: {}", userDetails.getUsername(), id, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Resume listing failed for listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        }
    }

    // Endpoint for approving listings moved to end of class

    @PostMapping(consumes = "application/json")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Create a new car listing (no image)",
        description = "Creates a new car listing with the provided details. Authentication required. The response will include an empty 'media' array initially.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "201", description = "Listing created successfully, includes empty media array", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
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
        description = "Creates a new car listing with the provided details and an initial image. Authentication required. The response includes the uploaded image in the 'media' array.",
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
        if (image == null || image.isEmpty()) {
            log.warn("Create listing with image request received empty file.");
            return ResponseEntity.badRequest().body(Map.of("message", "Image file is required and cannot be empty."));
        }
        CarListingResponse response = carListingService.createListing(createRequest, image, userDetails.getUsername());
        log.info("Successfully created listing with ID: {} and image", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/{listingId}/upload-image", consumes = {"multipart/form-data"})
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Upload an image for a car listing",
        description = "Uploads an image file for the specified car listing and associates it. Authentication required. The new media item will be added to the listing's media array.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "File uploaded successfully and associated with the listing.",
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"message\\\": \\\"File uploaded successfully\\\", \\\"imageKey\\\": \\\"listings/123/your-image.jpg\\\"}"))),
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

    // Renamed back from /approved for clarity, filtering happens in service
    @GetMapping
    @Operation(
        summary = "Get all approved, unsold, and unarchived car listings",
        description = "Returns a paginated list of all approved, unsold, and unarchived car listings (approved=true, sold=false, archived=false). Each listing includes an array of its associated media items (images/videos).",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of car listings, including media details", content = @Content(schema = @Schema(implementation = PageResponse.class)))
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
        summary = "Filter car listings (POST)",
        description = "Returns a paginated list of car listings matching the provided filter criteria in the request body. By default, only listings with approved=true, sold=false, and archived=false are returned unless explicitly overridden in the request. Each listing includes an array of its associated media items.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Filtered list of car listings, including media details", content = @Content(schema = @Schema(implementation = PageResponse.class)))
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
        summary = "Filter car listings by query parameters (GET)",
        description = "Returns a paginated list of car listings matching the provided filter criteria as query parameters. Supports slug-based filtering (brandSlugs, modelSlugs). By default, only listings with approved=true, sold=false, and archived=false are returned unless explicitly overridden in the request. Each listing includes an array of its associated media items.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Filtered list of car listings, including media details", content = @Content(schema = @Schema(implementation = PageResponse.class)))
        }
    )
    public ResponseEntity<PageResponse<CarListingResponse>> getFilteredListingsByParams(
            // Slug-based parameters
            @Parameter(description = "Brand slugs (can be repeated for multiple brands)", example = "toyota") 
            @RequestParam(required = false) List<String> brandSlugs,
            
            @Parameter(description = "Model slugs (can be repeated for multiple models)", example = "camry") 
            @RequestParam(required = false) List<String> modelSlugs,
            
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs (can be repeated for multiple locations)", example = "damascus") 
            @RequestParam(required = false) List<String> location,
            @Parameter(description = "Location ID") @RequestParam(required = false) Long locationId,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage,
            @Parameter(description = "Show sold listings") @RequestParam(required = false) Boolean isSold,
            @Parameter(description = "Show archived listings") @RequestParam(required = false) Boolean isArchived,
            @Parameter(description = "Filter by seller type ID") @RequestParam(required = false) Long sellerTypeId,
            @Parameter(description = "Search query for text-based search (supports English and Arabic)") @RequestParam(required = false) String searchQuery,
            @PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        
        log.info("Filtering listings: brandSlugs={}, modelSlugs={}", 
                 brandSlugs, modelSlugs);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        
        // Set slug-based filters
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);
        
        // Set existing filters (unchanged)
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setLocationId(locationId);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        filterRequest.setIsSold(isSold);
        filterRequest.setIsArchived(isArchived);
        filterRequest.setSellerTypeId(sellerTypeId);
        filterRequest.setSearchQuery(searchQuery);
        
        // Validate input
        validateFilterRequest(filterRequest);
        
        Page<CarListingResponse> listingPage = carListingService.getFilteredListings(filterRequest, pageable);
        PageResponse<CarListingResponse> response = new PageResponse<>(
            listingPage.getContent(),
            listingPage.getNumber(),
            listingPage.getSize(),
            listingPage.getTotalElements(),
            listingPage.getTotalPages(),
            listingPage.isLast()
        );
        
        log.info("Returning {} filtered listings for {} brand slugs, {} model slugs", 
                 response.getContent().size(),
                 brandSlugs != null ? brandSlugs.size() : 0,
                 modelSlugs != null ? modelSlugs.size() : 0);
        return ResponseEntity.ok(response);
    }

    /**
     * Validates filter request parameters.
     */
    private void validateFilterRequest(ListingFilterRequest filter) {
        // Validate brand slugs
        List<String> brandSlugs = filter.getNormalizedBrandSlugs();
        if (brandSlugs.size() > 10) {
            throw new IllegalArgumentException("Too many brand filters (max 10)");
        }
        
        // Validate model slugs
        List<String> modelSlugs = filter.getNormalizedModelSlugs();
        if (modelSlugs.size() > 20) {
            throw new IllegalArgumentException("Too many model filters (max 20)");
        }
        
        // Additional validation can be added here for other parameters
    }

    @GetMapping("/count")
    @Operation(
        summary = "Get total count of approved car listings",
        description = "Returns the total count of all approved, unsold, and unarchived car listings (approved=true, sold=false, archived=false).",
        responses = {
            @ApiResponse(responseCode = "200", description = "Total count of approved listings", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"count\\\": 150}"))),
            @ApiResponse(responseCode = "500", description = "Internal server error")
        }
    )
    public ResponseEntity<Map<String, Long>> getApprovedListingsCount() {
        try {
            log.info("Received request to get count of all approved listings");
            long count = carListingService.getApprovedListingsCount();
            log.info("Returning count of approved listings: {}", count);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Error getting approved listings count: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("count", 0L));
        }
    }

    @PostMapping("/count")
    @Operation(
        summary = "Get count of car listings matching filter criteria (POST)",
        description = "Returns the count of car listings matching the provided filter criteria in the request body. By default, only listings with approved=true, sold=false, and archived=false are counted unless explicitly overridden in the request.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of filtered listings", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"count\\\": 42}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getFilteredListingsCount(
            @Valid @RequestBody ListingFilterRequest filterRequest) {
        log.info("Received request to count filtered listings. Filter: {}", filterRequest);
        long count = carListingService.getFilteredListingsCount(filterRequest);
        log.info("Returning count of filtered listings: {}", count);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/count/filter")
    @Operation(
        summary = "Get count of car listings by query parameters (GET)",
        description = "Returns the count of car listings matching the provided filter criteria as query parameters. Supports slug-based filtering (brandSlugs, modelSlugs). By default, only listings with approved=true, sold=false, and archived=false are counted unless explicitly overridden in the request.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of filtered listings", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"count\\\": 25}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getFilteredListingsCountByParams(
            // Slug-based parameters
            @Parameter(description = "Brand slugs (can be repeated for multiple brands)", example = "toyota") 
            @RequestParam(required = false) List<String> brandSlugs,
            
            @Parameter(description = "Model slugs (can be repeated for multiple models)", example = "camry") 
            @RequestParam(required = false) List<String> modelSlugs,
            
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs (can be repeated for multiple locations)", example = "damascus") 
            @RequestParam(required = false) List<String> location,
            @Parameter(description = "Location ID") @RequestParam(required = false) Long locationId,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage,
            @Parameter(description = "Show sold listings") @RequestParam(required = false) Boolean isSold,
            @Parameter(description = "Show archived listings") @RequestParam(required = false) Boolean isArchived,
            @Parameter(description = "Filter by seller type ID") @RequestParam(required = false) Long sellerTypeId,
            @Parameter(description = "Search query for text-based search (supports English and Arabic)") @RequestParam(required = false) String searchQuery) {
        
        log.info("Counting listings: brandSlugs={}, modelSlugs={}", 
                 brandSlugs, modelSlugs);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        
        // Set slug-based filters
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);
        
        // Set existing filters (unchanged)
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setLocationId(locationId);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        filterRequest.setIsSold(isSold);
        filterRequest.setIsArchived(isArchived);
        filterRequest.setSellerTypeId(sellerTypeId);
        filterRequest.setSearchQuery(searchQuery);
        
        // Validate input
        validateFilterRequest(filterRequest);
        
        long count = carListingService.getFilteredListingsCount(filterRequest);
        
        log.info("Returning count of filtered listings: {} for {} brand slugs, {} model slugs", 
                 count,
                 brandSlugs != null ? brandSlugs.size() : 0,
                 modelSlugs != null ? modelSlugs.size() : 0);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/counts/breakdown")
    @Operation(
        summary = "Get count breakdown for all filter options",
        description = "Returns counts for each available filter option (brands, models, years, etc.) that can be used to display counts in filter UI.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count breakdown for filter options", 
                         content = @Content(mediaType = "application/json"))
        }
    )
    public ResponseEntity<Map<String, Object>> getFilterBreakdown() {
        log.info("Received request for filter breakdown");
        
        Map<String, Object> breakdown = carListingService.getFilterBreakdown(null);
        
        return ResponseEntity.ok(breakdown);
    }

    @PostMapping("/counts/breakdown")
    @Operation(
        summary = "Get count breakdown for filter options with existing filters",
        description = "Returns counts for each available filter option (brands, models, years, etc.) that can be used to display counts in filter UI. Accepts existing filters to show counts within those constraints.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count breakdown for filter options", 
                         content = @Content(mediaType = "application/json"))
        }
    )
    public ResponseEntity<Map<String, Object>> getFilterBreakdownWithFilters(
            @Valid @RequestBody(required = false) ListingFilterRequest existingFilters) {
        log.info("Received request for filter breakdown with existing filters: {}", existingFilters);
        
        Map<String, Object> breakdown = carListingService.getFilterBreakdown(existingFilters);
        
        log.info("Returning filter breakdown with {} categories", breakdown.size());
        return ResponseEntity.ok(breakdown);
    }

    @GetMapping("/counts/years")
    @Operation(
        summary = "Get count of listings by year",
        description = "Returns count of listings for each model year, sorted newest first (like AutoTrader UK). Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by year", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"2024\\\": 150, \\\"2023\\\": 200, \\\"2022\\\": 180}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByYear(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage) {
        
        log.info("Getting counts by year with filters: brands={}, models={}", brandSlugs, modelSlugs);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        
        Map<String, Long> yearCounts = carListingService.getCountsByYear(filterRequest);
        log.info("Returning year counts for {} years", yearCounts.size());
        return ResponseEntity.ok(yearCounts);
    }

    @GetMapping("/counts/brands")
    @Operation(
        summary = "Get count of listings by brand",
        description = "Returns count of listings for each brand. Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by brand", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"toyota\\\": 120, \\\"honda\\\": 95, \\\"nissan\\\": 80}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByBrand(
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice) {
        
        log.info("Getting counts by brand with filters: models={}, years={}-{}", modelSlugs, minYear, maxYear);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setModelSlugs(modelSlugs);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        
        Map<String, Long> brandCounts = carListingService.getCountsByBrand(filterRequest);
        log.info("Returning brand counts for {} brands", brandCounts.size());
        return ResponseEntity.ok(brandCounts);
    }

    @GetMapping("/counts/models")
    @Operation(
        summary = "Get count of listings by model",
        description = "Returns count of listings for each model. Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by model", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"camry\\\": 45, \\\"civic\\\": 38, \\\"corolla\\\": 52}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsByModel(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice) {
        
        log.info("Getting counts by model with filters: brands={}, years={}-{}", brandSlugs, minYear, maxYear);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        
        Map<String, Long> modelCounts = carListingService.getCountsByModel(filterRequest);
        log.info("Returning model counts for {} models", modelCounts.size());
        return ResponseEntity.ok(modelCounts);
    }

    @GetMapping("/counts/seller-types")
    @Operation(
        summary = "Get count of listings by seller type",
        description = "Returns count of listings for each seller type (Business/Private). Optionally accepts filter parameters to constrain the results.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Count of listings by seller type", 
                         content = @Content(mediaType = "application/json",
                                            schema = @Schema(type = "object", example = "{\\\"private\\\": 22771, \\\"dealer\\\": 118102}")))
        }
    )
    public ResponseEntity<Map<String, Long>> getCountsBySellerType(
            @Parameter(description = "Brand slugs to filter by") @RequestParam(required = false) List<String> brandSlugs,
            @Parameter(description = "Model slugs to filter by") @RequestParam(required = false) List<String> modelSlugs,
            @Parameter(description = "Minimum year") @RequestParam(required = false) Integer minYear,
            @Parameter(description = "Maximum year") @RequestParam(required = false) Integer maxYear,
            @Parameter(description = "Location slugs to filter by") @RequestParam(required = false) List<String> location,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum mileage") @RequestParam(required = false) Integer minMileage,
            @Parameter(description = "Maximum mileage") @RequestParam(required = false) Integer maxMileage) {
        
        log.info("Getting counts by seller type with filters: brands={}, models={}, years={}-{}", 
                brandSlugs, modelSlugs, minYear, maxYear);
        
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(brandSlugs);
        filterRequest.setModelSlugs(modelSlugs);
        filterRequest.setMinYear(minYear);
        filterRequest.setMaxYear(maxYear);
        filterRequest.setLocations(location);
        filterRequest.setMinPrice(minPrice);
        filterRequest.setMaxPrice(maxPrice);
        filterRequest.setMinMileage(minMileage);
        filterRequest.setMaxMileage(maxMileage);
        
        Map<String, Long> sellerTypeCounts = carListingService.getCountsBySellerType(filterRequest);
        log.info("Returning seller type counts for {} seller types", sellerTypeCounts.size());
        return ResponseEntity.ok(sellerTypeCounts);
    }

    @GetMapping("/{id:[0-9]+}")
    @Operation(
        summary = "Get car listing by ID",
        description = "Returns the details of a car listing by its ID, including an array of its associated media items. Only approved listings (approved=true) can be accessed through this endpoint.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Car listing details, including media", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
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
        description = "Returns all car listings created by the currently authenticated user. Each listing includes an array of its associated media items.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "List of user's car listings, including media details", content = @Content(array = @io.swagger.v3.oas.annotations.media.ArraySchema(schema = @Schema(implementation = CarListingResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
        }
    )
    public ResponseEntity<List<CarListingResponse>> getMyListings(@AuthenticationPrincipal UserDetails userDetails) {
        log.debug("Request received for listings owned by user: {}", userDetails.getUsername());
        List<CarListingResponse> myListings = carListingService.getMyListings(userDetails.getUsername());
        log.debug("Returning {} listings for user: {}", myListings.size(), userDetails.getUsername());
        return ResponseEntity.ok(myListings);
    }



    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Update an existing car listing",
        description = "Updates a car listing with the provided details. Only the owner of the listing can update it. The response includes the updated listing details with its media.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing updated successfully, includes media details", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
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

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(
        summary = "Get all car listings (Admin only)",
        description = "Returns all car listings regardless of approval status. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listings retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
        }
    )
    public ResponseEntity<PageResponse<CarListingResponse>> getAllListingsAsAdmin(
            @PageableDefault(size = 20, sort = "id", direction = org.springframework.data.domain.Sort.Direction.DESC) 
            Pageable pageable) {
        
        try {
            log.info("Admin requested to get all listings. Pageable: {}", pageable);
            Page<CarListingResponse> listingPage = carListingService.getAllListingsAsAdmin(pageable);
            
            PageResponse<CarListingResponse> response = new PageResponse<>(
                    listingPage.getContent(),
                    listingPage.getNumber(),
                    listingPage.getSize(),
                    listingPage.getTotalElements(),
                    listingPage.getTotalPages(),
                    listingPage.isLast()
            );
            
            log.info("Returning {} total listings to admin", response.getContent().size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting all listings for admin", e);
            throw e;
        }
    }

    @PutMapping("/admin/{id}/approve")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(
        summary = "Approve a car listing (Admin only)",
        description = "Approves a car listing, making it visible to the public. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing approved successfully", 
                content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
            @ApiResponse(responseCode = "400", description = "Bad request - Invalid listing state"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found"),
            @ApiResponse(responseCode = "409", description = "Conflict - Listing already approved")
        }
    )
    public ResponseEntity<?> approveListingAsAdmin(
            @Parameter(description = "ID of the listing to approve", required = true)
            @PathVariable("id") Long id) {
        
        try {
            log.info("Admin requested to approve listing with ID: {}", id);
            CarListingResponse approvedListing = carListingService.approveListingAsAdmin(id);
            log.info("Admin successfully approved listing with ID: {}", id);
            return ResponseEntity.ok(Map.of(
                "message", "Listing approved successfully",
                "listing", approvedListing
            ));
        } catch (ResourceNotFoundException e) {
            log.error("Listing not found with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Listing not found", "message", e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Invalid operation on listing ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Conflict", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error approving listing with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error", "message", "Failed to approve listing"));
        }
    }

    @PutMapping("/admin/{id}/reject")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(
        summary = "Reject a car listing (Admin only)",
        description = "Rejects a car listing by deleting it. Admin access required.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing rejected successfully"),
            @ApiResponse(responseCode = "400", description = "Bad request - Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Listing not found")
        }
    )
    public ResponseEntity<?> rejectListingAsAdmin(
            @Parameter(description = "ID of the listing to reject", required = true)
            @PathVariable("id") Long id,
            @Parameter(description = "Rejection reason")
            @RequestBody(required = false) Map<String, String> rejectionData) {
        
        try {
            log.info("Admin requested to reject listing with ID: {}", id);
            String reason = rejectionData != null ? rejectionData.get("reason") : "Rejected by admin";
            
            // For now, we'll delete the listing when rejected
            // In the future, you might want to add a rejected status instead
            carListingService.deleteListingAsAdmin(id);
            
            log.info("Admin successfully rejected and deleted listing with ID: {} with reason: {}", id, reason);
            return ResponseEntity.ok(Map.of(
                "message", "Listing rejected and removed successfully",
                "listingId", id,
                "reason", reason
            ));
        } catch (ResourceNotFoundException e) {
            log.error("Listing not found with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Listing not found", "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error rejecting listing with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error", "message", "Failed to reject listing"));
        }
    }

    @PostMapping("/{id}/mark-sold")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Mark a car listing as sold",
        description = "Marks the specified car listing as sold. Only the owner of the listing can perform this action. Cannot be performed on an archived listing.",
        security = @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearer-token"),
        responses = {
            @ApiResponse(responseCode = "200", description = "Listing marked as sold successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
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
            @ApiResponse(responseCode = "200", description = "Listing archived successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
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
            @ApiResponse(responseCode = "200", description = "Listing unarchived successfully", content = @Content(schema = @Schema(implementation = CarListingResponse.class))),
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

}


