package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.response.GovernorateResponse;
import com.autotrader.autotraderbackend.service.GovernorateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/governorates")
@RequiredArgsConstructor
public class GovernorateController {

    private final GovernorateService governorateService;

    @GetMapping
    public ResponseEntity<List<GovernorateResponse>> getAllGovernorates() {
        return ResponseEntity.ok(governorateService.getAllActiveGovernorates());
    }

    @GetMapping("/country/{countryCode}")
    public ResponseEntity<List<GovernorateResponse>> getGovernoratesByCountry(
            @PathVariable String countryCode) {
        return ResponseEntity.ok(governorateService.getGovernoratesByCountry(countryCode));
    }
    
    @GetMapping("/{slug}")
    public ResponseEntity<GovernorateResponse> getGovernorateBySlug(
            @PathVariable String slug) {
        GovernorateResponse governorate = governorateService.getGovernorateBySlug(slug);
        if (governorate == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(governorate);
    }
}
