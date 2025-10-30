package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for reporting a user.
 */
@Data
public class ReportUserRequest {

    /**
     * ID of the user being reported
     */
    @NotNull(message = "Reported user ID is required")
    private Long reportedUserId;

    /**
     * ID of the conversation (if report is related to a conversation)
     */
    private Long conversationId;

    /**
     * Type/category of the report
     */
    @NotBlank(message = "Report type is required")
    @Size(max = 50, message = "Report type must not exceed 50 characters")
    private String reportType; // Will be converted to ReportType enum in service layer

    /**
     * Detailed reason/description of the report
     */
    @NotBlank(message = "Reason is required")
    @Size(max = 1000, message = "Reason must not exceed 1000 characters")
    private String reason;
}
