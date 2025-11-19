package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.Dealer;
import com.autotrader.autotraderbackend.payment.Currency;
import com.autotrader.autotraderbackend.payment.PaymentMethod;
import com.autotrader.autotraderbackend.payment.PaymentMethodDetails;
import com.autotrader.autotraderbackend.payment.PaymentResponse;
import com.autotrader.autotraderbackend.payment.PaymentService;
import com.autotrader.autotraderbackend.payment.PaymentStatus;
import com.autotrader.autotraderbackend.payment.PaymentTransaction;
import com.autotrader.autotraderbackend.security.jwt.AuthTokenFilter;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.autotrader.autotraderbackend.service.DealerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for PaymentController
 * 
 * Tests the payment API endpoints without requiring actual payment provider implementations.
 * All payment services are mocked, so we can test the controller layer in isolation.
 */
@WebMvcTest(
    controllers = PaymentController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = AuthTokenFilter.class)
)
@Import(com.autotrader.autotraderbackend.config.TestSecurityConfig.class)
@AutoConfigureMockMvc(addFilters = true)
@TestPropertySource(properties = {
    "subscription.basic.price=50",
    "subscription.advanced.price=100",
    "subscription.professional.price=200"
})
@DisplayName("PaymentController Tests")
class PaymentControllerTest {

