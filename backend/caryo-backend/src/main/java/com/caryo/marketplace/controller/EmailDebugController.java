package com.caryo.marketplace.controller;

import com.caryo.marketplace.payload.response.MessageResponse;
import com.caryo.marketplace.service.EmailService;
import com.caryo.marketplace.repository.PasswordResetTokenRepository;
import com.caryo.marketplace.model.PasswordResetToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "Email Debug", description = "Debug endpoints for email encoding issues")
@RestController
@RequestMapping("/api/debug/email")
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class EmailDebugController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Value("${app.website.name}")
    private String websiteName;

    @Value("${app.website.name.ar}")
    private String websiteNameAr;

    @Operation(summary = "Debug Arabic Encoding", description = "Test Arabic text encoding in email system")
    @GetMapping("/debug-arabic")
    public ResponseEntity<?> debugArabicEncoding() {
        try {
            log.info("=== Email Debug Controller - Arabic Encoding ===");

            Map<String, Object> debugInfo = new HashMap<>();

            // Test website names
            debugInfo.put("websiteName_en", websiteName);
            debugInfo.put("websiteName_ar", websiteNameAr);
            debugInfo.put("websiteName_ar_length", websiteNameAr != null ? websiteNameAr.length() : 0);
            debugInfo.put("websiteName_ar_bytes",
                    websiteNameAr != null ? java.util.Arrays.toString(websiteNameAr.getBytes(StandardCharsets.UTF_8))
                            : "null");

            // Test hardcoded Arabic
            String testArabic = "أوتو تريدر";
            debugInfo.put("test_arabic", testArabic);
            debugInfo.put("test_arabic_bytes", java.util.Arrays.toString(testArabic.getBytes(StandardCharsets.UTF_8)));

            // Test system encoding
            debugInfo.put("default_charset", StandardCharsets.UTF_8.name());
            debugInfo.put("file_encoding", System.getProperty("file.encoding"));
            debugInfo.put("java_version", System.getProperty("java.version"));

            // Note: Debug method is implementation-specific, not available through
            // interface

            log.info("Debug info: {}", debugInfo);

            return ResponseEntity.ok(debugInfo);

        } catch (Exception e) {
            log.error("Error in debug Arabic encoding", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @Operation(summary = "Test Password Reset Email", description = "Send a test password reset email to debug encoding")
    @PostMapping("/test-password-reset")
    public ResponseEntity<?> testPasswordResetEmail(
            @RequestParam String email,
            @RequestParam(defaultValue = "ar") String language) {
        try {
            log.info("Sending test password reset email to: {} in language: {}", email, language);

            String resetUrl = "http://localhost:3000/auth/reset-password?token=TEST_TOKEN_123";
            emailService.sendPasswordResetEmail(email, "TestUser", resetUrl, language);

            return ResponseEntity.ok(new MessageResponse("Test password reset email sent successfully"));

        } catch (Exception e) {
            log.error("Error sending test password reset email", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/password-reset-tokens")
    @Operation(summary = "Debug: List all password reset tokens", description = "Lists all password reset tokens for debugging")
    public ResponseEntity<?> listPasswordResetTokens() {
        try {
            List<PasswordResetToken> tokens = tokenRepository.findAll();

            Map<String, Object> response = new HashMap<>();
            response.put("totalTokens", tokens.size());
            response.put("tokens", tokens.stream().map(token -> {
                Map<String, Object> tokenInfo = new HashMap<>();
                tokenInfo.put("id", token.getId());
                tokenInfo.put("token", token.getToken());
                tokenInfo.put("userId", token.getUser().getId());
                tokenInfo.put("userEmail", token.getUser().getEmail());
                tokenInfo.put("expiryDate", token.getExpiryDate().toString());
                tokenInfo.put("used", token.isUsed());
                tokenInfo.put("expired", token.isExpired());
                tokenInfo.put("valid", token.isValid());
                return tokenInfo;
            }).toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error listing password reset tokens", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Email Service Health Check", description = "Checks if the email service is healthy and working")
    public ResponseEntity<?> emailHealthCheck() {
        try {
            boolean isHealthy = emailService.isEmailServiceHealthy();

            Map<String, Object> response = new HashMap<>();
            response.put("healthy", isHealthy);
            response.put("status", isHealthy ? "UP" : "DOWN");
            response.put("service", "EmailService");
            response.put("timestamp", java.time.Instant.now().toString());

            if (isHealthy) {
                response.put("message", "Email service is healthy and ready");
                return ResponseEntity.ok(response);
            } else {
                response.put("message", "Email service is not healthy");
                return ResponseEntity.status(503).body(response); // Service Unavailable
            }
        } catch (Exception e) {
            log.error("Error checking email service health", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("healthy", false);
            errorResponse.put("status", "DOWN");
            errorResponse.put("service", "EmailService");
            errorResponse.put("error", e.getMessage());
            errorResponse.put("timestamp", java.time.Instant.now().toString());
            return ResponseEntity.status(503).body(errorResponse);
        }
    }
}
