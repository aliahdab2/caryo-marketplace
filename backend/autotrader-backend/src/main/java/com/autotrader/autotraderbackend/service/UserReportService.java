package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.Conversation;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.UserReport;
import com.autotrader.autotraderbackend.model.UserReport.ReportStatus;
import com.autotrader.autotraderbackend.payload.request.ReportUserRequest;
import com.autotrader.autotraderbackend.repository.ConversationRepository;
import com.autotrader.autotraderbackend.repository.UserReportRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service for managing user reports.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserReportService {

    private final UserReportRepository userReportRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final ReportRateLimitService rateLimitService;
    private final ReportNotificationService reportNotificationService;

    /**
     * Create a new user report
     */
    public UserReport createReport(ReportUserRequest request, Long reporterId) {
        log.info("Creating user report by user {} against user {}", reporterId, request.getReportedUserId());

        // Check rate limit
        if (!rateLimitService.canSubmitReport(reporterId)) {
            int remaining = rateLimitService.getRemainingReports(reporterId);
            LocalDateTime nextAvailable = rateLimitService.getNextAvailableTime(reporterId);
            throw new BadRequestException(
                String.format("Rate limit exceeded. You can submit %d more reports. Next report available at: %s", 
                    remaining, nextAvailable));
        }

        // Validate reporter exists
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reporterId));

        // Validate reported user exists
        User reportedUser = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getReportedUserId()));

        // Prevent self-reporting
        if (reporter.getId().equals(reportedUser.getId())) {
            throw new BadRequestException("Cannot report yourself");
        }

        // Check if there's already a pending report (prevent duplicate reports)
        if (userReportRepository.existsPendingReportByReporterAndReportedUser(reporter, reportedUser)) {
            throw new BadRequestException("You have already submitted a pending report against this user");
        }

        // Validate conversation if provided
        Conversation conversation = null;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", request.getConversationId()));

            // Validate reporter is participant in conversation
            if (!conversation.isParticipant(reporter)) {
                throw new BadRequestException("You are not a participant in this conversation");
            }
        }

        // Parse and validate report type
        com.autotrader.autotraderbackend.model.ReportType reportType = 
                com.autotrader.autotraderbackend.model.ReportType.fromString(request.getReportType());

        // Create report
        UserReport report = UserReport.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .conversation(conversation)
                .reportType(reportType)
                .reason(request.getReason().trim())
                .status(ReportStatus.PENDING)
                .build();

            report = userReportRepository.save(report);

            // Record report for rate limiting
            rateLimitService.recordReport(reporterId);

            // Send email notification to admin (async)
            try {
                reportNotificationService.sendNewReportNotificationToAdmin(report);
            } catch (Exception e) {
                log.warn("Failed to send admin notification email, but report was saved successfully", e);
            }

            log.info("User report created successfully with ID: {}", report.getId());
            return report;
    }

    /**
     * Get all reports with pagination
     */
    @Transactional(readOnly = true)
    public Page<UserReport> getAllReports(Pageable pageable) {
        return userReportRepository.findAll(pageable);
    }

    /**
     * Get reports by status
     */
    @Transactional(readOnly = true)
    public Page<UserReport> getReportsByStatus(ReportStatus status, Pageable pageable) {
        return userReportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    /**
     * Get reports submitted by a user
     */
    @Transactional(readOnly = true)
    public Page<UserReport> getReportsByReporter(Long reporterId, Pageable pageable) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reporterId));

        return userReportRepository.findByReporterOrderByCreatedAtDesc(reporter, pageable);
    }
}
