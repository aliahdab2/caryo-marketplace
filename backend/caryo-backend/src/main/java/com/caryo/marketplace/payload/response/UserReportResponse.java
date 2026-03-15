package com.caryo.marketplace.payload.response;

import com.caryo.marketplace.model.UserReport;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for UserReport entity.
 * Provides controlled view of report data without exposing internal entity structure.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserReportResponse {

    private Long id;
    
    // Reporter information
    private Long reporterId;
    private String reporterUsername;
    private String reporterEmail;
    
    // Reported user information
    private Long reportedUserId;
    private String reportedUserUsername;
    private String reportedUserEmail;
    
    // Conversation context (if applicable)
    private Long conversationId;
    private Long listingId;
    private String listingTitle;
    
    // Report details
    private String reportType;
    private String reportTypeDisplay; // Human-readable display name
    private String reason;
    private String status;
    
    // Admin fields (only visible to admins)
    private String adminNotes;
    private Long resolvedById;
    private String resolvedByUsername;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    /**
     * Convert UserReport entity to response DTO
     */
    public static UserReportResponse fromEntity(UserReport report) {
        return fromEntity(report, false);
    }

    /**
     * Convert UserReport entity to response DTO with optional admin fields
     */
    public static UserReportResponse fromEntity(UserReport report, boolean includeAdminFields) {
        if (report == null) {
            return null;
        }

        UserReportResponseBuilder builder = UserReportResponse.builder()
                .id(report.getId())
                .reporterId(report.getReporter().getId())
                .reporterUsername(report.getReporter().getUsername())
                .reportedUserId(report.getReportedUser().getId())
                .reportedUserUsername(report.getReportedUser().getUsername())
                .reportType(report.getReportType().name())
                .reportTypeDisplay(report.getReportType().getDisplayName())
                .reason(report.getReason())
                .status(report.getStatus().name())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .resolvedAt(report.getResolvedAt());

        // Add conversation context if present
        if (report.getConversation() != null) {
            builder.conversationId(report.getConversation().getId());
            if (report.getConversation().getListing() != null) {
                builder.listingId(report.getConversation().getListing().getId());
                builder.listingTitle(report.getConversation().getListing().getTitle());
            }
        }

        // Add admin fields only if requested (for admin users)
        if (includeAdminFields) {
            builder.reporterEmail(report.getReporter().getEmail());
            builder.reportedUserEmail(report.getReportedUser().getEmail());
            builder.adminNotes(report.getAdminNotes());
            
            if (report.getResolvedBy() != null) {
                builder.resolvedById(report.getResolvedBy().getId());
                builder.resolvedByUsername(report.getResolvedBy().getUsername());
            }
        }

        return builder.build();
    }
}

