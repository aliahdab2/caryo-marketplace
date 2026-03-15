package com.caryo.marketplace.controller;

import com.caryo.marketplace.payload.request.ListingFilterRequest;
import com.caryo.marketplace.payload.request.UpdateListingRequest;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.payload.response.PageResponse;
import com.caryo.marketplace.service.CarListingService;
import com.caryo.marketplace.service.CarListingStatusService;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for car listing CRUD operations.
 * Provides endpoints for reading, updating, deleting, and managing listing status.
 *
 * This controller was extracted from CarListingController during refactoring
 * to improve code organization and maintainability while maintaining
 * backward compatibility with existing API endpoints.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing CRUD", description = "CRUD operations for car listings (read, update, delete, status)")
public class CarListingCrudController {

    private final CarListingService carListingService;
    private final CarListingStatusService carListingStatusService;

    // READ OPERATIONS

    @GetMapping("/api/listings")
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

    @PostMapping("/api/listings/filter")
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

    @GetMapping("/api/listings/filter")
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
            @Parameter(description = "Filter by seller type IDs") @RequestParam(required = false) List<Long> sellerTypeIds,
            @Parameter(description = "Filter by transmission IDs") @RequestParam(required = false) List<Long> transmissionIds,
            @Parameter(description = "Filter by fuel type slugs (can be repeated for multiple fuel types)", example = "gasoline") @RequestParam(required = false) List<String> fuelTypeSlugs,
            @Parameter(description = "Filter by body type") @RequestParam(required = false) List<String> bodyType,
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
        filterRequest.setSellerTypeIds(sellerTypeIds);
        filterRequest.setTransmissionIds(transmissionIds);
        filterRequest.setFuelTypeSlugs(fuelTypeSlugs);
        // Handle hyphen-separated body types
        if (bodyType != null && !bodyType.isEmpty()) {
            List<String> bodyTypes = new ArrayList<>();
            for (String type : bodyType) {
                if (type != null && !type.trim().isEmpty()) {
                    bodyTypes.addAll(Arrays.asList(type.split("-")));
                }
            }
            // Clean and normalize the body types
            List<String> normalizedBodyTypes = bodyTypes.stream()
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .distinct()
                .collect(Collectors.toList());

            filterRequest.setBodyStyleSlugs(normalizedBodyTypes);
        }
        filterRequest.setSearchQuery(searchQuery);

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

    @GetMapping("/api/listings/{id:[0-9]+}")
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

    @GetMapping("/api/listings/my-listings")
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

    // UPDATE OPERATION

    @PutMapping("/api/listings/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Update an existing car listing",
        description = "Updates a car listing with the provided details. Only the owner of the listing or an admin can update it. The response includes the updated listing details with its media.",
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

        log.info("Received request to update listing with ID: {}", id);
        CarListingResponse updatedListing = carListingService.updateListing(id, request, userDetails.getUsername());
        log.info("Successfully updated listing with ID: {}", id);
        return ResponseEntity.ok(updatedListing);
    }

    // DELETE OPERATIONS

    @DeleteMapping("/api/listings/{id}")
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

        log.info("Received request to delete listing with ID: {}", id);
        carListingService.deleteListing(id, userDetails.getUsername());
        log.info("Successfully deleted listing with ID: {}", id);
        return ResponseEntity.noContent().build();
    }


    // STATUS OPERATIONS

    @PostMapping("/api/listings/{id}/mark-sold")
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
    public ResponseEntity<CarListingResponse> markListingAsSold(
            @Parameter(description = "ID of the listing to mark as sold", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("User {} attempting to mark listing ID {} as sold", userDetails.getUsername(), id);
        CarListingResponse response = carListingStatusService.markListingAsSold(id, userDetails.getUsername());
        log.info("Successfully marked listing ID {} as sold by user {}", id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/listings/{id}/archive")
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
    public ResponseEntity<CarListingResponse> archiveListing(
            @Parameter(description = "ID of the listing to archive", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("User {} attempting to archive listing ID {}", userDetails.getUsername(), id);
        CarListingResponse response = carListingStatusService.archiveListing(id, userDetails.getUsername());
        log.info("Successfully archived listing ID {} by user {}", id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/listings/{id}/unarchive")
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
    public ResponseEntity<CarListingResponse> unarchiveListing(
            @Parameter(description = "ID of the listing to unarchive", required = true) @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("User {} attempting to unarchive listing ID {}", userDetails.getUsername(), id);
        CarListingResponse response = carListingStatusService.unarchiveListing(id, userDetails.getUsername());
        log.info("Successfully unarchived listing ID {} by user {}", id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
