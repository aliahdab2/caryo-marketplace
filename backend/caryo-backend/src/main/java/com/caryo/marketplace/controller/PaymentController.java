package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.Dealer;
import com.caryo.marketplace.payment.*;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import com.caryo.marketplace.service.DealerService;
import com.caryo.marketplace.payment.PaymentValidationConstants;
import com.caryo.marketplace.security.ratelimit.RateLimit;
import com.caryo.marketplace.security.ratelimit.RateLimitKeyType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import static com.caryo.marketplace.payload.response.ApiResponse.success;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Payment Controller - Handles all payment operations
 * 
 * This controller provides endpoints for:
 * - Creating subscription payments
 * - Processing one-time payments  
 * - Checking payment status
 * - Getting payment history
 */
@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "Payment processing and subscription management")
public class PaymentController {

    private final PaymentService paymentService;
    private final DealerService dealerService;

    @Autowired
    public PaymentController(
            PaymentService paymentService,
            DealerService dealerService) {
        this.paymentService = paymentService;
        this.dealerService = dealerService;
    }

    /**
     * Create a subscription payment
     */
    @PostMapping("/subscription")
    @PreAuthorize("hasRole('DEALER')")
    @RateLimit(maxRequests = 5, windowSeconds = 60, keyType = RateLimitKeyType.USER,
        message = "Too many payment attempts. Please try again in a minute.")
    @Operation(summary = "Create subscription payment",
               description = "Create a payment for dealer subscription upgrade")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Payment created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<?> createSubscription(
            @Valid @RequestBody SubscriptionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Dealer dealer = getCurrentDealer(userDetails);

        String idempotencyKey = request.getIdempotencyKey() != null
            ? request.getIdempotencyKey()
            : paymentService.generateIdempotencyKey();

        PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());

        PaymentMethodDetails paymentMethodDetails = PaymentMethodDetails.builder()
            .paymentMethod(paymentMethod)
            .build();

        PaymentResponse response = paymentService.createSubscription(
            dealer,
            request.getTier(),
            request.getProviderId(),
            paymentMethodDetails,
            idempotencyKey
        );

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Process a one-time payment
     */
    @PostMapping("/one-time")
    @PreAuthorize("hasRole('DEALER')")
    @RateLimit(maxRequests = 5, windowSeconds = 60, keyType = RateLimitKeyType.USER,
        message = "Too many payment attempts. Please try again in a minute.")
    @Operation(summary = "Process one-time payment",
               description = "Process a one-time payment for services like featured listings")
    public ResponseEntity<?> processOneTimePayment(
            @Valid @RequestBody OneTimePaymentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Dealer dealer = getCurrentDealer(userDetails);

        String idempotencyKey = request.getIdempotencyKey() != null
            ? request.getIdempotencyKey()
            : paymentService.generateIdempotencyKey();

        PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());
        Currency currency = parseCurrency(request.getCurrency());

        PaymentMethodDetails paymentMethodDetails = PaymentMethodDetails.builder()
            .paymentMethod(paymentMethod)
            .build();

        PaymentResponse response = paymentService.processOneTimePayment(
            dealer,
            request.getAmount(),
            currency,
            request.getProviderId(),
            paymentMethodDetails,
            request.getDescription(),
            idempotencyKey
        );

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get payment status
     */
    @GetMapping("/status/{transactionId}")
    @PreAuthorize("hasRole('DEALER') or hasRole('ADMIN')")
    @Operation(summary = "Get payment status", 
               description = "Check the current status of a payment transaction")
    public ResponseEntity<?> getPaymentStatus(
            @Parameter(description = "Transaction ID")
            @PathVariable String transactionId) {

        if (transactionId == null || transactionId.trim().isEmpty()) {
            throw new IllegalArgumentException("Transaction ID cannot be empty");
        }

        PaymentResponse response = paymentService.getPaymentStatus(transactionId.trim());
        return ResponseEntity.ok(response);
    }

