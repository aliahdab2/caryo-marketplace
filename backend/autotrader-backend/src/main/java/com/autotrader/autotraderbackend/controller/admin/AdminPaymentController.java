package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.payment.PaymentResponse;
import com.autotrader.autotraderbackend.payment.PaymentService;
import com.autotrader.autotraderbackend.payment.PaymentTransaction;
import com.autotrader.autotraderbackend.payment.PaymentValidationConstants;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
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
@RequestMapping("/api/admin/payments")
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
            // Get admin user ID
            Long adminUserId = userDetails.getId();
            
            // TODO: Implement payment rejection logic
            // For now, we'll return a placeholder response
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment rejected",
                "transactionId", transactionId,
                "reason", request.getReason(),
                "rejectedBy", adminUserId
            ));

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
            // TODO: Implement advanced search functionality
            // For now, return pending payments as placeholder
            
            List<PaymentTransaction> results = paymentService.getPendingVerifications();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "results", results,
                "count", results.size(),
                "searchCriteria", Map.of(
                    "dealerEmail", dealerEmail,
                    "status", status,
                    "transactionId", transactionId,
                    "dateFrom", dateFrom,
                    "dateTo", dateTo
                )
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
