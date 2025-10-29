package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.ContactFormRequest;
import com.autotrader.autotraderbackend.service.EmailService;
import com.autotrader.autotraderbackend.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for handling contact form submissions.
 * Supports multi-language contact forms with configurable website names.
 */
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Contact", description = "Contact form endpoints with multi-language support")
public class ContactController {

    private final EmailService emailService;
    private final MessageService messageService;

    /**
     * Submit a contact form message with language support.
     *
     * @param request The contact form request with optional language parameter
     * @return Success or error response in the specified language
     */
    @PostMapping
    @Operation(
        summary = "Submit contact form",
        description = "Submit a contact form message to the support team with multi-language support"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Contact form submitted successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ContactResponse.class),
                examples = {
                    @ExampleObject(
                        name = "English Success",
                        value = "{\"message\":\"Thank you for your message. We'll get back to you soon!\",\"status\":\"success\"}"
                    ),
                    @ExampleObject(
                        name = "Arabic Success",
                        value = "{\"message\":\"شكراً لك على رسالتك. سنرد عليك قريباً!\",\"status\":\"success\"}"
                    )
                }
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ContactResponse.class),
                examples = {
                    @ExampleObject(
                        name = "Validation Error",
                        value = "{\"message\":\"Invalid email format\",\"status\":\"error\"}"
                    )
                }
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ContactResponse.class),
                examples = {
                    @ExampleObject(
                        name = "Server Error",
                        value = "{\"message\":\"Sorry, there was an error processing your message. Please try again later.\",\"status\":\"error\"}"
                    )
                }
            )
        )
    })
    public ResponseEntity<ContactResponse> submitContactForm(@Valid @RequestBody ContactFormRequest request) {
        // Validate and normalize language outside try block for error handling
        String language = normalizeLanguage(request.getLanguage());

        try {
            log.info("Contact form submission received from: {} ({}) [Language: {}]",
                    request.getName(), request.getEmail(), request.getLanguage());

            // Send email to support team
            emailService.sendContactFormEmail(request.getName(), request.getEmail(), request.getMessage(), language);

            // Send confirmation email to sender
            emailService.sendContactFormConfirmation(request.getName(), request.getEmail(), language);

            log.info("Contact form processed successfully for: {} [Language: {}]", request.getEmail(), language);

            String successMessage = messageService.getMessage("success.contact.form", language);

            return ResponseEntity.ok(new ContactResponse(successMessage, "success"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid contact form submission: {}", e.getMessage());
            Map<String, String> errorParams = Map.of("error", e.getMessage());
            String errorMessage = messageService.getMessage("error.invalid.data", language, errorParams);
            return ResponseEntity.badRequest().body(new ContactResponse(errorMessage, "error"));

        } catch (Exception e) {
            log.error("Failed to process contact form submission from: {}", request.getEmail(), e);

            String errorMessage = messageService.getMessage("error.server", language);

            return ResponseEntity.internalServerError().body(new ContactResponse(errorMessage, "error"));
        }
    }

    /**
     * Normalize language code to supported values.
     *
     * @param language The input language code
     * @return Normalized language code (en or ar)
     */
    private String normalizeLanguage(String language) {
        if (language == null || language.trim().isEmpty()) {
            return "en"; // Default to English
        }

        String normalized = language.trim().toLowerCase();
        return normalized.equals("ar") ? "ar" : "en"; // Only support en and ar
    }

    /**
     * Response class for contact form submissions.
     */
    public static class ContactResponse {
        private final String message;
        private final String status;

        public ContactResponse(String message, String status) {
            this.message = message;
            this.status = status;
        }

        public String getMessage() {
            return message;
        }

        public String getStatus() {
            return status;
        }
    }
}