package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.model.Dealer;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payment.*;
import com.autotrader.autotraderbackend.security.jwt.AuthTokenFilter;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = AdminPaymentController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = AuthTokenFilter.class)
)
@Import(com.autotrader.autotraderbackend.config.TestSecurityConfig.class)
@AutoConfigureMockMvc(addFilters = true)
@DisplayName("AdminPaymentController Tests")
class AdminPaymentControllerTest {

    @Target({ElementType.METHOD, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @WithSecurityContext(factory = WithMockAdminSecurityContextFactory.class)
    @interface WithMockAdmin {
        long userId() default 1L;
        String username() default "admin";
    }

    static class WithMockAdminSecurityContextFactory implements WithSecurityContextFactory<WithMockAdmin> {
        @Override
        public SecurityContext createSecurityContext(WithMockAdmin annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_ADMIN"),
                new SimpleGrantedAuthority("ROLE_USER")
            );
            UserDetailsImpl userDetails = new UserDetailsImpl(
                annotation.userId(),
                annotation.username(),
                annotation.username() + "@example.com",
                "password",
                authorities
            );
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, authorities);
            context.setAuthentication(authentication);
            return context;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    private PaymentTransaction testTransaction;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setEmail("dealer@example.com");

        Dealer dealer = Dealer.builder()
            .id(1L)
            .businessName("Test Dealer")
            .businessEmail("dealer@example.com")
            .build();
        dealer.setUser(user);

        testTransaction = PaymentTransaction.builder()
            .id(1L)
            .transactionId("TXN-001")
            .dealer(dealer)
            .amount(new BigDecimal("100.00"))
            .currency(Currency.USD)
            .status(PaymentStatus.PENDING_VERIFICATION)
            .providerType(PaymentProviderType.MANUAL_TRANSFER)
            .createdAt(ZonedDateTime.now())
            .build();
    }

    @Nested
    @DisplayName("GET /api/admin/payments/pending")
    class GetPendingPayments {

        @Test
        @WithMockAdmin
        @DisplayName("Should return pending payments")
        void shouldReturnPendingPayments() throws Exception {
            when(paymentService.getPendingVerifications())
                .thenReturn(List.of(testTransaction));

            mockMvc.perform(get("/api/admin/payments/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.payments", hasSize(1)));
        }

        @Test
        @WithMockUser(roles = "USER")
        @DisplayName("Should deny access without admin role")
        void shouldDenyNonAdmin() throws Exception {
            mockMvc.perform(get("/api/admin/payments/pending"))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/admin/payments/reject/{transactionId}")
    class RejectPayment {

        @Test
        @WithMockAdmin
        @DisplayName("Should reject payment successfully")
        void shouldRejectPayment() throws Exception {
            PaymentResponse rejectedResponse = PaymentResponse.builder()
                .success(true)
                .status(PaymentStatus.CANCELLED)
                .transactionId("TXN-001")
                .amount(new BigDecimal("100.00"))
                .currency("USD")
                .message("Payment rejected: Insufficient proof of transfer")
                .build();

            when(paymentService.rejectPaymentManually(eq("TXN-001"), eq(1L), anyString()))
                .thenReturn(rejectedResponse);

            AdminPaymentController.RejectPaymentRequest request = new AdminPaymentController.RejectPaymentRequest();
            request.setReason("Insufficient proof of transfer");

            mockMvc.perform(post("/api/admin/payments/reject/TXN-001")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Payment rejected"))
                .andExpect(jsonPath("$.transactionId").value("TXN-001"))
                .andExpect(jsonPath("$.reason").value("Insufficient proof of transfer"));

            verify(paymentService).rejectPaymentManually("TXN-001", 1L, "Insufficient proof of transfer");
        }

        @Test
        @WithMockAdmin
        @DisplayName("Should return error for invalid transaction status")
        void shouldReturnErrorForInvalidStatus() throws Exception {
            PaymentResponse invalidResponse = PaymentResponse.failure(
                "INVALID_STATUS",
                "Transaction is not pending verification",
                "Current status: COMPLETED"
            );

            when(paymentService.rejectPaymentManually(eq("TXN-002"), eq(1L), anyString()))
                .thenReturn(invalidResponse);

            AdminPaymentController.RejectPaymentRequest request = new AdminPaymentController.RejectPaymentRequest();
            request.setReason("Invalid transfer");

            mockMvc.perform(post("/api/admin/payments/reject/TXN-002")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS"));
        }

        @Test
        @WithMockAdmin
        @DisplayName("Should require rejection reason")
        void shouldRequireReason() throws Exception {
            AdminPaymentController.RejectPaymentRequest request = new AdminPaymentController.RejectPaymentRequest();
            // reason is null — @NotBlank should fail

            mockMvc.perform(post("/api/admin/payments/reject/TXN-001")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

            verify(paymentService, never()).rejectPaymentManually(anyString(), anyLong(), anyString());
        }

        @Test
        @WithMockUser(roles = "USER")
        @DisplayName("Should deny non-admin rejection")
        void shouldDenyNonAdmin() throws Exception {
            AdminPaymentController.RejectPaymentRequest request = new AdminPaymentController.RejectPaymentRequest();
            request.setReason("test");

            mockMvc.perform(post("/api/admin/payments/reject/TXN-001")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/admin/payments/search")
    class SearchPayments {

        @Test
        @WithMockAdmin
        @DisplayName("Should search by transaction ID")
        void shouldSearchByTransactionId() throws Exception {
            when(paymentService.searchPayments(eq("TXN-001"), any(), any(), any(), any()))
                .thenReturn(List.of(testTransaction));

            mockMvc.perform(get("/api/admin/payments/search")
                    .param("transactionId", "TXN-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.results", hasSize(1)));
        }

        @Test
        @WithMockAdmin
        @DisplayName("Should search by status")
        void shouldSearchByStatus() throws Exception {
            when(paymentService.searchPayments(any(), eq("PENDING_VERIFICATION"), any(), any(), any()))
                .thenReturn(List.of(testTransaction));

            mockMvc.perform(get("/api/admin/payments/search")
                    .param("status", "PENDING_VERIFICATION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.count").value(1));
        }

        @Test
        @WithMockAdmin
        @DisplayName("Should return empty results for no matches")
        void shouldReturnEmptyForNoMatches() throws Exception {
            when(paymentService.searchPayments(any(), any(), any(), any(), any()))
                .thenReturn(List.of());

            mockMvc.perform(get("/api/admin/payments/search")
                    .param("dealerEmail", "nobody@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.count").value(0))
                .andExpect(jsonPath("$.results", hasSize(0)));
        }

        @Test
        @WithMockAdmin
        @DisplayName("Should handle no params without NPE")
        void shouldHandleNoParamsWithoutNpe() throws Exception {
            when(paymentService.searchPayments(any(), any(), any(), any(), any()))
                .thenReturn(List.of(testTransaction));

            mockMvc.perform(get("/api/admin/payments/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.count").value(1));
        }

        @Test
        @WithMockAdmin
        @DisplayName("Should return error for invalid date format")
        void shouldReturnErrorForInvalidDate() throws Exception {
            mockMvc.perform(get("/api/admin/payments/search")
                    .param("dateFrom", "not-a-date"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_DATE_FORMAT"));
        }

        @Test
        @WithMockAdmin
        @DisplayName("Should return error for invalid status")
        void shouldReturnErrorForInvalidStatus() throws Exception {
            when(paymentService.searchPayments(any(), eq("INVALID_STATUS"), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("No enum constant PaymentStatus.INVALID_STATUS"));

            mockMvc.perform(get("/api/admin/payments/search")
                    .param("status", "INVALID_STATUS"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS"));
        }

        @Test
        @WithMockUser(roles = "USER")
        @DisplayName("Should deny non-admin search")
        void shouldDenyNonAdmin() throws Exception {
            mockMvc.perform(get("/api/admin/payments/search"))
                .andExpect(status().isForbidden());
        }
    }
}
