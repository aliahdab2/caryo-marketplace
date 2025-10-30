package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.UserBlock;
import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.autotrader.autotraderbackend.service.I18nService;
import com.autotrader.autotraderbackend.service.UserBlockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing user-level blocking.
 */
@RestController
@RequestMapping("/api/users/block")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Blocking", description = "User-level blocking endpoints")
public class UserBlockController {

    private final UserBlockService userBlockService;
    private final I18nService i18nService;

    /**
     * Block a user
     */
    @PostMapping("/{userId}")
    @Operation(summary = "Block a user", description = "Block another user completely across the platform")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @Parameter(description = "ID of user to block") @PathVariable Long userId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("User {} blocking user {}", userDetails.getId(), userId);

        userBlockService.blockUser(userDetails.getId(), userId);

        String message = i18nService.getMessage("user.blocked.success", acceptLanguage, "User has been blocked successfully");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message));
    }

    /**
     * Unblock a user
     */
    @DeleteMapping("/{userId}")
    @Operation(summary = "Unblock a user", description = "Remove block from a previously blocked user")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @Parameter(description = "ID of user to unblock") @PathVariable Long userId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("User {} unblocking user {}", userDetails.getId(), userId);

        userBlockService.unblockUser(userDetails.getId(), userId);

        String message = i18nService.getMessage("user.unblocked.success", acceptLanguage, "User has been unblocked successfully");

        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /**
     * Get list of blocked users
     */
    @GetMapping
    @Operation(summary = "Get blocked users", description = "Get list of users blocked by the current user")
    public ResponseEntity<List<UserBlock>> getBlockedUsers(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        log.info("Getting blocked users for user {}", userDetails.getId());

        List<UserBlock> blockedUsers = userBlockService.getBlockedUsers(userDetails.getId());

        return ResponseEntity.ok(blockedUsers);
    }

    /**
     * Check if a user is blocked
     */
    @GetMapping("/{userId}/status")
    @Operation(summary = "Check block status", description = "Check if a specific user is blocked")
    public ResponseEntity<ApiResponse<Boolean>> isBlocked(
            @Parameter(description = "ID of user to check") @PathVariable Long userId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        boolean isBlocked = userBlockService.isBlocked(userDetails.getId(), userId);

        return ResponseEntity.ok(ApiResponse.success(isBlocked, "Block status retrieved"));
    }
}

