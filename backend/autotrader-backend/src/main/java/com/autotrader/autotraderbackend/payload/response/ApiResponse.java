package com.autotrader.autotraderbackend.payload.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standardized API response wrapper for consistent response format across all endpoints.
 * Provides internationalization support and consistent error handling.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    /**
     * The actual response data (null for error responses or operations without return data)
     * Always include this field in JSON even when null, as null data has semantic meaning
     */
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private T data;
    
    /**
     * Localized message for the user (success or error message)
     */
    private String message;
    
    /**
     * Response status: "success", "error", "warning", "info"
     */
    private String status;
    
    /**
     * Timestamp when the response was generated
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * Additional metadata (pagination info, etc.)
     */
    private Object metadata;
    
    // Convenience factory methods
    
    /**
     * Create a successful response with data and message
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .data(data)
                .message(message)
                .status("success")
                .build();
    }
    
    /**
     * Create a successful response with only data
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .data(data)
                .status("success")
                .build();
    }
    
    /**
     * Create a successful response with only message
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .message(message)
                .status("success")
                .build();
    }
    
    /**
     * Create an error response with message
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .message(message)
                .status("error")
                .build();
    }
    
    /**
     * Create an error response with message and metadata
     */
    public static <T> ApiResponse<T> error(String message, Object metadata) {
        return ApiResponse.<T>builder()
                .message(message)
                .status("error")
                .metadata(metadata)
                .build();
    }
    
    /**
     * Create a warning response
     */
    public static <T> ApiResponse<T> warning(String message) {
        return ApiResponse.<T>builder()
                .message(message)
                .status("warning")
                .build();
    }
    
    /**
     * Create an info response
     */
    public static <T> ApiResponse<T> info(String message) {
        return ApiResponse.<T>builder()
                .message(message)
                .status("info")
                .build();
    }
}