    /**
     * Custom annotation to provide UserDetailsImpl in security context
     */
    @Target({ElementType.METHOD, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @WithSecurityContext(factory = PaymentControllerTest.WithMockUserDetailsImplSecurityContextFactory.class)
    @interface WithMockUserDetailsImpl {
        long userId() default 1L;
        String username() default "testuser";
        String[] roles() default {"USER"};
    }

    /**
     * Security context factory for creating UserDetailsImpl
     */
    static class WithMockUserDetailsImplSecurityContextFactory implements WithSecurityContextFactory<WithMockUserDetailsImpl> {
        @Override
        public SecurityContext createSecurityContext(WithMockUserDetailsImpl annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            
            List<SimpleGrantedAuthority> authorities = Arrays.stream(annotation.roles())
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
            
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

    @MockBean
    private DealerService dealerService;

    private Dealer testDealer;

    @BeforeEach
    void setUp() {
        // Create a test dealer
        testDealer = Dealer.builder()
            .id(1L)
            .businessName("Test Dealership")
            .businessEmail("test@dealer.sy")
            .businessPhone("+963-11-1234567")
            .subscriptionTier("trial")
            .subscriptionStatus("trial")
            .trialStartedAt(ZonedDateTime.now())
            .trialExpired(false)
            .canCreateListings(true)
            .build();
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should create subscription payment successfully")
    void createSubscription_ShouldReturnSuccess() throws Exception {
        // Given
        PaymentController.SubscriptionRequest request = new PaymentController.SubscriptionRequest();
        request.setTier("basic");
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");

        PaymentResponse mockResponse = PaymentResponse.success(
            "TXN-12345",
            new BigDecimal("50.00"),
            "USD",
            "Subscription created successfully"
        );
        mockResponse.addMetadata("paymentInstructions", "Please transfer $50 to account XXX-XXX-XXX");

        when(dealerService.getDealerByUserId(1L)).thenReturn(Optional.of(testDealer));
        when(paymentService.generateIdempotencyKey()).thenReturn("idempotency-key-123");
        when(paymentService.createSubscription(
            any(Dealer.class),
            eq("basic"),
            eq("manual_transfer"),
            any(PaymentMethodDetails.class),
            anyString()
        )).thenReturn(mockResponse);

        // When & Then
        mockMvc.perform(post("/api/payments/subscription")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.transactionId").value("TXN-12345"))
                .andExpect(jsonPath("$.message").value("Subscription created successfully"));

        verify(paymentService).createSubscription(
            any(Dealer.class),
            eq("basic"),
            eq("manual_transfer"),
            any(PaymentMethodDetails.class),
            anyString()
        );
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should return 400 when dealer not found")
    void createSubscription_ShouldReturn400WhenDealerNotFound() throws Exception {
        // Given
        PaymentController.SubscriptionRequest request = new PaymentController.SubscriptionRequest();
        request.setTier("basic");
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");

        when(dealerService.getDealerByUserId(1L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(post("/api/payments/subscription")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("DEALER_NOT_FOUND"));

        verify(paymentService, never()).createSubscription(any(), any(), any(), any(), any());
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should return 400 when payment service fails")
    void createSubscription_ShouldReturn400WhenPaymentFails() throws Exception {
        // Given
        PaymentController.SubscriptionRequest request = new PaymentController.SubscriptionRequest();
        request.setTier("basic");
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");

        when(dealerService.getDealerByUserId(1L)).thenReturn(Optional.of(testDealer));
        when(paymentService.generateIdempotencyKey()).thenReturn("idempotency-key-123");
        when(paymentService.createSubscription(any(), any(), any(), any(), any()))
            .thenThrow(new RuntimeException("Payment provider unavailable"));

        // When & Then
        mockMvc.perform(post("/api/payments/subscription")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("SUBSCRIPTION_CREATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Payment provider unavailable"));
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should validate request - missing tier")
    void createSubscription_ShouldValidateMissingTier() throws Exception {
        // Given
        PaymentController.SubscriptionRequest request = new PaymentController.SubscriptionRequest();
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");
        // tier is null

        // When & Then
        mockMvc.perform(post("/api/payments/subscription")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(paymentService, never()).createSubscription(any(), any(), any(), any(), any());
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should validate request - invalid tier")
    void createSubscription_ShouldValidateInvalidTier() throws Exception {
        // Given
        PaymentController.SubscriptionRequest request = new PaymentController.SubscriptionRequest();
        request.setTier("invalid_tier");
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");

        // When & Then
        mockMvc.perform(post("/api/payments/subscription")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(paymentService, never()).createSubscription(any(), any(), any(), any(), any());
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should use provided idempotency key")
    void createSubscription_ShouldUseProvidedIdempotencyKey() throws Exception {
        // Given
        PaymentController.SubscriptionRequest request = new PaymentController.SubscriptionRequest();
        request.setTier("advanced");
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");
        request.setIdempotencyKey("custom-idempotency-key-456");

        PaymentResponse mockResponse = PaymentResponse.success(
            "TXN-67890",
            new BigDecimal("100.00"),
            "USD",
            "Subscription created"
        );

        when(dealerService.getDealerByUserId(1L)).thenReturn(Optional.of(testDealer));
        when(paymentService.createSubscription(
            any(Dealer.class),
            eq("advanced"),
            eq("manual_transfer"),
            any(PaymentMethodDetails.class),
            eq("custom-idempotency-key-456")
        )).thenReturn(mockResponse);

        // When & Then
        mockMvc.perform(post("/api/payments/subscription")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(paymentService, never()).generateIdempotencyKey();
        verify(paymentService).createSubscription(
            any(Dealer.class),
            eq("advanced"),
            eq("manual_transfer"),
            any(PaymentMethodDetails.class),
            eq("custom-idempotency-key-456")
        );
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should process one-time payment successfully")
    void processOneTimePayment_ShouldReturnSuccess() throws Exception {
        // Given
        PaymentController.OneTimePaymentRequest request = new PaymentController.OneTimePaymentRequest();
        request.setAmount(new BigDecimal("25.50"));
        request.setCurrency("SYP");
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");
        request.setDescription("Featured listing payment");

        PaymentResponse mockResponse = PaymentResponse.success(
            "TXN-ONETIME-123",
            new BigDecimal("25.50"),
            "SYP",
            "One-time payment processed"
        );

        when(dealerService.getDealerByUserId(1L)).thenReturn(Optional.of(testDealer));
        when(paymentService.generateIdempotencyKey()).thenReturn("idempotency-key-789");
        when(paymentService.processOneTimePayment(
            any(Dealer.class),
            eq(new BigDecimal("25.50")),
            eq(Currency.SYP),
            eq("manual_transfer"),
            any(PaymentMethodDetails.class),
            eq("Featured listing payment"),
            anyString()
        )).thenReturn(mockResponse);

        // When & Then
        mockMvc.perform(post("/api/payments/one-time")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.transactionId").value("TXN-ONETIME-123"));

        verify(paymentService).processOneTimePayment(
            any(Dealer.class),
            eq(new BigDecimal("25.50")),
            eq(Currency.SYP),
            eq("manual_transfer"),
            any(PaymentMethodDetails.class),
            eq("Featured listing payment"),
            anyString()
        );
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should validate one-time payment amount")
    void processOneTimePayment_ShouldValidateAmount() throws Exception {
        // Given
        PaymentController.OneTimePaymentRequest request = new PaymentController.OneTimePaymentRequest();
        request.setAmount(new BigDecimal("-10.00")); // Invalid negative amount
        request.setCurrency("SYP");
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");

        // When & Then
        mockMvc.perform(post("/api/payments/one-time")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(paymentService, never()).processOneTimePayment(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER", "ADMIN"})
    @DisplayName("Should get payment status successfully")
    void getPaymentStatus_ShouldReturnSuccess() throws Exception {
        // Given
        String transactionId = "TXN-12345";
        PaymentResponse mockResponse = PaymentResponse.success(
            transactionId,
            new BigDecimal("50.00"),
            "USD",
            "Payment completed"
        );

        when(paymentService.getPaymentStatus(transactionId)).thenReturn(mockResponse);

        // When & Then
        mockMvc.perform(get("/api/payments/status/{transactionId}", transactionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.transactionId").value(transactionId));

        verify(paymentService).getPaymentStatus(transactionId);
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should get payment history successfully")
    void getPaymentHistory_ShouldReturnSuccess() throws Exception {
        // Given
        List<PaymentTransaction> mockHistory = Arrays.asList(
            PaymentTransaction.builder()
                .id(1L)
                .transactionId("TXN-001")
                .amount(new BigDecimal("50.00"))
                .currency(Currency.USD)
                .status(PaymentStatus.COMPLETED)
                .dealer(testDealer)
                .build(),
            PaymentTransaction.builder()
                .id(2L)
                .transactionId("TXN-002")
                .amount(new BigDecimal("100.00"))
                .currency(Currency.USD)
                .status(PaymentStatus.PENDING_VERIFICATION)
                .dealer(testDealer)
                .build()
        );

        when(dealerService.getDealerByUserId(1L)).thenReturn(Optional.of(testDealer));
        when(paymentService.getPaymentHistory(testDealer)).thenReturn(mockHistory);

        // When & Then
        mockMvc.perform(get("/api/payments/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactions").isArray())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.dealerId").value(1))
                .andExpect(jsonPath("$.dealerName").value("Test Dealership"))
                .andExpect(jsonPath("$.transactions[0].transactionId").value("TXN-001"))
                .andExpect(jsonPath("$.transactions[1].transactionId").value("TXN-002"));

        verify(paymentService).getPaymentHistory(testDealer);
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should get available payment providers")
    void getPaymentProviders_ShouldReturnProviders() throws Exception {
        // Given
        Map<String, String> mockProviders = Map.of(
            "manual_transfer", "Manual Bank Transfer",
            "cham_bank", "Cham Bank"
        );

        when(paymentService.getAvailableProviders()).thenReturn(mockProviders);

        // When & Then
        mockMvc.perform(get("/api/payments/providers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.manual_transfer").value("Manual Bank Transfer"))
                .andExpect(jsonPath("$.cham_bank").value("Cham Bank"));

        verify(paymentService).getAvailableProviders();
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should get supported payment methods for provider")
    void getSupportedPaymentMethods_ShouldReturnMethods() throws Exception {
        // Given
        String providerId = "manual_transfer";
        PaymentMethod[] methods = {PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH};
        Currency[] currencies = {Currency.USD, Currency.SYP};

        when(paymentService.getSupportedPaymentMethods(providerId)).thenReturn(methods);
        when(paymentService.getSupportedCurrencies(providerId)).thenReturn(currencies);

        // When & Then
        mockMvc.perform(get("/api/payments/providers/{providerId}/methods", providerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerId").value(providerId))
                .andExpect(jsonPath("$.supportedMethods").isArray())
                .andExpect(jsonPath("$.supportedCurrencies").isArray());

        verify(paymentService).getSupportedPaymentMethods(providerId);
        verify(paymentService).getSupportedCurrencies(providerId);
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "dealer", roles = {"DEALER"})
    @DisplayName("Should cancel subscription successfully")
    void cancelSubscription_ShouldReturnSuccess() throws Exception {
        // Given
        PaymentController.CancelSubscriptionRequest request = new PaymentController.CancelSubscriptionRequest();
        request.setSubscriptionId("SUB-12345");
        request.setProviderId("manual_transfer");

        PaymentResponse mockResponse = PaymentResponse.success(
            "CANCEL-12345",
            BigDecimal.ZERO,
            "USD",
            "Subscription cancelled successfully"
        );

        when(dealerService.getDealerByUserId(1L)).thenReturn(Optional.of(testDealer));
        when(paymentService.cancelSubscription(
            eq(testDealer),
            eq("SUB-12345"),
            eq("manual_transfer")
        )).thenReturn(mockResponse);

        // When & Then
        mockMvc.perform(post("/api/payments/cancel-subscription")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.transactionId").value("CANCEL-12345"));

        verify(paymentService).cancelSubscription(testDealer, "SUB-12345", "manual_transfer");
    }

    @Test
    @WithMockUserDetailsImpl(userId = 1L, username = "user", roles = {"USER"})
    @DisplayName("Should return 403 for non-dealer user")
    void createSubscription_ShouldReturn403ForNonDealer() throws Exception {
        // Given
        PaymentController.SubscriptionRequest request = new PaymentController.SubscriptionRequest();
        request.setTier("basic");
        request.setProviderId("manual_transfer");
        request.setPaymentMethod("BANK_TRANSFER");

        // When & Then
        mockMvc.perform(post("/api/payments/subscription")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(paymentService, never()).createSubscription(any(), any(), any(), any(), any());
    }
}

