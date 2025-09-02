package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.service.EmailVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for handling email verification endpoints.
 * Provides endpoints for verifying email addresses and resending verification emails.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Email Verification", description = "Email verification management")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @Operation(
        summary = "Verify email address",
        description = "Verify user's email address using the verification token sent via email",
        responses = {
            @ApiResponse(responseCode = "200", description = "Email verified successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired verification token")
        }
    )
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        log.info("Email verification attempt with token: {}", token.substring(0, Math.min(token.length(), 8)) + "...");
        
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Verification token is required"));
        }
        
        boolean verified = emailVerificationService.verifyEmail(token);
        
        if (verified) {
            return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now sign in and create listings."));
        } else {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid or expired verification token. Please request a new verification email."));
        }
    }

    @Operation(
        summary = "Resend verification email",
        description = "Resend verification email to the specified email address",
        responses = {
            @ApiResponse(responseCode = "200", description = "Verification email sent successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid email or email already verified"),
            @ApiResponse(responseCode = "429", description = "Too many requests - rate limited")
        }
    )
    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerificationEmail(@RequestParam("email") String email) {
        log.info("Resend verification email request for: {}", email);
        
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Email address is required"));
        }
        
        boolean sent = emailVerificationService.resendVerificationEmail(email);
        
        if (sent) {
            return ResponseEntity.ok(new MessageResponse("Verification email sent successfully! Please check your inbox."));
        } else {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Unable to send verification email. Email may already be verified or rate limited."));
        }
    }

    @Operation(
        summary = "Check verification status",
        description = "Check if an email address is verified",
        responses = {
            @ApiResponse(responseCode = "200", description = "Verification status returned"),
            @ApiResponse(responseCode = "400", description = "Invalid email address")
        }
    )
    @GetMapping("/verification-status")
    public ResponseEntity<?> checkVerificationStatus(@RequestParam("email") String email) {
        // This endpoint can be used by frontend to check verification status
        // Implementation would depend on your specific needs
        return ResponseEntity.ok(new MessageResponse("Verification status endpoint - implementation depends on requirements"));
    }
}
