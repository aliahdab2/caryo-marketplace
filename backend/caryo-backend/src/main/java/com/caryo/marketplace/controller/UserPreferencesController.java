package com.caryo.marketplace.controller;

import com.caryo.marketplace.payload.request.UserPreferencesRequest;
import com.caryo.marketplace.payload.response.UserPreferencesResponse;
import com.caryo.marketplace.service.UserPreferencesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me/preferences")
@RequiredArgsConstructor
@Tag(name = "User Preferences", description = "Notification and privacy preferences for the current user")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Get current user's preferences",
        description = "Returns the stored preferences, or the defaults when the user has never saved any.",
        security = @SecurityRequirement(name = "bearer-token")
    )
    public ResponseEntity<UserPreferencesResponse> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userPreferencesService.getPreferences(userDetails.getUsername()));
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(
        summary = "Update current user's preferences",
        description = "Full update of notification and privacy preferences.",
        security = @SecurityRequirement(name = "bearer-token")
    )
    public ResponseEntity<UserPreferencesResponse> updatePreferences(
            @Valid @RequestBody UserPreferencesRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userPreferencesService.updatePreferences(userDetails.getUsername(), request));
    }
}
