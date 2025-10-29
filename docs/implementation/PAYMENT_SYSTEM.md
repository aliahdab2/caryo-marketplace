# Payment System - Complete Guide

**Last Updated:** October 29, 2025
**Status:** ✅ APPROVED - Ready to Implement
**Architecture:** Generic Payment Layer (Industry Standard)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary) ← Start here
2. [Implementation Plan](#implementation-plan) ← Week-by-week tasks
3. [Technical Architecture](#technical-architecture) ← For developers
4. [Next Steps](#next-steps)

---

## 🎯 Executive Summary

### The Decision

We're implementing a **Generic Payment Abstraction Layer** - the industry-standard approach used by Stripe, Shopify, and all major e-commerce platforms.

### What This Means

```
One Interface → Works with Any Provider

Your code:
  paymentService.createSubscription(dealer, tier);

Works with:
  ✅ Manual bank transfers (Week 1)
  ✅ Cham Bank gateway (Week 2)
  ✅ Bemo Bank gateway (future)
  ✅ Crypto payments (future)
  ✅ Any new provider (2-3 days to add)
```

### Timeline

| Week | Goal | Deliverable |
|------|------|-------------|
| **Week 1** | Foundation + Manual Transfers | Working payment system (0% fees) |
| **Week 2** | Bank Gateway Integration | Automated payments (~3% fees) |
| **Ongoing** | Additional Providers | 2-3 days per new provider |

### Benefits

✅ **Fast to Market** - Working in Week 1
✅ **Low Cost** - Start with 0% fees
✅ **Future-Proof** - Add providers in hours
✅ **No Vendor Lock-in** - Switch anytime
✅ **Graceful Fallback** - Auto-switch if provider fails

---

## 📅 Implementation Plan

### Week 1: Foundation + Manual Transfers

**Goal:** Working payment system with manual bank transfers

#### Backend (Days 1-4)

**Day 1-2: Core Architecture**
```java
Create:
├─ payment/PaymentProvider.java (interface)
├─ payment/dto/PaymentResponse.java
├─ payment/dto/SubscriptionRequest.java
├─ payment/dto/PaymentStatus.java
├─ payment/service/PaymentService.java
├─ repository/PaymentTransactionRepository.java
└─ V53__Create_payment_transactions_table.sql
```

**Day 3-4: Manual Transfer Provider**
```java
Create:
├─ payment/providers/ManualTransferProvider.java
├─ controller/PaymentController.java
├─ controller/admin/AdminPaymentController.java
└─ V54__Create_manual_payments_table.sql

Endpoints:
├─ POST /api/payment/subscription/create
├─ POST /api/payment/manual/upload-receipt
├─ GET /api/payment/status/{transactionId}
└─ Admin:
   ├─ GET /api/admin/payments/pending
   ├─ POST /api/admin/payments/{id}/approve
   └─ POST /api/admin/payments/{id}/reject
```

#### Frontend (Days 5-6)

**Day 5: Dealer UI**
```typescript
Create:
├─ components/payment/PaymentMethodSelector.tsx
├─ components/payment/ManualTransferForm.tsx
├─ components/payment/ReceiptUpload.tsx
└─ pages/dealer/subscribe.tsx
```

**Day 6: Admin Panel**
```typescript
Create:
├─ components/admin/PendingPaymentsList.tsx
├─ components/admin/PaymentVerificationModal.tsx
└─ pages/admin/payment-verification.tsx
```

#### Acceptance Criteria Week 1

- [x] Dealer can select subscription plan
- [x] Dealer sees bank transfer instructions
- [x] Dealer can upload receipt
- [x] Admin can view and approve/reject payments
- [x] Upon approval, subscription activates
- [x] All tests passing

**Deliverable:** ✅ Working payment system in 6 days

---

### Week 2: Bank Gateway Integration

**Goal:** Automated payments via bank gateway

**Pre-requisites:**
- Meeting with Cham Bank completed
- API documentation received
- Sandbox credentials obtained

#### Backend (Days 1-3)

**Day 1-2: Bank Provider**
```java
Create:
├─ payment/providers/ChamBankProvider.java
├─ payment/client/ChamBankApiClient.java
└─ Update application.properties

Implement:
├─ createSubscription() → Call bank API
├─ handleWebhook() → Process bank callbacks
└─ getCapabilities() → Define what's supported
```

**Day 3: Webhook Integration**
```java
Tasks:
├─ POST /api/webhooks/cham-bank
├─ Verify webhook signatures
├─ Update payment status
└─ Trigger subscription activation
```

#### Testing & Deploy (Days 4-5)

**Day 4: Testing**
- Test subscription in sandbox
- Test webhook callbacks
- Test success/failure flows
- Security testing

**Day 5: Production**
- Configure production credentials
- Deploy and monitor
- Test first real transaction

#### Acceptance Criteria Week 2

- [x] Dealer can pay via bank gateway
- [x] Redirect to bank works correctly
- [x] Webhook received and processed
- [x] Subscription activates automatically
- [x] Fallback to manual if bank fails
- [x] Production monitoring active

**Deliverable:** ✅ Automated bank gateway operational

---

## 🏗️ Technical Architecture

### Layer 1: PaymentProvider Interface

```java
package com.autotrader.autotraderbackend.payment;

public interface PaymentProvider {
    // Identity
    String getProviderId();
    String getProviderName();
    boolean isEnabled();

    // Operations
    PaymentResponse createSubscription(SubscriptionRequest request);
    PaymentResponse cancelSubscription(String subscriptionId);
    WebhookResponse handleWebhook(WebhookPayload payload);
    PaymentStatus getPaymentStatus(String transactionId);

    // Capabilities
    ProviderCapabilities getCapabilities();
}
```

### Layer 2: PaymentService (Orchestrator)

```java
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final List<PaymentProvider> providers;

    @Transactional
    public PaymentResponse createSubscription(
        Dealer dealer,
        SubscriptionTier tier,
        String providerId // Optional - auto-select if null
    ) {
        PaymentProvider provider = providerId != null
            ? getProvider(providerId)
            : selectBestProvider(dealer, tier);

        SubscriptionRequest request = buildRequest(dealer, tier);
        PaymentResponse response = provider.createSubscription(request);

        saveTransaction(response, dealer, provider);

        if (response.getStatus() == PaymentStatus.COMPLETED) {
            activateSubscription(dealer, tier, response);
        }

        return response;
    }

    @Transactional
    public void handleWebhook(String providerId, WebhookPayload payload) {
        PaymentProvider provider = getProvider(providerId);
        WebhookResponse webhook = provider.handleWebhook(payload);

        if (webhook.isValid() && webhook.getStatus() == PaymentStatus.COMPLETED) {
            activateSubscription(webhook);
        }
    }

    private PaymentProvider selectBestProvider(Dealer dealer, SubscriptionTier tier) {
        // Priority: Automated > Manual
        return providers.stream()
            .filter(PaymentProvider::isEnabled)
            .filter(p -> p.getCapabilities().isSupportsRecurring())
            .findFirst()
            .orElse(getProvider("manual_transfer"));
    }
}
```

### Layer 3: Provider Implementations

#### Manual Transfer Provider

```java
@Service
public class ManualTransferProvider implements PaymentProvider {

    @Override
    public String getProviderId() {
        return "manual_transfer";
    }

    @Override
    public PaymentResponse createSubscription(SubscriptionRequest request) {
        ManualPayment payment = createPendingPayment(request);

        return PaymentResponse.builder()
            .success(true)
            .transactionId(payment.getId().toString())
            .status(PaymentStatus.MANUAL_VERIFICATION_REQUIRED)
            .statusMessage("Please transfer funds and upload receipt")
            .build();
    }

    @Override
    public PaymentResponse verifyManualPayment(ManualPaymentVerification verification) {
        storeReceipt(verification);
        notifyAdminForVerification();

        return PaymentResponse.builder()
            .success(true)
            .status(PaymentStatus.PENDING)
            .statusMessage("Receipt uploaded. Awaiting verification.")
            .build();
    }

    @Override
    public ProviderCapabilities getCapabilities() {
        return ProviderCapabilities.builder()
            .supportsRecurring(false)
            .supportsManualVerification(true)
            .supportedCurrencies(List.of("SYP", "USD"))
            .build();
    }
}
```

#### Bank Gateway Provider Template

```java
@Service
@ConditionalOnProperty(prefix = "payment.providers.cham-bank", name = "enabled")
public class ChamBankProvider implements PaymentProvider {

    private final ChamBankApiClient apiClient;

    @Override
    public PaymentResponse createSubscription(SubscriptionRequest request) {
        // Call bank API
        ChamBankResponse response = apiClient.createSubscription(
            convertToRequest(request)
        );

        // Convert to universal response
        return PaymentResponse.builder()
            .success(true)
            .transactionId(response.getId())
            .paymentUrl(response.getCheckoutUrl())
            .status(mapStatus(response.getStatus()))
            .build();
    }

    @Override
    public WebhookResponse handleWebhook(WebhookPayload payload) {
        if (!verifySignature(payload)) {
            return WebhookResponse.invalid();
        }

        return parseAndConvert(payload);
    }
}
```

### Database Schema

```sql
-- payment_transactions
CREATE TABLE payment_transactions (
    id BIGSERIAL PRIMARY KEY,
    dealer_id BIGINT NOT NULL REFERENCES dealers(id),
    provider_id VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    subscription_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    provider_data JSONB,

    INDEX idx_dealer_id (dealer_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (status)
);

-- manual_payments
CREATE TABLE manual_payments (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT REFERENCES payment_transactions(id),
    dealer_id BIGINT NOT NULL REFERENCES dealers(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    receipt_url VARCHAR(500),
    verified_by BIGINT REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Configuration

```properties
# Default provider
payment.default-provider=manual_transfer
payment.fallback-provider=manual_transfer

# Manual Transfer (always enabled)
payment.providers.manual-transfer.enabled=true

# Cham Bank
payment.providers.cham-bank.enabled=${CHAM_BANK_ENABLED:false}
payment.providers.cham-bank.api-key=${CHAM_BANK_API_KEY}
payment.providers.cham-bank.merchant-id=${CHAM_BANK_MERCHANT_ID}
payment.providers.cham-bank.webhook-secret=${CHAM_WEBHOOK_SECRET}

# Subscription Pricing
subscription.basic.price=5000
subscription.advanced.price=10000
subscription.professional.price=20000
subscription.currency=SYP
```

---

## 🧪 Testing Strategy

### Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Test
    void shouldSelectBestProviderWhenNotSpecified() {
        // Test provider selection
    }

    @Test
    void shouldFallbackToManualWhenProviderFails() {
        // Test graceful degradation
    }
}

@ExtendWith(MockitoExtension.class)
class ManualTransferProviderTest {
    @Test
    void shouldCreatePendingPayment() {
        // Test manual payment creation
    }

    @Test
    void shouldStoreReceiptCorrectly() {
        // Test receipt upload
    }
}
```

### Integration Tests

```java
@SpringBootTest
@Transactional
class PaymentIntegrationTest {
    @Test
    void shouldCreateSubscriptionEndToEnd() {
        // Test complete payment flow
    }

    @Test
    void shouldProcessWebhookEndToEnd() {
        // Test webhook → subscription activation
    }
}
```

---

## 🚀 Next Steps

### This Week

1. **Review & Approve**
   - Read this document (30 minutes)
   - Approve architecture
   - Set start date

2. **Bank Meetings**
   - Meet with Cham Bank technical team
   - Meet with Bemo Bank merchant services
   - Get API documentation

3. **Team Preparation**
   - Allocate developer time (6 days)
   - Setup development environment

### Week 1 Start

**Day 1:** Kick-off + Core architecture
**Day 2-4:** Implementation
**Day 5-6:** Testing & deployment
**Day 7:** Buffer for fixes

---

## 📊 Success Metrics

### Phase 1 (Manual Transfer)
- Manual verification time: < 4 hours
- Receipt upload success: > 95%
- Admin verification rate: > 90% within 24h

### Phase 2 (Bank Gateway)
- Payment success rate: > 90%
- Webhook processing: < 2 seconds
- System uptime: > 99.5%

---

## 📞 Key Contacts

### Syrian Banks
- **Cham Bank:** +963 11 2137200 (merchants@chambank.sy)
- **Bemo Bank:** +963 11 373 7000 (merchants@bemobank.com.sy)

---

## 🎯 Why This Approach

### Industry Standard
- Used by Stripe Connect, Shopify Payments, WooCommerce
- Proven architecture pattern
- Easy to maintain and extend

### Business Benefits
- Start with 0% fees (manual)
- Add automated payments when ready
- No vendor lock-in
- Multiple payment options for dealers

### Technical Benefits
- Clean separation of concerns
- Easy to test
- Easy to add providers
- Graceful error handling

---

**Status:** ✅ APPROVED - Ready to implement
**Next Action:** Set Week 1 start date
**Estimated Duration:** 2 weeks to full automation
**Documentation Owner:** Caryo Development Team

