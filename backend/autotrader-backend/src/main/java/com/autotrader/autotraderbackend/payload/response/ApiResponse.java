package com.autotrader.autotraderbackend.payload.response;

import com.autotrader.autotraderbackend.service.I18nService;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standardized API response wrapper for consistent response format across all endpoints.
 * Provides internationalization support using I18nService and consistent error handling.
 * Supports both localized and non-localized responses for flexible usage.
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
     * Response status using translation keys: response.status.success, response.status.error,
     * response.status.warning, response.status.info
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
     * Create a localized successful response with data and message
     */
    public static <T> ApiResponse<T> success(T data, String message, I18nService i18nService, String acceptLanguage) {
        if (i18nService == null) {
            throw new IllegalArgumentException("I18nService cannot be null for localized responses");
        }
        return ApiResponse.<T>builder()
                .data(data)
                .message(message)
                .status(i18nService.getMessage("response.status.success", acceptLanguage))
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
     * Create a localized successful response with only data
     */
    public static <T> ApiResponse<T> success(T data, I18nService i18nService, String acceptLanguage) {
        if (i18nService == null) {
            throw new IllegalArgumentException("I18nService cannot be null for localized responses");
        }
        return ApiResponse.<T>builder()
                .data(data)
                .status(i18nService.getMessage("response.status.success", acceptLanguage))
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
     * Create a localized successful response with only message
     */
    public static <T> ApiResponse<T> success(String message, I18nService i18nService, String acceptLanguage) {
        if (i18nService == null) {
            throw new IllegalArgumentException("I18nService cannot be null for localized responses");
        }
        return ApiResponse.<T>builder()
                .message(message)
                .status(i18nService.getMessage("response.status.success", acceptLanguage))
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
     * Create a localized error response with message
     */
    public static <T> ApiResponse<T> error(String message, I18nService i18nService, String acceptLanguage) {
        if (i18nService == null) {
            throw new IllegalArgumentException("I18nService cannot be null for localized responses");
        }
        return ApiResponse.<T>builder()
                .message(message)
                .status(i18nService.getMessage("response.status.error", acceptLanguage))
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
     * Create a localized error response with message and metadata
     */
    public static <T> ApiResponse<T> error(String message, Object metadata, I18nService i18nService, String acceptLanguage) {
        if (i18nService == null) {
            throw new IllegalArgumentException("I18nService cannot be null for localized responses");
        }
        return ApiResponse.<T>builder()
                .message(message)
                .status(i18nService.getMessage("response.status.error", acceptLanguage))
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
     * Create a localized warning response
     */
    public static <T> ApiResponse<T> warning(String message, I18nService i18nService, String acceptLanguage) {
        if (i18nService == null) {
            throw new IllegalArgumentException("I18nService cannot be null for localized responses");
        }
        return ApiResponse.<T>builder()
                .message(message)
                .status(i18nService.getMessage("response.status.warning", acceptLanguage))
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

    /**
     * Create a localized info response
     */
    public static <T> ApiResponse<T> info(String message, I18nService i18nService, String acceptLanguage) {
        if (i18nService == null) {
            throw new IllegalArgumentException("I18nService cannot be null for localized responses");
        }
        return ApiResponse.<T>builder()
                .message(message)
                .status(i18nService.getMessage("response.status.info", acceptLanguage))
                .build();
    }
}
