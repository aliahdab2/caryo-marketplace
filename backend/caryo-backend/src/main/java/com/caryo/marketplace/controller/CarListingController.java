package com.caryo.marketplace.controller;


import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.payload.response.PageResponse;
import com.caryo.marketplace.service.CarListingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static com.caryo.marketplace.payload.response.ApiResponse.success;

@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing Admin", description = "Admin operations for car listings (approve, reject, delete, view all)")
public class CarListingController {

    private final CarListingService carListingService;


    // Endpoint for approving listings moved to end of class










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

        log.info("Admin requested to delete listing with ID: {}", id);
        carListingService.deleteListingAsAdmin(id);
        log.info("Admin successfully deleted listing with ID: {}", id);
        return ResponseEntity.noContent().build();
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

        log.info("Admin requested to approve listing with ID: {}", id);
        CarListingResponse approvedListing = carListingService.approveListingAsAdmin(id);
        log.info("Admin successfully approved listing with ID: {}", id);
        return ResponseEntity.ok(success(approvedListing, "Listing approved successfully"));
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

        log.info("Admin requested to reject listing with ID: {}", id);
        String reason = rejectionData != null ? rejectionData.get("reason") : "Rejected by admin";

        carListingService.deleteListingAsAdmin(id);

        log.info("Admin successfully rejected and deleted listing with ID: {} with reason: {}", id, reason);
        return ResponseEntity.ok(success(
                Map.of("listingId", id, "reason", reason),
                "Listing rejected and removed successfully"));
    }






}


