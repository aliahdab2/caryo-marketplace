package com.autotrader.autotraderbackend.payload.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Error response containing details about an API error")
public class ErrorResponse {
    @Schema(description = "HTTP status code", example = "404")
    private int status;

    @Schema(description = "Error message", example = "Resource not found")
    private String message;

    @Schema(description = "Detailed error description", example = "Car listing with id '123' was not found")
    private String details;

    @Schema(description = "Timestamp of when the error occurred", example = "2024-03-21T10:15:30.123Z")
    private String timestamp;
} 