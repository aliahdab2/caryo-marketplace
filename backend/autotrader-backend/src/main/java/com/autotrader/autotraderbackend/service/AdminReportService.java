package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.UserReport;
import com.autotrader.autotraderbackend.model.UserReport.ReportStatus;
import com.autotrader.autotraderbackend.payload.request.ResolveReportRequest;
import com.autotrader.autotraderbackend.repository.UserReportRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for admin management of user reports.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminReportService {

    private final UserReportRepository userReportRepository;
    private final UserRepository userRepository;

    /**
     * Get a single report by ID (admin only)
     */
    @Transactional(readOnly = true)
    public UserReport getReport(Long reportId) {
        return userReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));
    }

    /**
     * Mark report as reviewed
     */
    public UserReport markAsReviewed(Long reportId, Long adminId) {
        log.info("Admin {} marking report {} as reviewed", adminId, reportId);

        UserReport report = getReport(reportId);
        
        if (report.getStatus() == ReportStatus.RESOLVED || report.getStatus() == ReportStatus.DISMISSED) {
            throw new BadRequestException("Cannot review a report that is already resolved or dismissed");
        }

        report.setStatus(ReportStatus.REVIEWED);
        report = userReportRepository.save(report);

        log.info("Report {} marked as reviewed", reportId);
        return report;
    }

    /**
     * Resolve a report with admin notes
     */
    public UserReport resolveReport(Long reportId, ResolveReportRequest request, Long adminId) {
        log.info("Admin {} resolving report {}", adminId, reportId);

        UserReport report = getReport(reportId);
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        if (report.getStatus() == ReportStatus.RESOLVED) {
            throw new BadRequestException("Report is already resolved");
        }

        report.setStatus(ReportStatus.RESOLVED);
        report.setAdminNotes(request.getAdminNotes());
        report.setResolvedBy(admin);
        report = userReportRepository.save(report);

        log.info("Report {} resolved by admin {}", reportId, adminId);
        return report;
    }

    /**
     * Dismiss a report with admin notes
     */
    public UserReport dismissReport(Long reportId, ResolveReportRequest request, Long adminId) {
        log.info("Admin {} dismissing report {}", adminId, reportId);

        UserReport report = getReport(reportId);
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        if (report.getStatus() == ReportStatus.DISMISSED) {
            throw new BadRequestException("Report is already dismissed");
        }

        report.setStatus(ReportStatus.DISMISSED);
        report.setAdminNotes(request.getAdminNotes());
        report.setResolvedBy(admin);
        report = userReportRepository.save(report);

        log.info("Report {} dismissed by admin {}", reportId, adminId);
        return report;
    }
}

