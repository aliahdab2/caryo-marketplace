package com.autotrader.autotraderbackend.payment;

import com.autotrader.autotraderbackend.model.Dealer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Tests")
class PaymentServiceTest {

    @Mock
    private PaymentTransactionRepository transactionRepository;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private PaymentConfiguration paymentConfig;

    @Mock
    private PaymentProvider manualProvider;

    @Mock
    private PaymentProvider chamBankProvider;

    private PaymentService paymentService;
    private Dealer testDealer;

    @BeforeEach
    void setUp() {
        // Setup mock providers
        lenient().when(manualProvider.getProviderId()).thenReturn("manual_transfer");
        lenient().when(manualProvider.getProviderName()).thenReturn("Manual Transfer");
        lenient().when(manualProvider.isEnabled()).thenReturn(true);

        lenient().when(chamBankProvider.getProviderId()).thenReturn("cham_bank");
        lenient().when(chamBankProvider.getProviderName()).thenReturn("Cham Bank");
        lenient().when(chamBankProvider.isEnabled()).thenReturn(true);

        // Initialize service with mock providers
        paymentService = new PaymentService(
            Arrays.asList(manualProvider, chamBankProvider),
            transactionRepository,
            idempotencyService,
            paymentConfig
        );

        testDealer = Dealer.builder()
            .id(1L)
            .businessName("Test Dealer")
            .build();
    }

    @Test
    @DisplayName("Should create subscription using correct provider")
    void createSubscription_ShouldUseCorrectProvider() {
        // Given
        String tier = "basic";
        String providerId = "manual_transfer";
        PaymentMethodDetails details = PaymentMethodDetails.builder()
            .paymentMethod(PaymentMethod.BANK_TRANSFER)
            .build();
        String idempotencyKey = "key-123";

        PaymentResponse expectedResponse = PaymentResponse.success(
            "TXN-1", BigDecimal.TEN, "USD", "Success"
        );

        when(manualProvider.supportsPaymentMethod(details)).thenReturn(true);
        when(manualProvider.createSubscription(any(), anyString(), any(), anyString()))
            .thenReturn(expectedResponse);

        // When
        PaymentResponse response = paymentService.createSubscription(
            testDealer, tier, providerId, details, idempotencyKey
        );

        // Then
        assertThat(response.isSuccess()).isTrue();
        verify(manualProvider).createSubscription(testDealer, tier, details, idempotencyKey);
        verify(chamBankProvider, never()).createSubscription(any(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("Should fail when provider not found")
    void createSubscription_ShouldFailWhenProviderNotFound() {
        // Given
        String providerId = "non_existent_provider";
        PaymentMethodDetails details = PaymentMethodDetails.builder().build();

        // When
        PaymentResponse response = paymentService.createSubscription(
            testDealer, "basic", providerId, details, "key"
        );

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode()).isEqualTo("SUBSCRIPTION_CREATION_ERROR");
        assertThat(response.getMessage()).contains("Payment provider not found");
    }

    @Test
    @DisplayName("Should fail when provider is disabled")
    void createSubscription_ShouldFailWhenProviderDisabled() {
        // Given
        when(manualProvider.isEnabled()).thenReturn(false);
        String providerId = "manual_transfer";
        PaymentMethodDetails details = PaymentMethodDetails.builder().build();

        // When
        PaymentResponse response = paymentService.createSubscription(
            testDealer, "basic", providerId, details, "key"
        );

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("Payment provider is disabled");
    }

    @Test
    @DisplayName("Should fail when payment method not supported")
    void createSubscription_ShouldFailWhenMethodNotSupported() {
        // Given
        String providerId = "manual_transfer";
        PaymentMethodDetails details = PaymentMethodDetails.builder()
            .paymentMethod(PaymentMethod.CARD)
            .build();

        when(manualProvider.supportsPaymentMethod(details)).thenReturn(false);

        // When
        PaymentResponse response = paymentService.createSubscription(
            testDealer, "basic", providerId, details, "key"
        );

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode()).isEqualTo("UNSUPPORTED_PAYMENT_METHOD");
    }

    @Test
    @DisplayName("Should process one-time payment successfully")
    void processOneTimePayment_ShouldSuccess() {
        // Given
        BigDecimal amount = new BigDecimal("100.00");
        Currency currency = Currency.USD;
        String providerId = "manual_transfer";
        PaymentMethodDetails details = PaymentMethodDetails.builder().build();
        String description = "Test Payment";
        String key = "key-123";

        PaymentResponse expectedResponse = PaymentResponse.success(
            "TXN-1", amount, "USD", "Success"
        );

        when(manualProvider.validatePaymentAmount(amount, currency)).thenReturn(true);
        when(manualProvider.processOneTimePayment(any(), any(), any(), any(), anyString(), anyString()))
            .thenReturn(expectedResponse);

        // When
        PaymentResponse response = paymentService.processOneTimePayment(
            testDealer, amount, currency, providerId, details, description, key
        );

        // Then
        assertThat(response.isSuccess()).isTrue();
        verify(manualProvider).processOneTimePayment(
            testDealer, amount, currency, details, description, key
        );
    }

    @Test
    @DisplayName("Should fail one-time payment on invalid amount")
    void processOneTimePayment_ShouldFailOnInvalidAmount() {
        // Given
        BigDecimal amount = new BigDecimal("-100.00");
        Currency currency = Currency.USD;
        String providerId = "manual_transfer";
        PaymentMethodDetails details = PaymentMethodDetails.builder().build();

        when(manualProvider.validatePaymentAmount(amount, currency)).thenReturn(false);

        // When
        PaymentResponse response = paymentService.processOneTimePayment(
            testDealer, amount, currency, providerId, details, "desc", "key"
        );

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode()).isEqualTo("INVALID_AMOUNT");
    }

    @Test
    @DisplayName("Should return only enabled providers")
    void getAvailableProviders_ShouldReturnEnabledOnly() {
        // Given
        when(manualProvider.isEnabled()).thenReturn(true);
        when(chamBankProvider.isEnabled()).thenReturn(false);

        // When
        Map<String, String> providers = paymentService.getAvailableProviders();

        // Then
        assertThat(providers).containsKey("manual_transfer");
        assertThat(providers).doesNotContainKey("cham_bank");
    }
}

