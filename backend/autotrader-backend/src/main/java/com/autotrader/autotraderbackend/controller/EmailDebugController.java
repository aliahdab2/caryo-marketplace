package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "Email Debug", description = "Debug endpoints for email encoding issues")
@RestController
@RequestMapping("/api/debug/email")
@Slf4j
public class EmailDebugController {

    @Autowired
    private EmailService emailService;
    
    @Value("${app.website.name}")
    private String websiteName;
    
    @Value("${app.website.name.ar}")
    private String websiteNameAr;

    @Operation(
        summary = "Debug Arabic Encoding",
        description = "Test Arabic text encoding in email system"
    )
    @GetMapping("/debug-arabic")
    public ResponseEntity<?> debugArabicEncoding() {
        try {
            log.info("=== Email Debug Controller - Arabic Encoding ===");
            
            Map<String, Object> debugInfo = new HashMap<>();
            
            // Test website names
            debugInfo.put("websiteName_en", websiteName);
            debugInfo.put("websiteName_ar", websiteNameAr);
            debugInfo.put("websiteName_ar_length", websiteNameAr != null ? websiteNameAr.length() : 0);
            debugInfo.put("websiteName_ar_bytes", websiteNameAr != null ? 
                java.util.Arrays.toString(websiteNameAr.getBytes(StandardCharsets.UTF_8)) : "null");
            
            // Test hardcoded Arabic
            String testArabic = "أوتو تريدر";
            debugInfo.put("test_arabic", testArabic);
            debugInfo.put("test_arabic_bytes", java.util.Arrays.toString(testArabic.getBytes(StandardCharsets.UTF_8)));
            
            // Test system encoding
            debugInfo.put("default_charset", StandardCharsets.UTF_8.name());
            debugInfo.put("file_encoding", System.getProperty("file.encoding"));
            debugInfo.put("java_version", System.getProperty("java.version"));
            
            // Note: Debug method is implementation-specific, not available through interface
            
            log.info("Debug info: {}", debugInfo);
            
            return ResponseEntity.ok(debugInfo);
            
        } catch (Exception e) {
            log.error("Error in debug Arabic encoding", e);
            return ResponseEntity.badRequest()
                .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @Operation(
        summary = "Test Password Reset Email",
        description = "Send a test password reset email to debug encoding"
    )
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
}
