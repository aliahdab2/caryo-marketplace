package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Slf4j
public class CarListingController {

    private final CarListingService carListingService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CarListingResponse> createListing(
            @Valid @RequestBody CreateListingRequest createRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        log.info("Received request to create listing from user: {}", userDetails.getUsername());
        CarListingResponse response = carListingService.createListing(createRequest, userDetails.getUsername());
        log.info("Successfully created listing with ID: {}", response.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/{listingId}/upload-image", consumes = {"multipart/form-data"})
    @PreAuthorize("isAuthenticated()") // Ensure user is logged in
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
    public ResponseEntity<PageResponse<CarListingResponse>> getAllListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {
        log.info("Received request to get all approved listings. Page: {}, Size: {}, Sort: {}", page, size, sort);
        // Create Pageable object
        Pageable pageable = PageRequest.of(page, size, Sort.by(SortHelper.getSortOrders(sort)));
        // Call the service method which returns a Page
        Page<CarListingResponse> listingPage = carListingService.getAllApprovedListings(pageable);
        // Construct PageResponse from the Page
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
    public ResponseEntity<PageResponse<CarListingResponse>> getFilteredListings(
            @Valid @RequestBody ListingFilterRequest filterRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {
        log.info("Received request to filter listings. Filter: {}, Page: {}, Size: {}, Sort: {}", filterRequest, page, size, sort);
         // Create Pageable object
        Pageable pageable = PageRequest.of(page, size, Sort.by(SortHelper.getSortOrders(sort)));
        // Call the service method which returns a Page
        Page<CarListingResponse> listingPage = carListingService.getFilteredListings(filterRequest, pageable);
        // Construct PageResponse from the Page
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
    public ResponseEntity<CarListingResponse> getListingById(@PathVariable Long id) {
        log.debug("Request received for listing ID: {}", id);
        // Service method handles not found exception
        CarListingResponse listing = carListingService.getListingById(id);
        log.debug("Returning listing details for ID: {}", id);
        return ResponseEntity.ok(listing);
    }

    @GetMapping("/my-listings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CarListingResponse>> getMyListings(@AuthenticationPrincipal UserDetails userDetails) {
        log.debug("Request received for listings owned by user: {}", userDetails.getUsername());
        List<CarListingResponse> myListings = carListingService.getMyListings(userDetails.getUsername());
        log.debug("Returning {} listings for user: {}", myListings.size(), userDetails.getUsername());
        return ResponseEntity.ok(myListings);
    }

    // Changed back to POST as it modifies state
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
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
}

// Helper class for sorting (can be moved to a separate utility class)
class SortHelper {
    public static Sort.Order[] getSortOrders(String[] sort) {
        if (sort == null || sort.length == 0) {
            return new Sort.Order[0]; // Return empty array if no sort params
        }
        return java.util.Arrays.stream(sort)
                .filter(s -> s != null && !s.trim().isEmpty()) // Filter out empty/null strings
                .map(s -> {
                    String[] parts = s.split(",");
                    Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
                    // Use first part as property, handle potential empty string after split
                    String property = parts[0].trim(); 
                    if (property.isEmpty()) {
                        // Default or throw error if property is empty
                        // For now, let's default to a common field like 'id' or 'createdAt'
                        // Or better, return null/skip this order if invalid
                        return null; // Skip invalid sort parameter
                    }
                    return new Sort.Order(direction, property);
                })
                .filter(java.util.Objects::nonNull) // Remove nulls resulting from invalid params
                .toArray(Sort.Order[]::new);
    }
}
