package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.UserReport;
import com.caryo.marketplace.payload.request.ReportUserRequest;
import com.caryo.marketplace.payload.response.ApiResponse;
import com.caryo.marketplace.payload.response.UserReportResponse;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.service.I18nService;
import com.caryo.marketplace.service.UserReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing user reports.
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class UserReportController {

    private final UserReportService userReportService;
    private final I18nService i18nService;

    /**
     * Report a user
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserReportResponse>> reportUser(
            @Valid @RequestBody ReportUserRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("User {} reporting user {}", userDetails.getId(), request.getReportedUserId());

        UserReport report = userReportService.createReport(request, userDetails.getId());
        UserReportResponse response = UserReportResponse.fromEntity(report, false);

        String message = i18nService.getMessage("user.reported.success", acceptLanguage, "User has been reported successfully");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, message));
    }

    /**
     * Get reports submitted by the current user
     */
    @GetMapping("/my-reports")
    public ResponseEntity<Page<UserReportResponse>> getMyReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        log.info("Getting reports submitted by user {}", userDetails.getId());

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<UserReport> reports = userReportService.getReportsByReporter(userDetails.getId(), pageable);
        
        // Convert to DTOs
        Page<UserReportResponse> responsePage = reports.map(report -> UserReportResponse.fromEntity(report, false));

        return ResponseEntity.ok(responsePage);
    }
}
