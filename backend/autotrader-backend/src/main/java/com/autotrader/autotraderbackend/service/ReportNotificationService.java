package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.UserReport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for sending report-related notification emails.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportNotificationService {

    private final EmailService emailService;

    @Value("${app.website.url}")
    private String websiteUrl;

    @Value("${app.email.admin}")
    private String adminEmail;

    /**
     * Send notification to admin when a new report is submitted.
     * Runs asynchronously to not block the report submission.
     */
    @Async
    public void sendNewReportNotificationToAdmin(UserReport report) {
        try {
            log.info("Sending new report notification to admin for report ID: {}", report.getId());

            Map<String, Object> variables = new HashMap<>();
            variables.put("reportId", report.getId());
            variables.put("reporterUsername", report.getReporter().getUsername());
            variables.put("reportedUsername", report.getReportedUser().getUsername());
            variables.put("reportType", report.getReportType().getDisplayName());
            variables.put("reason", report.getReason());
            variables.put("reportUrl", websiteUrl + "/dashboard/admin/reports");
            variables.put("reportDate", report.getCreatedAt().toString());

            emailService.sendTemplatedEmail(
                adminEmail,
                "New User Report - Caryo",
                "admin-report-notification",
                variables,
                "en"
            );

            log.info("Admin notification email sent successfully for report ID: {}", report.getId());

        } catch (Exception e) {
            log.error("Failed to send admin notification email for report ID: {}", report.getId(), e);
            // Don't throw exception - email failure shouldn't break report submission
        }
    }

    /**
     * Send notification to reporter when their report status changes.
     * Runs asynchronously.
     */
    @Async
    public void sendReportStatusUpdateToReporter(UserReport report, User reporter) {
        try {
            log.info("Sending report status update to reporter for report ID: {}", report.getId());

            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", reporter.getUsername());
            variables.put("reportId", report.getId());
            variables.put("reportedUsername", report.getReportedUser().getUsername());
            variables.put("status", report.getStatus().name());
            variables.put("adminNotes", report.getAdminNotes());
            variables.put("reportUrl", websiteUrl + "/dashboard/my-reports");

            String subject = String.format("Report Update - %s", report.getStatus().name());

            emailService.sendTemplatedEmail(
                reporter.getEmail(),
                subject,
                "report-status-update",
                variables,
                "en"
            );

            log.info("Reporter notification email sent successfully for report ID: {}", report.getId());

        } catch (Exception e) {
            log.error("Failed to send reporter notification email for report ID: {}", report.getId(), e);
            // Don't throw exception - email failure shouldn't break status update
        }
    }
}


