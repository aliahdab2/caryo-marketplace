package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.service.NewsletterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Admin REST controller for newsletter management.
 */
@RestController
@RequestMapping("/api/admin/newsletter")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Newsletter", description = "Admin newsletter management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNewsletterController {

    private final NewsletterService newsletterService;

    /**
     * Get newsletter subscription statistics.
     */
    @GetMapping("/stats")
    @Operation(summary = "Get newsletter statistics", description = "Get newsletter subscription statistics")
    public ResponseEntity<Map<String, Object>> getStats() {

        log.info("Admin requesting newsletter statistics");

        long activeCount = newsletterService.getActiveSubscriptionCount();

        return ResponseEntity.ok(Map.of(
            "activeSubscriptions", activeCount,
            "timestamp", LocalDateTime.now()
        ));
    }
}
