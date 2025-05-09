package com.autotrader.autotraderbackend.exception;

import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler to translate exceptions to appropriate HTTP responses
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles AccessDeniedException and returns a 403 Forbidden response
     */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", "Access Denied");
        body.put("error", "Forbidden");
        body.put("status", HttpStatus.FORBIDDEN.value());
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<Object> handleStorageException(StorageException ex) {
        log.warn("StorageException: {}", ex.getMessage());
        return buildResponse(ex.getMessage(), "Bad Request", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(EntityNotFoundException.class) // Handles JPA's not found
    public ResponseEntity<Object> handleEntityNotFoundException(EntityNotFoundException ex) {
        log.warn("EntityNotFoundException: {}", ex.getMessage());
        return buildResponse(ex.getMessage(), "Not Found", HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ResourceNotFoundException.class) // Handles your custom not found
    public ResponseEntity<Object> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("ResourceNotFoundException: {}", ex.getMessage());
        return buildResponse(ex.getMessage(), "Not Found", HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Object> handleUsernameNotFoundException(UsernameNotFoundException ex) {
        log.warn("UsernameNotFoundException: {}", ex.getMessage());
        return buildResponse(ex.getMessage(), "Not Found", HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException ex) {
        log.warn("Validation error: {}", ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String field = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(field, message);
        });

        Map<String, Object> body = baseErrorBody("Validation failed", HttpStatus.BAD_REQUEST);
        body.put("errors", errors);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("IllegalArgumentException: {}", ex.getMessage());
        return buildResponse(ex.getMessage(), "Bad Request", HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex) {
        log.error("Unexpected exception", ex);
        return buildResponse("An unexpected error occurred", ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Handle Spring Security authentication exceptions
     * This needs to be here to catch exceptions from Spring Security before they hit the generic handler
     */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<MessageResponse> handleSpringSecurityAuthenticationException(
            AuthenticationException ex, WebRequest request) {
        log.error("Spring Security authentication error: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse("Authentication failed: " + ex.getMessage()));
    }

    private ResponseEntity<Object> buildResponse(String message, String error, HttpStatus status) {
        Map<String, Object> body = baseErrorBody(message, status);
        body.put("error", error);
        return new ResponseEntity<>(body, status);
    }

    private Map<String, Object> baseErrorBody(String message, HttpStatus status) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("message", message);
        body.put("status", status.value());
        return body;
    }
}
