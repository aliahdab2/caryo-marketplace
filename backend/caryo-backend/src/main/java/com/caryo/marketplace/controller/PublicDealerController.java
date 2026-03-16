package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.dealer.DealerNotFoundException;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.payload.response.MessageResponse;
import com.caryo.marketplace.payload.response.PublicDealerResponse;
import com.caryo.marketplace.service.PublicDealerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for public dealer information.
 * These endpoints are accessible without authentication.
 */
@RestController
@RequestMapping("/api/v1/dealers")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public Dealers", description = "Public dealer profiles and listings (no authentication required)")
public class PublicDealerController {

    private final PublicDealerService publicDealerService;

    /**
     * Get public profile for a dealer.
     *
     * @param dealerId Dealer ID
     * @return Public dealer profile including business info, branding, and contact details
     */
    @Operation(
        summary = "Get public dealer profile",
        description = "Retrieve a dealer's public profile including business name, logo, description, and contact info"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profile retrieved successfully",
            content = @Content(schema = @Schema(implementation = PublicDealerResponse.class))),
        @ApiResponse(responseCode = "404", description = "Dealer not found")
    })
    @GetMapping("/{dealerId}/public")
    public ResponseEntity<?> getPublicDealerProfile(
            @Parameter(description = "Dealer ID") @PathVariable Long dealerId) {
        try {
            PublicDealerResponse response = publicDealerService.getPublicDealerProfile(dealerId);
            return ResponseEntity.ok(response);
        } catch (DealerNotFoundException e) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching public dealer profile", e);
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Could not fetch dealer profile"));
        }
    }

    /**
     * Get public listings for a dealer.
     *
     * @param dealerId Dealer ID
     * @param page Page number (0-based)
     * @param size Page size
     * @param sort Sort field
     * @param direction Sort direction (asc/desc)
     * @return Paginated list of dealer's active listings
     */
    @Operation(
        summary = "Get dealer listings",
        description = "Retrieve a dealer's active car listings with pagination"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Listings retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Dealer not found")
    })
    @GetMapping("/{dealerId}/listings")
    public ResponseEntity<?> getPublicDealerListings(
        @Parameter(description = "Dealer ID") @PathVariable Long dealerId,
        @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
        @Parameter(description = "Page size") @RequestParam(defaultValue = "12") int size,
        @Parameter(description = "Sort field (createdAt, price, etc.)") @RequestParam(defaultValue = "createdAt") String sort,
        @Parameter(description = "Sort direction (asc/desc)") @RequestParam(defaultValue = "desc") String direction
    ) {
        try {
            Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            Page<CarListingResponse> listings = publicDealerService.getPublicDealerListings(dealerId, pageable);
            return ResponseEntity.ok(listings);
        } catch (DealerNotFoundException e) {
            return ResponseEntity.status(404).body(new MessageResponse("Error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching dealer listings", e);
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Could not fetch dealer listings"));
        }
    }
}