    /**
     * Get payment history for current dealer
     */
    @GetMapping("/history")
    @PreAuthorize("hasRole('DEALER')")
    @Operation(summary = "Get payment history", 
               description = "Get payment history for the current dealer")
    public ResponseEntity<?> getPaymentHistory(@AuthenticationPrincipal UserDetailsImpl userDetails) {

        Dealer dealer = getCurrentDealer(userDetails);
        List<PaymentTransaction> history = paymentService.getPaymentHistory(dealer);

        return ResponseEntity.ok(
            success(Map.of(
                "transactions", history,
                "count", history.size(),
                "dealerId", dealer.getId(),
                "dealerName", dealer.getBusinessName()
            )));
    }

    /**
     * Cancel subscription
     */
    @PostMapping("/cancel-subscription")
    @PreAuthorize("hasRole('DEALER')")
    @Operation(summary = "Cancel subscription", 
               description = "Cancel an active subscription")
    public ResponseEntity<?> cancelSubscription(
            @Valid @RequestBody CancelSubscriptionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        Dealer dealer = getCurrentDealer(userDetails);

        PaymentResponse response = paymentService.cancelSubscription(
            dealer,
            request.getSubscriptionId(),
            request.getProviderId()
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get available payment providers
     */
    @GetMapping("/providers")
    @Operation(summary = "Get payment providers", 
               description = "Get list of available payment providers")
    public ResponseEntity<?> getPaymentProviders() {
        Map<String, String> providers = paymentService.getAvailableProviders();
        return ResponseEntity.ok(
            success(providers));
    }

    /**
     * Get supported payment methods for a provider
     */
    @GetMapping("/providers/{providerId}/methods")
    @Operation(summary = "Get supported payment methods", 
               description = "Get payment methods supported by a specific provider")
    public ResponseEntity<?> getSupportedPaymentMethods(
            @Parameter(description = "Provider ID")
            @PathVariable String providerId) {

        PaymentMethod[] methods = paymentService.getSupportedPaymentMethods(providerId);
        Currency[] currencies = paymentService.getSupportedCurrencies(providerId);

        return ResponseEntity.ok(
            success(Map.of(
                "providerId", providerId,
                "supportedMethods", methods,
                "supportedCurrencies", currencies
            )));
    }

    /**
     * Handle webhook from payment provider
     */
    @PostMapping("/webhook/{providerId}")
    @Operation(summary = "Payment webhook", 
               description = "Handle webhook notifications from payment providers")
    public ResponseEntity<?> handleWebhook(
            @Parameter(description = "Provider ID")
            @PathVariable String providerId,
            @RequestBody String payload,
            @RequestHeader(value = "X-Signature", required = false) String signature) {

        PaymentResponse response = paymentService.handleWebhook(providerId, payload, signature);
        return ResponseEntity.ok(response);
    }

    private Dealer getCurrentDealer(UserDetailsImpl userDetails) {
        return dealerService.getDealerByUserId(userDetails.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Dealer", "userId", userDetails.getId()));
    }

    private PaymentMethod parsePaymentMethod(String method) {
        try {
            return PaymentMethod.valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidPaymentMethodException("Unsupported payment method: " + method);
        }
    }

    private Currency parseCurrency(String currency) {
        try {
            return Currency.valueOf(currency.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new PaymentException("INVALID_CURRENCY", "Unsupported currency: " + currency);
        }
    }

    // Request DTOs
    @Data
    public static class SubscriptionRequest {
        @NotBlank(message = "Subscription tier is required")
        @Pattern(regexp = PaymentValidationConstants.TIER_PATTERN, 
                message = PaymentValidationConstants.INVALID_TIER_MESSAGE)
        private String tier;
        
        @NotBlank(message = "Provider ID is required")
        @Size(max = PaymentValidationConstants.MAX_PROVIDER_ID_LENGTH, 
              message = "Provider ID too long")
        @Pattern(regexp = PaymentValidationConstants.PROVIDER_ID_PATTERN,
                message = PaymentValidationConstants.INVALID_PROVIDER_MESSAGE)
        private String providerId = "manual_transfer";
        
        @NotBlank(message = "Payment method is required")
        @Size(max = PaymentValidationConstants.MAX_PAYMENT_METHOD_LENGTH,
              message = "Payment method too long")
        @Pattern(regexp = PaymentValidationConstants.PAYMENT_METHOD_PATTERN,
                message = PaymentValidationConstants.INVALID_PAYMENT_METHOD_MESSAGE)
        private String paymentMethod = "BANK_TRANSFER";
        
        @Size(min = PaymentValidationConstants.MIN_IDEMPOTENCY_KEY_LENGTH,
              max = PaymentValidationConstants.MAX_IDEMPOTENCY_KEY_LENGTH,
              message = "Idempotency key must be 10-100 characters")
        @Pattern(regexp = PaymentValidationConstants.IDEMPOTENCY_KEY_PATTERN,
                message = PaymentValidationConstants.INVALID_IDEMPOTENCY_KEY_MESSAGE)
        private String idempotencyKey;
    }

    @Data
    public static class OneTimePaymentRequest {
        @NotNull(message = "Amount is required")
        @DecimalMin(value = PaymentValidationConstants.MIN_AMOUNT, 
                   message = PaymentValidationConstants.INVALID_AMOUNT_MESSAGE)
        @DecimalMax(value = PaymentValidationConstants.MAX_AMOUNT,
                   message = PaymentValidationConstants.INVALID_AMOUNT_MESSAGE)
        @Digits(integer = 10, fraction = 2, message = "Amount must have at most 2 decimal places")
        private BigDecimal amount;
        
        @NotBlank(message = "Currency is required")
        @Pattern(regexp = PaymentValidationConstants.CURRENCY_PATTERN,
                message = PaymentValidationConstants.INVALID_CURRENCY_MESSAGE)
        private String currency = "SYP";
        
        @NotBlank(message = "Provider ID is required")
        @Size(max = PaymentValidationConstants.MAX_PROVIDER_ID_LENGTH,
              message = "Provider ID too long")
        @Pattern(regexp = PaymentValidationConstants.PROVIDER_ID_PATTERN,
                message = PaymentValidationConstants.INVALID_PROVIDER_MESSAGE)
        private String providerId = "manual_transfer";
        
        @NotBlank(message = "Payment method is required")
        @Size(max = PaymentValidationConstants.MAX_PAYMENT_METHOD_LENGTH,
              message = "Payment method too long")
        @Pattern(regexp = PaymentValidationConstants.PAYMENT_METHOD_PATTERN,
                message = PaymentValidationConstants.INVALID_PAYMENT_METHOD_MESSAGE)
        private String paymentMethod = "BANK_TRANSFER";
        
        @Size(max = PaymentValidationConstants.MAX_DESCRIPTION_LENGTH,
              message = "Description too long")
        private String description;
        
        @Size(min = PaymentValidationConstants.MIN_IDEMPOTENCY_KEY_LENGTH,
              max = PaymentValidationConstants.MAX_IDEMPOTENCY_KEY_LENGTH,
              message = "Idempotency key must be 10-100 characters")
        @Pattern(regexp = PaymentValidationConstants.IDEMPOTENCY_KEY_PATTERN,
                message = PaymentValidationConstants.INVALID_IDEMPOTENCY_KEY_MESSAGE)
        private String idempotencyKey;
    }

    @Data
    public static class CancelSubscriptionRequest {
        @NotBlank(message = "Subscription ID is required")
        @Size(max = 100, message = "Subscription ID too long")
        private String subscriptionId;
        
        @NotBlank(message = "Provider ID is required")
        @Size(max = PaymentValidationConstants.MAX_PROVIDER_ID_LENGTH,
              message = "Provider ID too long")
        @Pattern(regexp = PaymentValidationConstants.PROVIDER_ID_PATTERN,
                message = PaymentValidationConstants.INVALID_PROVIDER_MESSAGE)
        private String providerId = "manual_transfer";
    }
}
