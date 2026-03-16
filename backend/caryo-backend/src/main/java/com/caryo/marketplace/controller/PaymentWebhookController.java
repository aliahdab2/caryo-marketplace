package com.caryo.marketplace.controller;

import com.caryo.marketplace.payment.PaymentRateLimitService;
import com.caryo.marketplace.payment.PaymentResponse;
import com.caryo.marketplace.payment.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.Arrays;
import java.util.Map;

/**
 * Payment Webhook Controller
 * 
 * Handles webhooks from payment providers for automated payment processing.
 * This controller receives notifications about payment status changes and
 * updates the system accordingly.
 * 
 * Security:
 * - All webhooks are verified using provider-specific signature validation
 * - No authentication required (webhooks use signature verification)
 * - Rate limiting applied to prevent abuse
 */
@RestController
@RequestMapping("/api/v1/webhooks/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment Webhooks", description = "Webhook endpoints for payment provider notifications")
public class PaymentWebhookController {

    private static final int MAX_WEBHOOK_PAYLOAD_BYTES = 65536; // 64KB

    private final PaymentService paymentService;
    private final PaymentRateLimitService rateLimitService;
    private final Environment environment;

    /**
     * PayPal webhook handler
     * 
     * Receives notifications from PayPal about payment events:
     * - Payment completed
     * - Subscription activated/cancelled
     * - Payment failed
     */
    @PostMapping("/paypal")
    @Operation(
        summary = "PayPal webhook handler",
        description = "Handles PayPal webhook notifications for payment status updates",
        responses = {
            @ApiResponse(responseCode = "200", description = "Webhook processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid webhook payload"),
            @ApiResponse(responseCode = "401", description = "Invalid webhook signature")
        }
    )
    public ResponseEntity<Map<String, String>> handlePayPalWebhook(
            HttpServletRequest request,
            @RequestHeader(value = "PayPal-Transmission-Id", required = false) String transmissionId,
            @RequestHeader(value = "PayPal-Cert-Id", required = false) String certId,
            @RequestHeader(value = "PayPal-Auth-Algo", required = false) String authAlgo,
            @RequestHeader(value = "PayPal-Transmission-Time", required = false) String transmissionTime,
            @RequestHeader(value = "PayPal-Transmission-Sig", required = false) String signature) {

        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.isWebhookProcessingAllowed("paypal", clientIp)) {
            log.warn("Webhook rate limit exceeded for PayPal from IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "status", "error",
                "message", "Rate limit exceeded"
            ));
        }

        try {
            // Read raw payload
            String payload = readRequestBody(request);

            log.info("Received PayPal webhook: transmissionId={}, certId={}, authAlgo={}",
                transmissionId, certId, authAlgo);

            // Process webhook
            PaymentResponse response = paymentService.handleWebhook("paypal", payload, signature);
            
            if (response.isSuccess()) {
                log.info("PayPal webhook processed successfully: {}", response.getMessage());
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Webhook processed successfully"
                ));
            } else {
                log.warn("PayPal webhook processing failed: {}", response.getMessage());
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", response.getMessage()
                ));
            }

        } catch (Exception e) {
            log.error("Error processing PayPal webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", "error",
                "message", "Internal server error processing webhook"
            ));
        }
    }

    /**
     * Stripe webhook handler
     * 
     * Receives notifications from Stripe about payment events:
     * - Checkout session completed
     * - Payment succeeded/failed
     * - Subscription created/updated/cancelled
     * - Invoice payment succeeded/failed
     */
    @PostMapping("/stripe")
    @Operation(
        summary = "Stripe webhook handler",
        description = "Handles Stripe webhook notifications for payment status updates",
        responses = {
            @ApiResponse(responseCode = "200", description = "Webhook processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid webhook payload"),
            @ApiResponse(responseCode = "401", description = "Invalid webhook signature")
        }
    )
    public ResponseEntity<Map<String, String>> handleStripeWebhook(
            HttpServletRequest request,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature) {

        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.isWebhookProcessingAllowed("stripe", clientIp)) {
            log.warn("Webhook rate limit exceeded for Stripe from IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "status", "error",
                "message", "Rate limit exceeded"
            ));
        }

        try {
            // Read raw payload
            String payload = readRequestBody(request);

            log.info("Received Stripe webhook with signature: {}", signature != null ? "present" : "missing");

            // Process webhook
            PaymentResponse response = paymentService.handleWebhook("stripe", payload, signature);
            
            if (response.isSuccess()) {
                log.info("Stripe webhook processed successfully: {}", response.getMessage());
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Webhook processed successfully"
                ));
            } else {
                log.warn("Stripe webhook processing failed: {}", response.getMessage());
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", response.getMessage()
                ));
            }

        } catch (Exception e) {
            log.error("Error processing Stripe webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", "error",
                "message", "Internal server error processing webhook"
            ));
        }
    }

    /**
     * Manual transfer webhook (for future bank integrations)
     * 
     * This endpoint can be used for bank notifications when available
     */
    @PostMapping("/manual-transfer")
    @Operation(
        summary = "Manual transfer notification handler",
        description = "Handles notifications from banks or manual verification systems",
        responses = {
            @ApiResponse(responseCode = "200", description = "Notification processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid notification payload"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
        }
    )
    public ResponseEntity<Map<String, String>> handleManualTransferNotification(
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization) {

        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.isWebhookProcessingAllowed("manual-transfer", clientIp)) {
            log.warn("Webhook rate limit exceeded for manual-transfer from IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "status", "error",
                "message", "Rate limit exceeded"
            ));
        }

        try {
            // For manual transfers, this could be used for bank notifications
            // or automated verification systems in the future

            String payload = readRequestBody(request);
            log.info("Received manual transfer notification with payload length: {}", payload.length());

            // For now, just acknowledge receipt
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Manual transfer notification received"
            ));

        } catch (Exception e) {
            log.error("Error processing manual transfer notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", "error",
                "message", "Internal server error processing notification"
            ));
        }
    }

    /**
     * Generic webhook handler for testing
     * 
     * This endpoint can be used for testing webhook functionality
     * during development and integration testing.
     */
    @PostMapping("/test")
    @Operation(
        summary = "Test webhook handler",
        description = "Generic webhook endpoint for testing purposes",
        responses = {
            @ApiResponse(responseCode = "200", description = "Test webhook processed successfully")
        }
    )
    public ResponseEntity<Map<String, String>> handleTestWebhook(
            HttpServletRequest request,
            @RequestParam(value = "provider", defaultValue = "test") String providerId) {

        // Only allow test webhooks in dev/test environments
        boolean isDev = Arrays.stream(environment.getActiveProfiles())
            .anyMatch(p -> "dev".equals(p) || "test".equals(p) || "local".equals(p));
        if (!isDev) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status", "error",
                "message", "Endpoint not available"
            ));
        }

        try {
            String payload = readRequestBody(request);

            log.info("Received test webhook for provider: {}", providerId);
            log.debug("Test webhook payload: {}", payload);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Test webhook processed successfully",
                "provider", providerId,
                "timestamp", String.valueOf(System.currentTimeMillis())
            ));

        } catch (Exception e) {
            log.error("Error processing test webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", "error",
                "message", "Internal server error processing test webhook"
            ));
        }
    }

    /**
     * Webhook status endpoint
     * 
     * Returns the status of webhook processing capabilities.
     * Useful for monitoring and health checks.
     */
    @GetMapping("/status")
    @Operation(
        summary = "Webhook service status",
        description = "Returns the status of webhook processing capabilities",
        responses = {
            @ApiResponse(responseCode = "200", description = "Webhook service status")
        }
    )
    public ResponseEntity<Map<String, Object>> getWebhookStatus() {
        
        Map<String, String> supportedProviders = paymentService.getAvailableProviders();
        
        return ResponseEntity.ok(Map.of(
            "status", "active",
            "supportedProviders", supportedProviders,
            "endpoints", Map.of(
                "paypal", "/api/v1/webhooks/payments/paypal",
                "stripe", "/api/v1/webhooks/payments/stripe",
                "manual", "/api/v1/webhooks/payments/manual-transfer",
                "test", "/api/v1/webhooks/payments/test"
            ),
            "timestamp", System.currentTimeMillis()
        ));
    }

    // Helper methods

    /**
     * Read raw request body as string
     */
    private String readRequestBody(HttpServletRequest request) throws IOException {
        StringBuilder stringBuilder = new StringBuilder();
        BufferedReader bufferedReader = null;
        int totalRead = 0;

        try {
            bufferedReader = request.getReader();
            char[] charBuffer = new char[128];
            int bytesRead;

            while ((bytesRead = bufferedReader.read(charBuffer)) > 0) {
                totalRead += bytesRead;
                if (totalRead > MAX_WEBHOOK_PAYLOAD_BYTES) {
                    throw new IOException("Webhook payload exceeds maximum size of " + MAX_WEBHOOK_PAYLOAD_BYTES + " bytes");
                }
                stringBuilder.append(charBuffer, 0, bytesRead);
            }
        } finally {
            if (bufferedReader != null) {
                bufferedReader.close();
            }
        }

        return stringBuilder.toString();
    }
}
