package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.dealer.DealerNotFoundException;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.payload.response.PublicDealerResponse;
import com.autotrader.autotraderbackend.service.PublicDealerService;
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

@RestController
@RequestMapping("/api/dealers")
@RequiredArgsConstructor
@Slf4j
public class PublicDealerController {

    private final PublicDealerService publicDealerService;

    @GetMapping("/{dealerId}/public")
    public ResponseEntity<?> getPublicDealerProfile(@PathVariable Long dealerId) {
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

    @GetMapping("/{dealerId}/listings")
    public ResponseEntity<?> getPublicDealerListings(
        @PathVariable Long dealerId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(defaultValue = "createdAt") String sort,
        @RequestParam(defaultValue = "desc") String direction
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
