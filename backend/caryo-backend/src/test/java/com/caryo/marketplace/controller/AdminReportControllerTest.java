package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.ReportType;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.model.UserReport;
import com.caryo.marketplace.model.UserReport.ReportStatus;
import com.caryo.marketplace.payload.request.ResolveReportRequest;
import com.caryo.marketplace.payload.response.ApiResponse;
import com.caryo.marketplace.payload.response.UserReportResponse;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.service.AdminReportService;
import com.caryo.marketplace.service.I18nService;
import com.caryo.marketplace.service.UserReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminReportControllerTest {

    @Mock
    private UserReportService userReportService;

    @Mock
    private AdminReportService adminReportService;

    @Mock
    private I18nService i18nService;

    @InjectMocks
    private AdminReportController adminReportController;

    private UserDetailsImpl adminDetails;
    private UserReport testReport;
    private User reporter;
    private User reportedUser;

    private static final Long ADMIN_USER_ID = 1L;
    private static final Long REPORT_ID = 10L;

    @BeforeEach
    void setUp() {
        User adminUser = new User();
        adminUser.setId(ADMIN_USER_ID);
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminDetails = UserDetailsImpl.build(adminUser);

        reporter = new User();
        reporter.setId(2L);
        reporter.setUsername("reporter");
        reporter.setEmail("reporter@example.com");

        reportedUser = new User();
        reportedUser.setId(3L);
        reportedUser.setUsername("baduser");
        reportedUser.setEmail("bad@example.com");

        testReport = new UserReport();
        testReport.setId(REPORT_ID);
        testReport.setReporter(reporter);
        testReport.setReportedUser(reportedUser);
        testReport.setReportType(ReportType.SPAM);
        testReport.setReason("Spamming messages");
        testReport.setStatus(ReportStatus.PENDING);
        testReport.setCreatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("GET /api/admin/reports")
    class GetAllReports {

        @Test
        @DisplayName("Should return all reports without status filter")
        void getAllReports_NoFilter() {
            Page<UserReport> reports = new PageImpl<>(List.of(testReport));
            when(userReportService.getAllReports(any(Pageable.class))).thenReturn(reports);

            ResponseEntity<Page<UserReportResponse>> response =
                    adminReportController.getAllReports(null, 0, 20, "createdAt", "desc");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getTotalElements());
            verify(userReportService).getAllReports(any(Pageable.class));
            verify(userReportService, never()).getReportsByStatus(any(), any());
        }

        @Test
        @DisplayName("Should return reports filtered by status")
        void getAllReports_WithStatusFilter() {
            Page<UserReport> reports = new PageImpl<>(List.of(testReport));
            when(userReportService.getReportsByStatus(eq(ReportStatus.PENDING), any(Pageable.class)))
                    .thenReturn(reports);

            ResponseEntity<Page<UserReportResponse>> response =
                    adminReportController.getAllReports(ReportStatus.PENDING, 0, 20, "createdAt", "desc");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(userReportService).getReportsByStatus(eq(ReportStatus.PENDING), any(Pageable.class));
            verify(userReportService, never()).getAllReports(any());
        }

        @Test
        @DisplayName("Should handle ascending sort direction")
        void getAllReports_AscSort() {
            Page<UserReport> reports = new PageImpl<>(List.of());
            when(userReportService.getAllReports(any(Pageable.class))).thenReturn(reports);

            ResponseEntity<Page<UserReportResponse>> response =
                    adminReportController.getAllReports(null, 0, 10, "createdAt", "asc");

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("GET /api/admin/reports/{id}")
    class GetReport {

        @Test
        @DisplayName("Should return report by ID")
        void getReport_Success() {
            when(adminReportService.getReport(REPORT_ID)).thenReturn(testReport);

            ResponseEntity<ApiResponse<UserReportResponse>> response =
                    adminReportController.getReport(REPORT_ID);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertNotNull(response.getBody().getData());
            assertEquals(REPORT_ID, response.getBody().getData().getId());
        }
    }

    @Nested
    @DisplayName("PATCH /api/admin/reports/{id}/review")
    class MarkAsReviewed {

        @Test
        @DisplayName("Should mark report as reviewed")
        void markAsReviewed_Success() {
            testReport.setStatus(ReportStatus.REVIEWED);
            when(adminReportService.markAsReviewed(REPORT_ID, ADMIN_USER_ID)).thenReturn(testReport);
            when(i18nService.getMessage("report.reviewed.success", "en", "Report has been marked as reviewed"))
                    .thenReturn("Report reviewed");

            ResponseEntity<ApiResponse<UserReportResponse>> response =
                    adminReportController.markAsReviewed(REPORT_ID, adminDetails, "en");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(adminReportService).markAsReviewed(REPORT_ID, ADMIN_USER_ID);
        }
    }

    @Nested
    @DisplayName("PATCH /api/admin/reports/{id}/resolve")
    class ResolveReport {

        @Test
        @DisplayName("Should resolve report with admin notes")
        void resolveReport_Success() {
            ResolveReportRequest request = new ResolveReportRequest();
            request.setAdminNotes("User warned and content removed");

            testReport.setStatus(ReportStatus.RESOLVED);
            testReport.setAdminNotes("User warned and content removed");
            when(adminReportService.resolveReport(REPORT_ID, request, ADMIN_USER_ID)).thenReturn(testReport);
            when(i18nService.getMessage("report.resolved.success", "en", "Report has been resolved successfully"))
                    .thenReturn("Report resolved");

            ResponseEntity<ApiResponse<UserReportResponse>> response =
                    adminReportController.resolveReport(REPORT_ID, request, adminDetails, "en");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(adminReportService).resolveReport(REPORT_ID, request, ADMIN_USER_ID);
        }
    }

    @Nested
    @DisplayName("PATCH /api/admin/reports/{id}/dismiss")
    class DismissReport {

        @Test
        @DisplayName("Should dismiss report with admin notes")
        void dismissReport_Success() {
            ResolveReportRequest request = new ResolveReportRequest();
            request.setAdminNotes("No violation found");

            testReport.setStatus(ReportStatus.DISMISSED);
            testReport.setAdminNotes("No violation found");
            when(adminReportService.dismissReport(REPORT_ID, request, ADMIN_USER_ID)).thenReturn(testReport);
            when(i18nService.getMessage("report.dismissed.success", "en", "Report has been dismissed"))
                    .thenReturn("Report dismissed");

            ResponseEntity<ApiResponse<UserReportResponse>> response =
                    adminReportController.dismissReport(REPORT_ID, request, adminDetails, "en");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(adminReportService).dismissReport(REPORT_ID, request, ADMIN_USER_ID);
        }
    }
}
