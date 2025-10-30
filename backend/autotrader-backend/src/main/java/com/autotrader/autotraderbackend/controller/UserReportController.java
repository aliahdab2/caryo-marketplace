package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.UserReport;
import com.autotrader.autotraderbackend.payload.request.ReportUserRequest;
import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.autotrader.autotraderbackend.service.I18nService;
import com.autotrader.autotraderbackend.service.UserReportService;
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
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class UserReportController {

    private final UserReportService userReportService;
    private final I18nService i18nService;

    /**
     * Report a user
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserReport>> reportUser(
            @Valid @RequestBody ReportUserRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("User {} reporting user {}", userDetails.getId(), request.getReportedUserId());

        UserReport report = userReportService.createReport(request, userDetails.getId());

        String message = i18nService.getMessage("user.reported.success", acceptLanguage, "User has been reported successfully");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(report, message));
    }

    /**
     * Get reports submitted by the current user
     */
    @GetMapping("/my-reports")
    public ResponseEntity<Page<UserReport>> getMyReports(
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

        return ResponseEntity.ok(reports);
    }
}
