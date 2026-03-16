package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.UserReport;
import com.caryo.marketplace.model.UserReport.ReportStatus;
import com.caryo.marketplace.payload.request.ResolveReportRequest;
import com.caryo.marketplace.payload.response.ApiResponse;
import com.caryo.marketplace.payload.response.UserReportResponse;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.service.AdminReportService;
import com.caryo.marketplace.service.I18nService;
import com.caryo.marketplace.service.UserReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for admin management of user reports.
 * Requires ADMIN or MODERATOR role.
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
@Tag(name = "Admin - Reports", description = "Admin endpoints for managing user reports")
public class AdminReportController {

    private final UserReportService userReportService;
    private final AdminReportService adminReportService;
    private final I18nService i18nService;

    /**
     * Get all reports with filtering and pagination
     */
    @GetMapping
    @Operation(summary = "Get all reports", description = "Get paginated list of all user reports with optional status filtering")
    public ResponseEntity<Page<UserReportResponse>> getAllReports(
            @Parameter(description = "Filter by status (PENDING, REVIEWED, RESOLVED, DISMISSED)")
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        log.info("Admin getting all reports - status: {}, page: {}, size: {}", status, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<UserReport> reports = status != null ?
                userReportService.getReportsByStatus(status, pageable) :
                userReportService.getAllReports(pageable);

        // Convert to DTOs with admin fields
        Page<UserReportResponse> responsePage = reports.map(report -> UserReportResponse.fromEntity(report, true));

        return ResponseEntity.ok(responsePage);
    }

    /**
     * Get a single report by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get report by ID", description = "Get detailed information about a specific report")
    public ResponseEntity<ApiResponse<UserReportResponse>> getReport(
            @Parameter(description = "Report ID") @PathVariable Long id) {

        log.info("Admin getting report {}", id);

        UserReport report = adminReportService.getReport(id);
        UserReportResponse response = UserReportResponse.fromEntity(report, true);

        return ResponseEntity.ok(ApiResponse.success(response, "Report retrieved successfully"));
    }

    /**
     * Mark report as reviewed
     */
    @PatchMapping("/{id}/review")
    @Operation(summary = "Mark report as reviewed", description = "Mark a report as reviewed (moves from PENDING to REVIEWED status)")
    public ResponseEntity<ApiResponse<UserReportResponse>> markAsReviewed(
            @Parameter(description = "Report ID") @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Admin {} marking report {} as reviewed", userDetails.getId(), id);

        UserReport report = adminReportService.markAsReviewed(id, userDetails.getId());
        UserReportResponse response = UserReportResponse.fromEntity(report, true);

        String message = i18nService.getMessage("report.reviewed.success", acceptLanguage, "Report has been marked as reviewed");

        return ResponseEntity.ok(ApiResponse.success(response, message));
    }

    /**
     * Resolve a report
     */
    @PatchMapping("/{id}/resolve")
    @Operation(summary = "Resolve report", description = "Resolve a report with admin notes")
    public ResponseEntity<ApiResponse<UserReportResponse>> resolveReport(
            @Parameter(description = "Report ID") @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Admin {} resolving report {}", userDetails.getId(), id);

        UserReport report = adminReportService.resolveReport(id, request, userDetails.getId());
        UserReportResponse response = UserReportResponse.fromEntity(report, true);

        String message = i18nService.getMessage("report.resolved.success", acceptLanguage, "Report has been resolved successfully");

        return ResponseEntity.ok(ApiResponse.success(response, message));
    }

    /**
     * Dismiss a report
     */
    @PatchMapping("/{id}/dismiss")
    @Operation(summary = "Dismiss report", description = "Dismiss a report with admin notes")
    public ResponseEntity<ApiResponse<UserReportResponse>> dismissReport(
            @Parameter(description = "Report ID") @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Admin {} dismissing report {}", userDetails.getId(), id);

        UserReport report = adminReportService.dismissReport(id, request, userDetails.getId());
        UserReportResponse response = UserReportResponse.fromEntity(report, true);

        String message = i18nService.getMessage("report.dismissed.success", acceptLanguage, "Report has been dismissed");

        return ResponseEntity.ok(ApiResponse.success(response, message));
    }
}

