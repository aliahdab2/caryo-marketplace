package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.service.EmailVerificationService;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
import com.autotrader.autotraderbackend.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for handling email verification endpoints.
 * Provides endpoints for verifying email addresses and resending verification emails.
 */
@RestController
@RequestMapping("/api/auth/verify-email")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Email Verification", description = "Email verification management")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;
    private final JwtUtils jwtUtils;

    @Operation(
        summary = "Verify email address",
        description = "Verify user's email address using the verification token sent via email. Returns JWT token for auto-login on successful verification.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Email verified successfully - returns JWT token for auto-login"),
            @ApiResponse(responseCode = "400", description = "Invalid or expired verification token")
        }
    )
    @GetMapping("")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        log.info("Email verification attempt with token: {}", token.substring(0, Math.min(token.length(), 8)) + "...");
        
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Verification token is required"));
        }
        
        var result = emailVerificationService.verifyEmail(token);
        
        if (result.isSuccess() && result.getUser() != null) {
            try {
                // Auto-login: Generate JWT token for the verified user
                User user = result.getUser();
                String jwt = jwtUtils.generateJwtTokenForUser(user);
                
                // Get user roles with null safety
                List<String> roles = user.getRoles() != null ? 
                    user.getRoles().stream()
                        .map(role -> role.getName())
                        .collect(Collectors.toList()) : 
                    List.of("ROLE_USER"); // Default role if none exist
                
                log.info("Email verified and auto-login successful for user: {}", user.getUsername());
                
                // Return JWT response for auto-login
                return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    roles
                ));
            } catch (Exception e) {
                log.error("Failed to generate JWT token for user: {} after email verification. Error: {}", 
                         result.getUser().getUsername(), e.getMessage());
                // Fallback to regular success message if JWT generation fails
                return ResponseEntity.ok(new MessageResponse(
                    "Email verified successfully! Please sign in to continue."));
            }
        } else if (result.isSuccess()) {
            // Success but no user (already verified case)
            // For best UX (like Blocket.se/Autotrader.co.uk), we should still provide auto-login
            // Try to get the user by email from the verification token
            try {
                User user = emailVerificationService.getUserByVerificationToken(token);
                if (user != null && user.isEmailVerified()) {
                    // Generate JWT token for already verified user
                    String jwt = jwtUtils.generateJwtTokenForUser(user);
                    
                    // Get user roles with null safety
                    List<String> roles = user.getRoles() != null ? 
                        user.getRoles().stream()
                            .map(role -> role.getName())
                            .collect(Collectors.toList()) : 
                        List.of("ROLE_USER"); // Default role if none exist
                    
                    log.info("Auto-login provided for already verified user: {}", user.getUsername());
                    
                    // Return JWT response for auto-login (same as new verification)
                    return ResponseEntity.ok(new JwtResponse(
                        jwt,
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        roles
                    ));
                }
            } catch (Exception e) {
                log.warn("Could not provide auto-login for already verified user. Error: {}", e.getMessage());
            }
            
            // Fallback to message response if auto-login fails
            return ResponseEntity.ok(new MessageResponse(result.getMessage()));
        } else {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(result.getMessage()));
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
    @PostMapping("/resend")
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
