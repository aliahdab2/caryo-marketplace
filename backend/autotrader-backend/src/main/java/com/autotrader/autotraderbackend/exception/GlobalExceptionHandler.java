package com.autotrader.autotraderbackend.exception;

import com.autotrader.autotraderbackend.exception.dealer.DealerNotFoundException;
import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import com.autotrader.autotraderbackend.payload.response.ErrorResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Global exception handler for consistent error responses across all endpoints.
 * Provides internationalization support following the translation guide.
 */
@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /**
     * Get user's preferred locale from Accept-Language header
     */
    private Locale getUserLocale(WebRequest request) {
        String acceptLanguage = request.getHeader("Accept-Language");
        if (acceptLanguage != null && acceptLanguage.toLowerCase().startsWith("ar")) {
            return Locale.forLanguageTag("ar");
        }
        return Locale.ENGLISH;
    }

    /**
     * Get localized message using Spring's MessageSource
     */
    private String getMessage(String key, Locale locale, Object... args) {
        return messageSource.getMessage(key, args, key, locale);
    }

    /**
     * Handle resource not found exceptions
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = getMessage("error.resource.not.found", locale, ex.getResourceName());

        log.warn("Resource not found: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(message));
    }

    /**
     * Handle dealer not found exceptions.
     * Returns structured error response following industry best practices.
     */
    @ExceptionHandler(DealerNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleDealerNotFoundException(
            DealerNotFoundException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = getMessage("error.dealer.not.found", locale);

        log.warn("Dealer not found: {}", ex.getMessage());

        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            message,
            ex.getMessage(),
            Instant.now().toString()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * Handle bad request exceptions
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequestException(
            BadRequestException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = getMessage("error.validation.failed", locale, ex.getMessage());

        log.warn("Bad request: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message));
    }

    /**
     * Handle access denied exceptions
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = getMessage("error.access.denied", locale);

        log.warn("Access denied: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(message));
    }

    /**
     * Handle security exceptions thrown by service-layer guards
     */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleSecurityException(
            SecurityException ex, WebRequest request) {
        Locale locale = getUserLocale(request);
        String message = getMessage("error.access.denied", locale);
        log.warn("Security exception: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(message));
    }

    /**
     * Handle storage exceptions (file upload/validation errors)
     */
    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ApiResponse<Void>> handleStorageException(
            StorageException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = getMessage("error.validation.failed", locale, ex.getMessage());

        log.warn("Storage error: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message));
    }

    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        String message = getMessage("error.validation.failed", locale, "Multiple field errors");

        log.warn("Validation failed: {}", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message, errors));
    }

    /**
     * Handle constraint violation exceptions
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolationException(
            ConstraintViolationException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = getMessage("error.validation.failed", locale, ex.getMessage());

        log.warn("Constraint violation: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message));
    }

    /**
     * Handle rate limit exceeded exceptions
     */
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleRateLimitExceededException(
            RateLimitExceededException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = ex.getMessage();

        log.warn("Rate limit exceeded: {}", ex.getMessage());

        // Return 429 Too Many Requests with retry information
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("X-RateLimit-Remaining", String.valueOf(ex.getRemainingRequests()))
                .header("X-RateLimit-Reset", String.valueOf(ex.getSecondsUntilReset()))
                .header("Retry-After", String.valueOf(ex.getSecondsUntilReset()))
                .body(ApiResponse.error(message));
    }

    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {

        log.warn("Illegal argument: {}", ex.getMessage());

        // Return the specific error message directly for better user experience
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(
            Exception ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = getMessage("error.server.internal", locale);

        log.error("Unexpected error occurred", ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(message));
    }

    /**
     * Handle runtime exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(
            RuntimeException ex, WebRequest request) {

        Locale locale = getUserLocale(request);
        String message = getMessage("error.server.internal", locale);

        log.error("Runtime error occurred: {}", ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(message));
    }
}