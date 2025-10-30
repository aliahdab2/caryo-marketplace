package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for resolving a user report by an admin.
 */
@Data
public class ResolveReportRequest {

    /**
     * Admin notes explaining the resolution
     */
    @NotBlank(message = "Admin notes are required")
    @Size(max = 500, message = "Admin notes must not exceed 500 characters")
    private String adminNotes;
}

