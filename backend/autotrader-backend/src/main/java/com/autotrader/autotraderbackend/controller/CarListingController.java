package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.CarListingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CarListingController {

    @Autowired
    private CarListingService carListingService;

    @PostMapping
    public ResponseEntity<CarListingResponse> createListing(
            @Valid @RequestBody CreateListingRequest createRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        CarListingResponse newListing = carListingService.createListing(createRequest, userDetails.getUsername());
        return new ResponseEntity<>(newListing, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<PageResponse<CarListingResponse>> getAllListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        PageResponse<CarListingResponse> listings = carListingService.getAllApprovedListings(page, size);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/filter")
    public ResponseEntity<PageResponse<CarListingResponse>> filterListings(@Valid ListingFilterRequest filterRequest) {
        PageResponse<CarListingResponse> listings = carListingService.getFilteredListings(filterRequest);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CarListingResponse> getListingById(@PathVariable Long id) {
        CarListingResponse listing = carListingService.getListingById(id);
        return ResponseEntity.ok(listing);
    }

    @GetMapping("/my-listings")
    public ResponseEntity<List<CarListingResponse>> getMyListings(@AuthenticationPrincipal UserDetails userDetails) {
        List<CarListingResponse> myListings = carListingService.getMyListings(userDetails.getUsername());
        return ResponseEntity.ok(myListings);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<CarListingResponse> approveListing(@PathVariable Long id) {
        CarListingResponse approvedListing = carListingService.approveListing(id);
        return ResponseEntity.ok(approvedListing);
    }
}
