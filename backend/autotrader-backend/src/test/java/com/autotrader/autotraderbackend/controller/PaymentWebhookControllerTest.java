package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payment.PaymentRateLimitService;
import com.autotrader.autotraderbackend.payment.PaymentResponse;
import com.autotrader.autotraderbackend.payment.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookControllerTest {

    @Mock
    private PaymentService paymentService;

    @Mock
    private PaymentRateLimitService rateLimitService;

    @Mock
    private Environment environment;

    @InjectMocks
    private PaymentWebhookController paymentWebhookController;

    @Mock
    private HttpServletRequest httpServletRequest;

    private static final String TEST_IP = "192.168.1.1";
    private static final String TEST_PAYLOAD = "{\"event\":\"payment.completed\"}";

    @BeforeEach
    void setUp() throws IOException {
        lenient().when(httpServletRequest.getRemoteAddr()).thenReturn(TEST_IP);
        lenient().when(httpServletRequest.getReader())
                .thenReturn(new BufferedReader(new StringReader(TEST_PAYLOAD)));
    }

    @Nested
    @DisplayName("POST /api/webhooks/payments/paypal")
    class HandlePayPalWebhook {

        @Test
        @DisplayName("Should process successful PayPal webhook")
        void handlePayPalWebhook_Success() throws IOException {
            when(rateLimitService.isWebhookProcessingAllowed("paypal", TEST_IP)).thenReturn(true);

            PaymentResponse paymentResponse = PaymentResponse.builder()
                    .success(true)
                    .message("Payment processed")
                    .build();
            when(paymentService.handleWebhook("paypal", TEST_PAYLOAD, "test-sig"))
                    .thenReturn(paymentResponse);

            ResponseEntity<Map<String, String>> response = paymentWebhookController.handlePayPalWebhook(
                    httpServletRequest, "trans-id", "cert-id", "SHA256", "2024-01-01T00:00:00Z", "test-sig");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("success", response.getBody().get("status"));
        }

        @Test
        @DisplayName("Should return 400 when PayPal webhook processing fails")
        void handlePayPalWebhook_ProcessingFailed() throws IOException {
            when(rateLimitService.isWebhookProcessingAllowed("paypal", TEST_IP)).thenReturn(true);

            PaymentResponse paymentResponse = PaymentResponse.builder()
                    .success(false)
                    .message("Invalid signature")
                    .build();
            when(paymentService.handleWebhook("paypal", TEST_PAYLOAD, "bad-sig"))
                    .thenReturn(paymentResponse);

            ResponseEntity<Map<String, String>> response = paymentWebhookController.handlePayPalWebhook(
                    httpServletRequest, "trans-id", "cert-id", "SHA256", "2024-01-01T00:00:00Z", "bad-sig");

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("error", response.getBody().get("status"));
        }

        @Test
        @DisplayName("Should return 429 when rate limited")
        void handlePayPalWebhook_RateLimited() {
            when(rateLimitService.isWebhookProcessingAllowed("paypal", TEST_IP)).thenReturn(false);

            ResponseEntity<Map<String, String>> response = paymentWebhookController.handlePayPalWebhook(
                    httpServletRequest, "trans-id", "cert-id", "SHA256", "2024-01-01T00:00:00Z", "sig");

            assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
            assertEquals("Rate limit exceeded", response.getBody().get("message"));
        }

        @Test
        @DisplayName("Should return 500 on unexpected exception")
        void handlePayPalWebhook_InternalError() throws IOException {
            when(rateLimitService.isWebhookProcessingAllowed("paypal", TEST_IP)).thenReturn(true);
            when(httpServletRequest.getReader()).thenThrow(new IOException("Stream closed"));

            ResponseEntity<Map<String, String>> response = paymentWebhookController.handlePayPalWebhook(
                    httpServletRequest, null, null, null, null, null);

            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertEquals("error", response.getBody().get("status"));
        }
    }

    @Nested
    @DisplayName("POST /api/webhooks/payments/stripe")
    class HandleStripeWebhook {

        @Test
        @DisplayName("Should process successful Stripe webhook")
        void handleStripeWebhook_Success() throws IOException {
            when(rateLimitService.isWebhookProcessingAllowed("stripe", TEST_IP)).thenReturn(true);

            PaymentResponse paymentResponse = PaymentResponse.builder()
                    .success(true)
                    .message("Stripe payment processed")
                    .build();
            when(paymentService.handleWebhook("stripe", TEST_PAYLOAD, "stripe-sig"))
                    .thenReturn(paymentResponse);

            ResponseEntity<Map<String, String>> response = paymentWebhookController.handleStripeWebhook(
                    httpServletRequest, "stripe-sig");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("success", response.getBody().get("status"));
        }

        @Test
        @DisplayName("Should return 400 when Stripe webhook processing fails")
        void handleStripeWebhook_ProcessingFailed() throws IOException {
            when(rateLimitService.isWebhookProcessingAllowed("stripe", TEST_IP)).thenReturn(true);

            PaymentResponse paymentResponse = PaymentResponse.builder()
                    .success(false)
                    .message("Signature verification failed")
                    .build();
            when(paymentService.handleWebhook("stripe", TEST_PAYLOAD, null))
                    .thenReturn(paymentResponse);

            ResponseEntity<Map<String, String>> response = paymentWebhookController.handleStripeWebhook(
                    httpServletRequest, null);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        }

        @Test
        @DisplayName("Should return 429 when rate limited")
        void handleStripeWebhook_RateLimited() {
            when(rateLimitService.isWebhookProcessingAllowed("stripe", TEST_IP)).thenReturn(false);

            ResponseEntity<Map<String, String>> response = paymentWebhookController.handleStripeWebhook(
                    httpServletRequest, "sig");

            assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("POST /api/webhooks/payments/manual-transfer")
    class HandleManualTransferNotification {

        @Test
        @DisplayName("Should acknowledge manual transfer notification")
        void handleManualTransfer_Success() throws IOException {
            when(rateLimitService.isWebhookProcessingAllowed("manual-transfer", TEST_IP)).thenReturn(true);

            ResponseEntity<Map<String, String>> response =
                    paymentWebhookController.handleManualTransferNotification(httpServletRequest, "Bearer token");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("success", response.getBody().get("status"));
        }

        @Test
        @DisplayName("Should return 429 when rate limited")
        void handleManualTransfer_RateLimited() {
            when(rateLimitService.isWebhookProcessingAllowed("manual-transfer", TEST_IP)).thenReturn(false);

            ResponseEntity<Map<String, String>> response =
                    paymentWebhookController.handleManualTransferNotification(httpServletRequest, null);

            assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("POST /api/webhooks/payments/test")
    class HandleTestWebhook {

        @Test
        @DisplayName("Should process test webhook in dev environment")
        void handleTestWebhook_DevEnvironment() throws IOException {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

            ResponseEntity<Map<String, String>> response =
                    paymentWebhookController.handleTestWebhook(httpServletRequest, "test-provider");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("success", response.getBody().get("status"));
            assertEquals("test-provider", response.getBody().get("provider"));
        }

        @Test
        @DisplayName("Should return 404 in production environment")
        void handleTestWebhook_ProductionEnvironment() {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

            ResponseEntity<Map<String, String>> response =
                    paymentWebhookController.handleTestWebhook(httpServletRequest, "test");

            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        }

        @Test
        @DisplayName("Should process test webhook in test environment")
        void handleTestWebhook_TestEnvironment() throws IOException {
            when(environment.getActiveProfiles()).thenReturn(new String[]{"test"});

            ResponseEntity<Map<String, String>> response =
                    paymentWebhookController.handleTestWebhook(httpServletRequest, "test");

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("GET /api/webhooks/payments/status")
    class GetWebhookStatus {

        @Test
        @DisplayName("Should return webhook status with available providers")
        void getWebhookStatus_Success() {
            Map<String, String> providers = Map.of("paypal", "active", "stripe", "active");
            when(paymentService.getAvailableProviders()).thenReturn(providers);

            ResponseEntity<Map<String, Object>> response = paymentWebhookController.getWebhookStatus();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("active", response.getBody().get("status"));
            assertNotNull(response.getBody().get("supportedProviders"));
            assertNotNull(response.getBody().get("endpoints"));
        }
    }
}
