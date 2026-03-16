package com.caryo.marketplace.controller.admin;

import com.caryo.marketplace.payment.PaymentResponse;
import com.caryo.marketplace.payment.PaymentService;
import com.caryo.marketplace.payment.PaymentTransaction;
import com.caryo.marketplace.payment.PaymentValidationConstants;
import com.caryo.marketplace.security.services.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin Payment Controller - Admin-only payment operations
 * 
 * This controller provides admin endpoints for:
 * - Verifying manual payments
 * - Viewing all pending payments
 * - Managing payment transactions
 * - Payment system administration
 */
@RestController
@RequestMapping("/api/v1/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Payments", description = "Admin payment management and verification")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @Autowired
    public AdminPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Get all pending payments that need verification
     */
    @GetMapping("/pending")
    @Operation(summary = "Get pending payments", 
               description = "Get all payments pending manual verification")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Pending payments retrieved"),
        @ApiResponse(responseCode = "403", description = "Admin access required")
    })
    public ResponseEntity<?> getPendingPayments() {
        try {
            List<PaymentTransaction> pendingPayments = paymentService.getPendingVerifications();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "count", pendingPayments.size(),
                "payments", pendingPayments
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "PENDING_PAYMENTS_FETCH_FAILED",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Verify a manual payment
     */
    @PostMapping("/verify/{transactionId}")
    @Operation(summary = "Verify payment", 
               description = "Manually verify a bank transfer payment")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Payment verified successfully"),
        @ApiResponse(responseCode = "400", description = "Verification failed"),
        @ApiResponse(responseCode = "404", description = "Transaction not found")
    })
    public ResponseEntity<?> verifyPayment(
            @Parameter(description = "Transaction ID to verify") 
            @PathVariable String transactionId,
            @Valid @RequestBody VerifyPaymentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        try {
            // Get admin user ID
            Long adminUserId = userDetails.getId();
            
            // Verify the payment
            PaymentResponse response = paymentService.verifyPaymentManually(transactionId, adminUserId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment verified successfully",
                "transaction", response,
                "verifiedBy", adminUserId,
                "notes", request.getNotes()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "PAYMENT_VERIFICATION_FAILED",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Reject a payment
     */
    @PostMapping("/reject/{transactionId}")
    @Operation(summary = "Reject payment", 
               description = "Reject a payment transaction with reason")
    public ResponseEntity<?> rejectPayment(
            @Parameter(description = "Transaction ID to reject") 
            @PathVariable String transactionId,
            @Valid @RequestBody RejectPaymentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        try {
            Long adminUserId = userDetails.getId();

            PaymentResponse response = paymentService.rejectPaymentManually(
                transactionId, adminUserId, request.getReason());

            if (response.isSuccess()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment rejected",
                    "transactionId", transactionId,
                    "reason", request.getReason(),
                    "rejectedBy", adminUserId
                ));
            }

            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("error", response.getErrorCode());
            errorBody.put("message", response.getMessage());
            return ResponseEntity.badRequest().body(errorBody);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "PAYMENT_REJECTION_FAILED",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Get payment statistics for admin dashboard
     */
    @GetMapping("/stats")
    @Operation(summary = "Get payment statistics", 
               description = "Get payment statistics for admin dashboard")
    public ResponseEntity<?> getPaymentStats() {
        try {
            List<PaymentTransaction> pendingPayments = paymentService.getPendingVerifications();
            
            // Calculate basic stats
            Map<String, Object> stats = Map.of(
                "pendingVerifications", pendingPayments.size(),
                "totalPendingAmount", pendingPayments.stream()
                    .mapToDouble(t -> t.getAmount().doubleValue())
                    .sum(),
                "oldestPendingPayment", pendingPayments.stream()
                    .map(PaymentTransaction::getCreatedAt)
                    .min(java.time.ZonedDateTime::compareTo)
                    .orElse(null),
                "recentPayments", pendingPayments.stream()
                    .limit(5)
                    .toList()
            );
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "STATS_FETCH_FAILED",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Search payments by criteria
     */
    @GetMapping("/search")
    @Operation(summary = "Search payments", 
               description = "Search payments by various criteria")
    public ResponseEntity<?> searchPayments(
            @RequestParam(required = false) String dealerEmail,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String transactionId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        try {
            ZonedDateTime startDate = null;
            ZonedDateTime endDate = null;

            if (dateFrom != null && !dateFrom.isBlank()) {
                try {
                    startDate = ZonedDateTime.parse(dateFrom);
                } catch (DateTimeParseException e) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "INVALID_DATE_FORMAT",
                        "message", "Invalid dateFrom format. Use ISO-8601 (e.g. 2024-01-01T00:00:00Z)"
                    ));
                }
            }

            if (dateTo != null && !dateTo.isBlank()) {
                try {
                    endDate = ZonedDateTime.parse(dateTo);
                } catch (DateTimeParseException e) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "INVALID_DATE_FORMAT",
                        "message", "Invalid dateTo format. Use ISO-8601 (e.g. 2024-12-31T23:59:59Z)"
                    ));
                }
            }

            if (endDate != null && startDate == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_DATE_RANGE",
                    "message", "dateFrom is required when dateTo is provided"
                ));
            }

            List<PaymentTransaction> results = paymentService.searchPayments(
                transactionId, status, dealerEmail, startDate, endDate);

            Map<String, Object> searchCriteria = new HashMap<>();
            if (dealerEmail != null) searchCriteria.put("dealerEmail", dealerEmail);
            if (status != null) searchCriteria.put("status", status);
            if (transactionId != null) searchCriteria.put("transactionId", transactionId);
            if (dateFrom != null) searchCriteria.put("dateFrom", dateFrom);
            if (dateTo != null) searchCriteria.put("dateTo", dateTo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("results", results);
            response.put("count", results.size());
            response.put("searchCriteria", searchCriteria);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "INVALID_STATUS",
                "message", "Invalid payment status: " + status
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "SEARCH_FAILED",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Get payment details for admin review
     */
    @GetMapping("/details/{transactionId}")
    @Operation(summary = "Get payment details", 
               description = "Get detailed information about a payment transaction")
    public ResponseEntity<?> getPaymentDetails(
            @Parameter(description = "Transaction ID") 
            @PathVariable String transactionId) {
        
        try {
            PaymentResponse response = paymentService.getPaymentStatus(transactionId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "transaction", response,
                "adminActions", List.of("verify", "reject", "request_more_info")
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "DETAILS_FETCH_FAILED",
                "message", e.getMessage()
            ));
        }
    }


    // Request DTOs
    @Data
    public static class VerifyPaymentRequest {
        @Size(max = PaymentValidationConstants.MAX_DESCRIPTION_LENGTH,
              message = "Notes too long")
        private String notes;
        
        @Size(max = 100, message = "Bank reference too long")
        private String bankReference;
        
        @NotBlank(message = "Verification method is required")
        @Size(max = 50, message = "Verification method too long")
        private String verificationMethod = "manual_check";
    }

    @Data
    public static class RejectPaymentRequest {
        @NotBlank(message = "Rejection reason is required")
        @Size(max = PaymentValidationConstants.MAX_DESCRIPTION_LENGTH,
              message = "Reason too long")
        private String reason;
        
        @Size(max = PaymentValidationConstants.MAX_DESCRIPTION_LENGTH,
              message = "Notes too long")
        private String notes;
        
        private boolean notifyDealer = true;
    }
}
