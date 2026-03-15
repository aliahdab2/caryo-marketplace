# 🚗 Caryo Marketplace - Dealer System Reference

**Last Updated**: January 28, 2025
**Document Type**: Implementation Guide & Business Blueprint
**Audience**: Developers, Product Managers, Stakeholders

---

## 🎉 **RECENT UPDATES**

### **Phase 1A - Trial System Backend** ✅ COMPLETED (Jan 28, 2025)

**What We Built**:
- ✅ Database migration V51 (trial & subscription fields)
- ✅ `DealerTrialService` - Core business logic for trial management
- ✅ `DealerController` - REST APIs for trial status & management
- ✅ Custom exceptions (DealerNotFoundException, TrialExpiredException, etc.)
- ✅ Listing creation guards (validates trial/subscription limits)
- ✅ Test dealer in DataInitializer for testing
- ✅ Comprehensive unit & integration tests

**Key Features**:
- 2-month trial with 15 total listings
- Automatic listing counter incrementation
- Grace period (3 days after expiry)
- Timezone-aware calculations (UTC backend, local display)
- Admin trial extension capability
- Subscription tier support (trial/basic/advanced/professional)

**Next Steps**:
- ✅ Payment System Architecture - APPROVED (Generic Payment Layer)
- 🔄 Phase 1B: Payment Implementation (2 weeks)
  - Week 1: Manual transfer system
  - Week 2: Bank gateway integration (Cham/Bemo)
- 🔄 Phase 1C: Dealer dashboard & analytics
- 🔄 Frontend UI for trial system (banners, warnings, upgrade modals)

---

## 📊 **QUICK STATUS OVERVIEW**

| Component | Status | Progress | Priority |
|-----------|--------|----------|----------|
| Dealer Signup | ✅ Complete | 100% | Done |
| Database Schema | ✅ Complete | 100% | Done |
| Trial System | ✅ Complete | 100% | Done ✨ |
| Payment Architecture | ✅ Approved | 100% | Done ✨ |
| Payment Implementation | 🔄 Ready to Start | 0% | **HIGH** |
| Dealer Dashboard | ❌ Not Started | 0% | **HIGH** |
| Analytics | ❌ Not Started | 0% | Medium |

**Overall Progress: 65%** (Phase 1A Complete + Payment Architecture Approved!)

---

## 🎯 **BUSINESS MODEL**

### **Freemium Trial**
- **Duration**: 2 months
- **Listings Allowed**: 15 total (not per month)
- **Goal**: Convert 30% of trial dealers to paid plans
- **Rationale**: Short trial encourages faster conversion while proving value

### **Subscription Tiers**

| Tier | Price/Month | Listings | Target Audience |
|------|-------------|----------|-----------------|
| **Basic** | $50 | Up to 100 | Small dealerships (1-3 locations) |
| **Advanced** | $100 | Up to 250 | Medium dealerships (4-10 locations) |
| **Professional** | $200 | Unlimited | Large dealerships (10+ locations) |

### **Private Seller Pricing**
- **Free**: 3 listings/month
- **Extra Listings**: $2 each
- **Highlight Ad**: $3 per listing
- **Bump-Up**: $2 per use

### **Revenue Streams**
1. Dealer subscription revenue (recurring)
2. Private seller add-ons (transactional)
3. Premium features (upgrades)
4. Future: Commission on successful sales

---

## ✅ **WHAT'S IMPLEMENTED (60%)**

### **1. Database Schema** ✅ COMPLETE

**Dealers Table** (`V20__Create_dealer_table.sql` + `V51__Add_trial_fields_to_dealers.sql`):
```sql
CREATE TABLE dealers (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    business_name VARCHAR(100) NOT NULL,
    vat_number VARCHAR(50) UNIQUE,
    trading_address VARCHAR(255),
    business_email VARCHAR(50) UNIQUE,
    business_phone VARCHAR(20),
    logo_url VARCHAR(255),

    -- ✅ NEW: Trial System Fields (V51)
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_listings_count INTEGER DEFAULT 0 NOT NULL,
    trial_expired BOOLEAN DEFAULT FALSE NOT NULL,
    trial_extended_until TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'Asia/Damascus',

    -- ✅ NEW: Subscription Fields (V51)
    subscription_tier VARCHAR(50) DEFAULT 'trial',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_next_billing_date TIMESTAMP WITH TIME ZONE,
    subscription_cancelled_at TIMESTAMP WITH TIME ZONE,

    -- ✅ NEW: Feature Flags (V51)
    can_create_listings BOOLEAN DEFAULT TRUE NOT NULL,
    payment_warning BOOLEAN DEFAULT FALSE NOT NULL,
    notifications_sent JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT fk_dealer_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Indexes**:
- `idx_dealer_user_id` (unique)
- `idx_dealer_business_name`
- `idx_dealer_vat_number` (unique)
- ✅ `idx_dealers_trial_expired` (NEW)
- ✅ `idx_dealers_subscription_tier` (NEW)
- ✅ `idx_dealers_trial_started_at` (NEW)

**Status**: ✅ Production ready

---

### **2. Backend - Dealer Core** ✅ COMPLETE

**Files Implemented**:
```
✅ model/Dealer.java (updated with trial fields)
✅ repository/DealerRepository.java
✅ service/DealerService.java
✅ payload/request/SignupRequest.java (enhanced)
✅ controller/AuthController.java (enhanced)
```

**Key Features**:
- [x] Dealer entity with validation
- [x] One-to-one relationship: User ↔ Dealer
- [x] DealerService with create/validate methods
- [x] SignupRequest accepts dealer fields
- [x] `/api/auth/signup` handles both private & dealer (via sellerTypeId)
- [x] Email verification for dealers
- [x] Transactional dealer creation (rollback on failure)

**Code Quality**: Production ready

---

### **3. Frontend - Signup Flow** ✅ COMPLETE

**Components Implemented**:
```
✅ Step1UserTypeSelection.tsx
✅ Step2PrivateSellerForm.tsx
✅ Step3DealerBusinessInfo.tsx
✅ Step4DealerContactInfo.tsx
✅ SignupForm.tsx (orchestrator)
```

**Hooks & Utils**:
```
✅ useSignupForm.ts
✅ useSignupValidation.ts
✅ useSignupSubmission.ts
✅ formUtils.ts
```

**Features**:
- [x] 4-step wizard UI
- [x] User type selection (Private vs Dealer)
- [x] Conditional field display
- [x] Real-time validation
- [x] Smart username generation for dealers
- [x] Error handling with user-friendly messages
- [x] Progress indicators
- [x] RTL support (Arabic)

**UX Quality**: Excellent

---

### **4. Backend - Trial System** ✅ COMPLETE (Phase 1A)

**Files Implemented**:
```
✅ service/DealerTrialService.java - Core trial logic
✅ controller/DealerController.java - Trial status & management endpoints
✅ exception/dealer/DealerNotFoundException.java
✅ exception/dealer/TrialExpiredException.java
✅ exception/dealer/SubscriptionLimitExceededException.java
✅ payload/response/CanCreateListingResponse.java
✅ service/CarListingService.java (updated with trial validation)
✅ config/DataInitializer.java (added test dealer)
```

**Database Migration**:
```
✅ V51__Add_trial_fields_to_dealers.sql - Trial & subscription fields
```

**Key Features**:
- [x] Trial tracking (2 months, 15 listings)
- [x] Listing counter incrementation on listing creation
- [x] Trial status calculation (active/expired/grace period)
- [x] Subscription tier support (trial/basic/advanced/professional)
- [x] Grace period (3 days after trial expiry)
- [x] Timezone handling (UTC for calculations, dealer timezone for display)
- [x] Trial extension capability (admin endpoint)
- [x] Listing creation guard (validates trial/subscription limits)
- [x] Custom exceptions for better error handling
- [x] Notification tracking (JSONB array)
- [x] Feature flags per dealer (can_create_listings, payment_warning)

**API Endpoints**:
- [x] `GET /api/dealer/trial-status` - Get current trial status
- [x] `GET /api/dealer/can-create-listing` - Check if dealer can create listing
- [x] `POST /api/dealer/extend-trial/{dealerId}` - Extend trial (admin only)
- [x] `GET /api/dealer/profile` - Get dealer profile

**Configuration**:
```properties
✅ dealer.trial.enabled=true
✅ dealer.trial.duration_months=2
✅ dealer.trial.listing_limit=15
✅ dealer.trial.grace_period_days=3
✅ subscription.basic/advanced/professional.* (configured)
```

**Tests**:
- [x] DealerTrialServiceTest.java (unit tests)
- [x] DealerControllerIntegrationTest.java (integration tests)

**Code Quality**: Production ready, follows best practices

---

## ❌ **WHAT'S NOT IMPLEMENTED (40%)**

### **1. Frontend - Trial System UI** ❌ HIGH PRIORITY

**What's Needed**:
```typescript
// React components needed:
- DealerTrialBanner.tsx - Show trial status in dealer dashboard
- TrialProgressBar.tsx - Visual progress indicator (X/15 listings)
- UpgradeModal.tsx - Prompt to upgrade when limits reached
- TrialWarningAlert.tsx - Warning at 50%, 75%, 90% usage
```

**Features Required**:
- [ ] Real-time trial status display
- [ ] Countdown timer (days/hours remaining)
- [ ] Listing usage counter (X/15 used)
- [ ] Progressive warnings (50%, 75%, 90%, 100%)
- [ ] Upgrade CTA buttons
- [ ] Trial expiry modal
- [ ] Grace period notification

**API Integration**:
- [ ] Call `/api/dealer/trial-status` on dashboard load
- [ ] Call `/api/dealer/can-create-listing` before showing create listing form
- [ ] Handle trial expired errors gracefully
- [ ] Show upgrade options on limit reached
- [ ] Trial expiry cron job

**Frontend Needed**:
- [ ] Trial status banner
- [ ] Trial warnings (75%, 90% usage)
- [ ] Upgrade prompts
- [ ] Trial countdown display

**Impact**: **Dealers can currently post unlimited listings** 🚨

---

### **2. Payment & Subscription** ❌ CRITICAL - NOT STARTED

**What's Missing**:
- [ ] Payment provider integration (PayPal, Stripe)
- [ ] Subscription creation flow
- [ ] Trial-to-paid conversion
- [ ] Billing cycle automation
- [ ] Payment webhook handling
- [ ] Failed payment retry logic
- [ ] Subscription upgrade/downgrade
- [ ] Invoice generation
- [ ] Payment history

**Impact**: **No way to collect revenue yet** 🚨

---

### **3. Dealer Dashboard** ❌ HIGH - NOT STARTED

**What's Missing**:
- [ ] `/dealer/dashboard` page
- [ ] Listings management (view, edit, delete)
- [ ] Trial status widget
- [ ] Subscription status display
- [ ] Basic analytics (views, inquiries)
- [ ] Quick actions (create listing, upgrade)
- [ ] Performance metrics

**Impact**: **Dealers have no management interface**

---

### **4. Analytics & Tracking** ❌ MEDIUM - NOT STARTED

**What's Missing**:
- [ ] Event logging (signup, trial start, conversion)
- [ ] Conversion tracking (trial → paid)
- [ ] Revenue metrics dashboard
- [ ] Dealer engagement metrics
- [ ] A/B testing infrastructure

**Impact**: **No data for business decisions**

---

## ⚠️ **DESIGN CONSIDERATIONS & EDGE CASES**

### **1. Feature Flags System**

**Current State**: Hard-coded feature logic
**Improvement Needed**: Runtime feature toggles

**Recommended Approach**:
```properties
# application.properties (Simple approach for MVP)
features.trial_system.enabled=true
features.dealer_dashboard.enabled=true
features.analytics_advanced.enabled=false
features.payment_paypal.enabled=true
features.payment_stripe.enabled=false
features.email_notifications.enabled=true
features.sms_notifications.enabled=false

# Per-dealer overrides (future)
features.dealer.{dealerId}.beta_features=true
```

**Service Implementation**:
```java
@Service
public class FeatureToggleService {

    @Value("${features.trial_system.enabled:true}")
    private boolean trialSystemEnabled;

    @Value("${features.dealer_dashboard.enabled:true}")
    private boolean dealerDashboardEnabled;

    @Value("${features.analytics_advanced.enabled:false}")
    private boolean advancedAnalyticsEnabled;

    public boolean isFeatureEnabled(String featureName) {
        return switch (featureName) {
            case "trial_system" -> trialSystemEnabled;
            case "dealer_dashboard" -> dealerDashboardEnabled;
            case "analytics_advanced" -> advancedAnalyticsEnabled;
            default -> false;
        };
    }

    public boolean isFeatureEnabledForDealer(String featureName, Long dealerId) {
        // Check global toggle first
        if (!isFeatureEnabled(featureName)) return false;

        // Future: Check dealer-specific overrides
        // return dealerFeatureRepository.isEnabledFor(dealerId, featureName);

        return true;
    }
}
```

**Usage**:
```java
@GetMapping("/dashboard")
public ResponseEntity<?> getDealerDashboard() {
    if (!featureToggleService.isFeatureEnabled("dealer_dashboard")) {
        return ResponseEntity.status(503)
            .body(new MessageResponse("Dashboard temporarily unavailable"));
    }
    // ... dashboard logic
}
```

**Later Upgrade Path**: LaunchDarkly, Unleash, or ConfigCat when you have 1000+ dealers

---

### **2. Trial Edge Cases**

#### **A. Timezone Handling** 🌍

**Issue**: Trial expiry calculations must be consistent across timezones

**Solution**:
```java
@Service
public class DealerTrialService {

    // ALWAYS use UTC for trial calculations
    public boolean isTrialActive(Dealer dealer) {
        ZonedDateTime trialStart = dealer.getTrialStartedAt()
            .atZone(ZoneId.of("UTC"));
        ZonedDateTime trialEnd = trialStart.plusMonths(TRIAL_DURATION_MONTHS);
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("UTC"));

        return now.isBefore(trialEnd);
    }

    // Display in dealer's local timezone for UI
    public ZonedDateTime getTrialExpiryInDealerTimezone(Dealer dealer) {
        ZonedDateTime trialEndUTC = dealer.getTrialStartedAt()
            .atZone(ZoneId.of("UTC"))
            .plusMonths(TRIAL_DURATION_MONTHS);

        // Get dealer's timezone from profile or default to Syria time
        String dealerTimezone = dealer.getTimezone() != null
            ? dealer.getTimezone()
            : "Asia/Damascus";

        return trialEndUTC.withZoneSameInstant(ZoneId.of(dealerTimezone));
    }
}
```

**Database**:
```sql
-- Store timezone in dealers table
ALTER TABLE dealers ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Damascus';

-- ALWAYS store timestamps in UTC
-- PostgreSQL handles this automatically with TIMESTAMP WITH TIME ZONE
```

#### **B. Grace Period** 🎁

**Issue**: Hard trial cutoff may frustrate dealers

**Solution**:
```java
@Service
public class DealerTrialService {

    private static final int GRACE_PERIOD_DAYS = 3; // 3 days after trial expires

    public TrialStatus getTrialStatus(Dealer dealer) {
        ZonedDateTime trialEnd = getTrialEndDate(dealer);
        ZonedDateTime graceEnd = trialEnd.plusDays(GRACE_PERIOD_DAYS);
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("UTC"));

        boolean inGracePeriod = now.isAfter(trialEnd) && now.isBefore(graceEnd);

        return TrialStatus.builder()
            .active(now.isBefore(trialEnd))
            .inGracePeriod(inGracePeriod)
            .daysRemaining(calculateDaysRemaining(dealer))
            .graceEndsAt(inGracePeriod ? graceEnd : null)
            .canCreateListings(now.isBefore(graceEnd)) // Allow during grace
            .build();
    }

    public boolean canCreateListing(Dealer dealer) {
        TrialStatus status = getTrialStatus(dealer);

        // Allow during trial OR grace period
        if (status.isActive() || status.isInGracePeriod()) {
            return dealer.getTrialListingsCount() < TRIAL_LISTING_LIMIT;
        }

        // After grace period, check subscription
        return hasActiveSubscription(dealer);
    }
}
```

**UI Messaging**:
```typescript
// Frontend display
if (trialStatus.inGracePeriod) {
  return (
    <Alert severity="warning">
      Your trial expired, but you're in a 3-day grace period.
      Upgrade now to keep your {trialStatus.listingsUsed} listings active.
      Grace period ends: {formatDate(trialStatus.graceEndsAt)}
    </Alert>
  );
}
```

#### **C. Trial Extensions** 🔄

**Business Rule**: Support extending trials for support cases

```java
@Service
public class DealerTrialService {

    public void extendTrial(Dealer dealer, int additionalDays, String reason) {
        // Log the extension for audit
        TrialExtension extension = new TrialExtension();
        extension.setDealer(dealer);
        extension.setAdditionalDays(additionalDays);
        extension.setReason(reason);
        extension.setExtendedBy(getCurrentAdminUser());
        extension.setExtendedAt(LocalDateTime.now());
        trialExtensionRepository.save(extension);

        // Update dealer's trial end date
        dealer.setTrialExtendedUntil(
            dealer.getTrialStartedAt()
                .plusMonths(TRIAL_DURATION_MONTHS)
                .plusDays(additionalDays)
        );
        dealerRepository.save(dealer);

        // Notify dealer
        emailService.sendTrialExtensionEmail(dealer, additionalDays);
    }
}
```

---

### **3. Frontend UX Enhancements**

#### **A. Progressive Warning System** 📊

**50% Usage** (8/15 listings):
```typescript
<InfoBanner>
  You've used 8 of 15 trial listings.
  {daysRemaining} days remaining.
</InfoBanner>
```

**75% Usage** (12/15 listings):
```typescript
<WarningBanner>
  Trial Alert: Only 3 listings remaining!
  <Button>Upgrade Now</Button> to get unlimited listings.
</WarningBanner>
```

**90% Usage** (14/15 listings):
```typescript
<DangerModal open={true} persistent={true}>
  <h2>Last Listing Available!</h2>
  <p>You've used 14 of 15 trial listings.</p>
  <p>Upgrade now to continue posting.</p>
  <Button variant="primary">Upgrade to Basic - $50/month</Button>
  <Button variant="secondary">View All Plans</Button>
</DangerModal>
```

**100% Usage** (15/15 listings):
```typescript
<BlockingModal>
  <h2>Trial Limit Reached</h2>
  <p>You've used all 15 trial listings.</p>
  <p>Upgrade to continue growing your inventory.</p>
  <PricingCards />
  <Button>Start with Basic Plan - $50/month</Button>
</BlockingModal>
```

#### **B. Email Notification Schedule** 📧

**Automated Email Triggers**:
```java
@Service
public class TrialNotificationService {

    @Scheduled(cron = "0 0 9 * * *") // Daily at 9 AM
    public void checkTrialMilestones() {
        List<Dealer> dealers = dealerRepository.findActiveTrialDealers();

        for (Dealer dealer : dealers) {
            TrialStatus status = trialService.getTrialStatus(dealer);

            // 50% time milestone (1 month remaining)
            if (status.getDaysRemaining() == 30 && !dealer.isNotified("50_time")) {
                emailService.sendTrialMilestoneEmail(dealer, "50_time");
                dealer.markNotified("50_time");
            }

            // 75% usage milestone
            if (status.getUsagePercent() >= 75 && !dealer.isNotified("75_usage")) {
                emailService.sendTrialMilestoneEmail(dealer, "75_usage");
                dealer.markNotified("75_usage");
            }

            // 1 week remaining
            if (status.getDaysRemaining() == 7 && !dealer.isNotified("7_days")) {
                emailService.sendTrialExpiryWarning(dealer, 7);
                dealer.markNotified("7_days");
            }

            // 3 days remaining
            if (status.getDaysRemaining() == 3 && !dealer.isNotified("3_days")) {
                emailService.sendTrialExpiryWarning(dealer, 3);
                dealer.markNotified("3_days");
            }

            // Trial expired yesterday (grace period started)
            if (status.isInGracePeriod() && !dealer.isNotified("grace_start")) {
                emailService.sendGracePeriodEmail(dealer);
                dealer.markNotified("grace_start");
            }
        }

        dealerRepository.saveAll(dealers);
    }
}
```

**Email Templates**:
- `trial_50_percent.html` - Halfway through trial
- `trial_75_usage.html` - Most listings used
- `trial_7_days.html` - Week remaining
- `trial_3_days.html` - 3 days left
- `trial_expired_grace.html` - Grace period started
- `trial_conversion_offer.html` - Special upgrade offer

#### **C. In-App Notifications** 🔔

```typescript
// Notification component
const TrialNotifications = () => {
  const { trialStatus } = useDealerTrial();

  return (
    <NotificationCenter>
      {trialStatus.usagePercent >= 75 && (
        <Notification type="warning" dismissable={false}>
          Trial usage: {trialStatus.listingsUsed}/15 listings used
          <Link to="/upgrade">Upgrade Now</Link>
        </Notification>
      )}

      {trialStatus.daysRemaining <= 7 && (
        <Notification type="urgent">
          Trial ends in {trialStatus.daysRemaining} days
          <Button onClick={openUpgradeModal}>Choose Plan</Button>
        </Notification>
      )}
    </NotificationCenter>
  );
};
```

---

### **4. Payment Edge Cases**

#### **A. Prorated Upgrades/Downgrades** 💰

**Scenario**: Dealer upgrades from Basic ($50) to Advanced ($100) mid-month

**Implementation**:
```java
@Service
public class SubscriptionService {

    public ProrationResult calculateProration(
        Dealer dealer,
        String currentTier,
        String newTier
    ) {
        LocalDateTime subscriptionStart = dealer.getSubscriptionStartedAt();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextBillingDate = subscriptionStart.plusMonths(1);

        // Calculate days remaining in current cycle
        long daysInCycle = ChronoUnit.DAYS.between(subscriptionStart, nextBillingDate);
        long daysRemaining = ChronoUnit.DAYS.between(now, nextBillingDate);

        // Calculate unused amount from current tier
        BigDecimal currentTierPrice = getTierPrice(currentTier);
        BigDecimal unusedAmount = currentTierPrice
            .multiply(BigDecimal.valueOf(daysRemaining))
            .divide(BigDecimal.valueOf(daysInCycle), 2, RoundingMode.HALF_UP);

        // Calculate prorated amount for new tier
        BigDecimal newTierPrice = getTierPrice(newTier);
        BigDecimal proratedAmount = newTierPrice
            .multiply(BigDecimal.valueOf(daysRemaining))
            .divide(BigDecimal.valueOf(daysInCycle), 2, RoundingMode.HALF_UP);

        // Amount due today
        BigDecimal amountDue = proratedAmount.subtract(unusedAmount);

        return ProrationResult.builder()
            .currentTier(currentTier)
            .newTier(newTier)
            .daysRemaining(daysRemaining)
            .unusedCredit(unusedAmount)
            .proratedCharge(proratedAmount)
            .amountDue(amountDue)
            .nextBillingDate(nextBillingDate)
            .nextBillingAmount(newTierPrice)
            .build();
    }

    public void upgradeSubscription(Dealer dealer, String newTier) {
        String currentTier = dealer.getSubscriptionTier();
        ProrationResult proration = calculateProration(dealer, currentTier, newTier);

        // Charge prorated amount
        if (proration.getAmountDue().compareTo(BigDecimal.ZERO) > 0) {
            PaymentResult payment = paymentProvider.chargeProrated(
                dealer,
                proration.getAmountDue(),
                "Prorated upgrade from " + currentTier + " to " + newTier
            );

            if (!payment.isSuccessful()) {
                throw new PaymentException("Prorated charge failed");
            }
        }

        // Update subscription
        dealer.setSubscriptionTier(newTier);
        dealerRepository.save(dealer);

        // Send confirmation
        emailService.sendUpgradeConfirmation(dealer, proration);
    }
}
```

**UI Display**:
```typescript
// Upgrade confirmation modal
<ProrationPreview>
  <h3>Upgrade to {newTier}</h3>
  <Line>Current plan: {currentTier} (${currentPrice}/month)</Line>
  <Line>Days remaining: {daysRemaining} days</Line>
  <Line>Unused credit: -${unusedCredit.toFixed(2)}</Line>
  <Line>Prorated charge: ${proratedCharge.toFixed(2)}</Line>
  <Divider />
  <Line bold>Due today: ${amountDue.toFixed(2)}</Line>
  <Line>Next billing ({nextBillingDate}): ${nextBillingAmount}/month</Line>

  <Button onClick={confirmUpgrade}>Confirm Upgrade</Button>
</ProrationPreview>
```

#### **B. Payment Retry Logic** 🔄

**Scenario**: Payment fails (expired card, insufficient funds)

**Implementation**:
```java
@Service
public class PaymentRetryService {

    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final int[] RETRY_DELAYS_HOURS = {24, 72, 168}; // 1 day, 3 days, 7 days

    @Transactional
    public void handlePaymentFailure(Subscription subscription, PaymentResult result) {
        // Log the failure
        PaymentFailure failure = new PaymentFailure();
        failure.setSubscription(subscription);
        failure.setFailureReason(result.getErrorMessage());
        failure.setFailureCode(result.getErrorCode());
        failure.setAttemptNumber(subscription.getFailedAttempts() + 1);
        failure.setFailedAt(LocalDateTime.now());
        paymentFailureRepository.save(failure);

        // Update subscription status
        subscription.incrementFailedAttempts();
        subscription.setStatus("payment_failed");
        subscriptionRepository.save(subscription);

        // Notify dealer immediately
        emailService.sendPaymentFailureEmail(
            subscription.getDealer(),
            result.getErrorMessage(),
            subscription.getFailedAttempts()
        );

        // Schedule retry if under max attempts
        if (subscription.getFailedAttempts() < MAX_RETRY_ATTEMPTS) {
            int delayHours = RETRY_DELAYS_HOURS[subscription.getFailedAttempts() - 1];
            LocalDateTime retryAt = LocalDateTime.now().plusHours(delayHours);

            schedulePaymentRetry(subscription, retryAt);

            // Send retry notification
            emailService.sendPaymentRetryScheduled(
                subscription.getDealer(),
                retryAt,
                subscription.getFailedAttempts()
            );
        } else {
            // Max attempts reached - suspend subscription
            suspendSubscription(subscription);
        }
    }

    @Scheduled(fixedRate = 3600000) // Check every hour
    public void processScheduledRetries() {
        List<PaymentRetry> dueRetries = paymentRetryRepository
            .findByRetryAtBeforeAndStatus(LocalDateTime.now(), "pending");

        for (PaymentRetry retry : dueRetries) {
            try {
                PaymentResult result = paymentProvider.retryPayment(
                    retry.getSubscription()
                );

                if (result.isSuccessful()) {
                    handlePaymentSuccess(retry.getSubscription());
                    retry.setStatus("success");
                } else {
                    handlePaymentFailure(retry.getSubscription(), result);
                    retry.setStatus("failed");
                }

                paymentRetryRepository.save(retry);

            } catch (Exception e) {
                log.error("Retry failed for subscription: " +
                    retry.getSubscription().getId(), e);
            }
        }
    }

    private void suspendSubscription(Subscription subscription) {
        subscription.setStatus("suspended");
        subscription.setSuspendedAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);

        Dealer dealer = subscription.getDealer();
        dealer.setSubscriptionTier("suspended");
        dealerRepository.save(dealer);

        // Send suspension notice
        emailService.sendSubscriptionSuspendedEmail(
            dealer,
            subscription.getFailedAttempts()
        );
    }
}
```

**Email Schedule**:
1. **Immediate**: "Payment failed - Please update your payment method"
2. **24 hours**: "We'll retry your payment in 24 hours"
3. **3 days**: "Second payment attempt scheduled"
4. **7 days**: "Final payment attempt - Update card to avoid suspension"
5. **After 3 failures**: "Subscription suspended - Update payment to reactivate"

#### **C. Dunning Management** 📬

**Progressive Communication**:
```java
@Service
public class DunningService {

    public void manageDunning(Subscription subscription) {
        int failureCount = subscription.getFailedAttempts();
        Dealer dealer = subscription.getDealer();

        switch (failureCount) {
            case 1 -> {
                // Friendly reminder
                emailService.sendEmail(dealer, "payment_reminder_friendly");
                // No feature restrictions yet
            }
            case 2 -> {
                // Urgent warning
                emailService.sendEmail(dealer, "payment_reminder_urgent");
                // Show warning banner in dashboard
                dealer.setPaymentWarning(true);
            }
            case 3 -> {
                // Final notice before suspension
                emailService.sendEmail(dealer, "payment_final_notice");
                smsService.sendSMS(dealer, "Payment overdue - subscription at risk");
                // Restrict new listings
                dealer.setCanCreateListings(false);
            }
            case 4 -> {
                // Suspension
                suspendSubscription(subscription);
                emailService.sendEmail(dealer, "subscription_suspended");
                // Hide all listings
                listingService.hideAllListings(dealer);
            }
        }

        dealerRepository.save(dealer);
    }
}
```

---

### **5. Additional Considerations**

#### **A. Rate Limiting** 🚦
```java
// Prevent abuse during trial
@RateLimiter(name = "trial-listings", fallbackMethod = "rateLimitFallback")
public CarListing createListing(Dealer dealer, ListingRequest request) {
    // Rate limit: 5 listings per hour during trial
    // No limit for paid subscribers
}
```

#### **B. Referral Credits** 🎁
```java
// Give extra listings for referrals
public void applyReferralBonus(Dealer referrer, Dealer newDealer) {
    // Give referrer 5 extra trial listings
    referrer.setTrialListingsCount(referrer.getTrialListingsCount() - 5);
    dealerRepository.save(referrer);

    emailService.sendReferralBonusEmail(referrer, 5);
}
```

#### **C. Seasonal Promotions** 🎉
```java
// Extend trial during promotions
@Value("${promotion.trial_extension_days:0}")
private int promotionExtensionDays;

public int getEffectiveTrialDuration() {
    return TRIAL_DURATION_MONTHS * 30 + promotionExtensionDays;
}
```

---

## 🚀 **IMPLEMENTATION ROADMAP**

### **Phase 1A: Complete Trial System** ✅ COMPLETE
**Priority**: CRITICAL - Blocks revenue

```
Backend:
- [x] Add trial fields to dealers table (V51 migration)
- [x] Create DealerTrialService
- [x] Implement listing limit validation
- [x] Build trial status API
- [x] Add trial expiry check
- [x] Custom exceptions (DealerNotFoundException, TrialExpiredException, etc.)
- [x] Listing counter incrementation
- [x] Grace period support
- [x] Admin trial extension endpoint
- [x] Test dealer in DataInitializer

Frontend:
- [ ] Trial status banner component
- [ ] Trial warnings at 75%, 90%
- [ ] Upgrade modal
- [ ] Trial countdown display

Testing:
- [x] Unit tests for trial logic (DealerTrialServiceTest)
- [x] Integration tests for limits (DealerControllerIntegrationTest)
- [ ] E2E test trial expiry flow
```

**Deliverable**: ✅ Backend complete! Dealers have working 2-month/15-listing trial (frontend UI pending)

---

### **Phase 1B: Payment Implementation** (Week 3-4) 🔥
**Priority**: CRITICAL - Enables revenue
**Architecture**: ✅ Generic Payment Layer (Approved)

**Week 1: Foundation + Manual Transfers**
```
Backend:
- [ ] Create PaymentProvider interface (generic layer)
- [ ] Create PaymentService orchestrator
- [ ] Implement ManualTransferProvider
- [ ] Build subscription creation endpoint
- [ ] Add receipt upload API
- [ ] Create admin verification panel

Frontend:
- [ ] Payment method selector
- [ ] Subscription plan selection
- [ ] Receipt upload component
- [ ] Payment status tracking
- [ ] Admin verification UI

Testing:
- [ ] Manual transfer flow testing
- [ ] Receipt upload/verification testing
- [ ] Integration tests
```

**Week 2: Bank Gateway Integration**
```
Backend:
- [ ] Implement ChamBankProvider (or BemoProvider)
- [ ] Add bank API client
- [ ] Implement webhook handlers
- [ ] Production configuration

Frontend:
- [ ] Add bank gateway to selector
- [ ] Handle redirect flows
- [ ] Payment callback pages

Testing:
- [ ] Bank sandbox testing
- [ ] Webhook testing
- [ ] Production smoke tests
```

**Deliverable**:
- Week 1: Manual payment system operational
- Week 2: Automated bank gateway operational

**Documentation**:
- See [Payment System Guide](./PAYMENT_SYSTEM.md) - Complete implementation guide

---

### **Phase 1C: Dealer Dashboard** (Week 5-6)
**Priority**: HIGH - Improves retention

```
Backend:
- [ ] Create DealerController
- [ ] Build dashboard data API
- [ ] Add listing management endpoints
- [ ] Create analytics queries

Frontend:
- [ ] Dashboard layout
- [ ] Listings table component
- [ ] Trial/subscription widget
- [ ] Analytics cards
- [ ] Quick actions toolbar

Testing:
- [ ] Dashboard load testing
- [ ] Data accuracy validation
- [ ] UI responsiveness
```

**Deliverable**: Dealers have full management interface

---

### **Phase 2: Analytics & Optimization** (Week 7-8)
**Priority**: MEDIUM - Improves decision-making

```
- [ ] Set up event logging
- [ ] Create analytics queries
- [ ] Build admin dashboard
- [ ] Track conversion metrics
- [ ] Implement A/B testing framework
```

---

## 📋 **IMPLEMENTATION DETAILS**

### **Trial System Design**

**Database Schema**:
```sql
-- Add to dealers table
trial_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
trial_listings_count INT DEFAULT 0,
trial_expired BOOLEAN DEFAULT FALSE,
subscription_tier VARCHAR(50) DEFAULT 'trial',
subscription_started_at TIMESTAMP
```

**Service Logic**:
```java
@Service
public class DealerTrialService {

    private static final int TRIAL_DURATION_MONTHS = 2;
    private static final int TRIAL_LISTING_LIMIT = 15;

    public boolean isTrialActive(Dealer dealer) {
        if (dealer.getTrialExpired()) return false;
        if (dealer.getSubscriptionTier() != null &&
            !"trial".equals(dealer.getSubscriptionTier())) {
            return false;
        }

        LocalDateTime trialStart = dealer.getTrialStartedAt();
        LocalDateTime trialEnd = trialStart.plusMonths(TRIAL_DURATION_MONTHS);

        return LocalDateTime.now().isBefore(trialEnd);
    }

    public boolean canCreateListing(Dealer dealer) {
        if (!isTrialActive(dealer)) {
            // Check subscription tier limits
            return checkSubscriptionLimit(dealer);
        }

        return dealer.getTrialListingsCount() < TRIAL_LISTING_LIMIT;
    }

    public void incrementListingCount(Dealer dealer) {
        dealer.setTrialListingsCount(dealer.getTrialListingsCount() + 1);
        dealerRepository.save(dealer);
    }

    public TrialStatus getTrialStatus(Dealer dealer) {
        LocalDateTime trialStart = dealer.getTrialStartedAt();
        LocalDateTime trialEnd = trialStart.plusMonths(TRIAL_DURATION_MONTHS);
        long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), trialEnd);

        return TrialStatus.builder()
            .active(isTrialActive(dealer))
            .daysRemaining((int) daysRemaining)
            .listingsUsed(dealer.getTrialListingsCount())
            .listingsRemaining(TRIAL_LISTING_LIMIT - dealer.getTrialListingsCount())
            .expiresAt(trialEnd)
            .build();
    }
}
```

**API Endpoints**:
```java
@RestController
@RequestMapping("/api/dealer")
public class DealerController {

    @GetMapping("/trial-status")
    public ResponseEntity<TrialStatus> getTrialStatus() {
        User user = getCurrentUser();
        Dealer dealer = dealerService.getDealerByUser(user)
            .orElseThrow(() -> new NotFoundException("Dealer not found"));

        TrialStatus status = dealerTrialService.getTrialStatus(dealer);
        return ResponseEntity.ok(status);
    }
}
```

**Validation on Listing Creation**:
```java
@PostMapping("/listings")
public ResponseEntity<?> createListing(@Valid @RequestBody ListingRequest request) {
    User user = getCurrentUser();

    if (user.isDealer()) {
        Dealer dealer = dealerService.getDealerByUser(user).orElseThrow();

        if (!dealerTrialService.canCreateListing(dealer)) {
            return ResponseEntity.status(403)
                .body(new MessageResponse("Trial limit reached. Please upgrade your subscription."));
        }

        // Create listing
        CarListing listing = createListing(request, user);

        // Increment counter if on trial
        if (dealerTrialService.isTrialActive(dealer)) {
            dealerTrialService.incrementListingCount(dealer);
        }

        return ResponseEntity.ok(listing);
    }

    // Handle private seller
    return createPrivateSellerListing(request, user);
}
```

---

### **Payment Integration Design**

**Subscription Service**:
```java
@Service
public class SubscriptionService {

    public Subscription createSubscription(Dealer dealer, String tier, PaymentMethod payment) {
        // 1. Validate tier
        SubscriptionTier subscriptionTier = validateTier(tier);

        // 2. Create payment with provider
        String paymentId = paymentProvider.createSubscription(
            dealer.getBusinessEmail(),
            subscriptionTier.getPrice(),
            "monthly"
        );

        // 3. Update dealer record
        dealer.setSubscriptionTier(tier);
        dealer.setSubscriptionStartedAt(LocalDateTime.now());
        dealer.setTrialExpired(true);
        dealerRepository.save(dealer);

        // 4. Create subscription record
        return subscriptionRepository.save(new Subscription(dealer, tier, paymentId));
    }

    public void handlePaymentSuccess(String paymentId) {
        Subscription subscription = subscriptionRepository.findByPaymentId(paymentId);
        subscription.setStatus("active");
        subscription.setLastPaymentAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
    }

    public void handlePaymentFailure(String paymentId) {
        Subscription subscription = subscriptionRepository.findByPaymentId(paymentId);
        subscription.setStatus("payment_failed");

        // Send notification to dealer
        emailService.sendPaymentFailureEmail(subscription.getDealer());

        subscriptionRepository.save(subscription);
    }
}
```

---

## 📊 **TESTING STRATEGY**

### **Unit Tests**
```java
✅ DealerServiceTest - Dealer creation/validation
✅ SignupRequestTest - Request validation
[ ] DealerTrialServiceTest - Trial logic
[ ] SubscriptionServiceTest - Payment logic
```

### **Integration Tests**
```java
✅ DealerSignupIntegrationTest - Full signup flow
[ ] TrialLimitIntegrationTest - Listing limits
[ ] PaymentIntegrationTest - Subscription creation
[ ] DashboardIntegrationTest - Dashboard APIs
```

### **E2E Tests**
```
✅ Dealer can complete signup
[ ] Dealer hits trial limit (15 listings)
[ ] Trial expires after 2 months
[ ] Dealer can upgrade to paid plan
[ ] Dealer dashboard displays correctly
```

---

## 🎯 **SUCCESS METRICS**

### **Phase 1 Launch Metrics**
- **Trial Activation Rate**: % of dealers who complete signup
- **Trial Completion Rate**: % of dealers who use 10+ listings
- **Time to First Listing**: Average time from signup to first listing
- **Trial Conversion Rate**: % of trial dealers who upgrade (Target: 30%)

### **Revenue Metrics**
- **ARPD**: Average Revenue Per Dealer (Target: $87/month)
- **MRR**: Monthly Recurring Revenue
- **Churn Rate**: % of dealers canceling subscriptions (Target: <5%)
- **LTV**: Lifetime Value per dealer (Target: $500+)

### **Engagement Metrics**
- **DAU/MAU**: Daily/Monthly Active Users
- **Listings Per Dealer**: Average listings (Target: 45/month for paid)
- **Login Frequency**: How often dealers use the platform
- **Feature Adoption**: % of dealers using dashboard features

---

## 📚 **API REFERENCE**

### **Dealer Trial Endpoints**

#### `GET /api/dealer/trial-status`
Get current trial status for logged-in dealer.

**Response**:
```json
{
  "active": true,
  "daysRemaining": 45,
  "listingsUsed": 8,
  "listingsRemaining": 7,
  "expiresAt": "2025-03-15T00:00:00Z"
}
```

#### `POST /api/dealer/upgrade`
Upgrade from trial to paid subscription.

**Request**:
```json
{
  "tier": "basic",
  "paymentMethod": "paypal",
  "paymentToken": "tok_xxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "subscriptionId": "sub_xxxxx",
  "tier": "basic",
  "price": 50,
  "nextBillingDate": "2025-02-15"
}
```

---

## 🔧 **CONFIGURATION**

### **Application Properties**

```properties
# Trial Configuration
dealer.trial.enabled=true
dealer.trial.duration_months=2
dealer.trial.listing_limit=15

# Subscription Tiers
subscription.basic.price=50
subscription.basic.listing_limit=100
subscription.advanced.price=100
subscription.advanced.listing_limit=250
subscription.professional.price=200
subscription.professional.listing_limit=-1

# Payment Providers
payment.paypal.enabled=true
payment.paypal.client_id=${PAYPAL_CLIENT_ID}
payment.paypal.secret=${PAYPAL_SECRET}
payment.paypal.mode=sandbox

payment.stripe.enabled=true
payment.stripe.api_key=${STRIPE_API_KEY}
payment.stripe.webhook_secret=${STRIPE_WEBHOOK_SECRET}
```

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Phase 1A (Trial System)** ✅ BACKEND COMPLETE
- [x] Database migration executed (V51)
- [x] DealerTrialService deployed
- [x] Trial status API tested
- [x] Listing limits enforced (in CarListingService)
- [x] Custom exceptions added
- [x] Unit tests passing
- [x] Integration tests passing
- [ ] Frontend trial UI deployed
- [ ] Trial warnings working
- [ ] Smoke tests passed
- [ ] E2E tests passed

### **Phase 1B (Payments)**
- [ ] Payment providers configured
- [ ] Subscription service deployed
- [ ] Webhook endpoints registered
- [ ] Payment sandbox tested
- [ ] Frontend payment UI deployed
- [ ] Receipt emails working
- [ ] Production payment tested (small amount)

### **Phase 1C (Dashboard)**
- [ ] Dashboard backend deployed
- [ ] Dashboard frontend deployed
- [ ] Analytics queries optimized
- [ ] Performance tested (100+ dealers)
- [ ] Mobile responsive
- [ ] User acceptance testing passed

---

## 🏁 **CARYO.CO.UK PARITY ROADMAP** (Phases 3-5)

This roadmap aligns Caryo with the mature dealer experience of PLACEHOLDER_CARYO_UK. It builds on Phase 1 (trial, payments, dashboard) to reach near-parity across dealer operations, marketing/monetization, and buyer experience.

### 📌 Parity Checklist (Status Today)

| Area | Key Capabilities | Status |
|------|-------------------|--------|
| Dealer Operations | Bulk imports (CSV/XML), lead inbox/CRM, multi-branch, staff roles | ☐ Planned |
| Marketing/Monetization | Promoted listings, featured slots, banner ads, credits | ☐ Planned |
| Analytics | Listing performance, lead funnel, cohort retention, inventory health | ☐ Planned |
| Buyer Experience | Advanced filters, saved searches + alerts, compare, reviews | ☐ Planned |
| Finance/Valuation | Finance calculator, part-exchange valuation, price guidance | ☐ Planned |
| Integrations | DMS/ERP feeds, vehicle history APIs, payments webhooks | ☐ Planned |

---

### 🚚 Phase 3: Dealer Operations Parity (Weeks 9-14)

- Bulk Inventory Imports/Exports
  - ☐ CSV template (UTF-8) import/export (up to 10k rows)
  - ☐ XML feed ingestion (daily scheduled pull)
  - ☐ Field mapping UI (brand, model, year, price, mileage, images[])
  - ☐ Validation report (row-level errors, downloadable CSV of failures)

- Lead Inbox & Lightweight CRM
  - ☐ Unified lead inbox (messages, WhatsApp, calls logged manually)
  - ☐ Lead statuses: New → Contacted → Qualified → Won/Lost
  - ☐ Assign leads to staff, internal notes, reminders

- Staff Accounts & Roles
  - ☐ Roles: Owner, Manager, Sales, Marketing
  - ☐ Permissions matrix (create/edit listings, pricing, reporting)

- Multi-Branch Dealerships
  - ☐ Branch entity (location, opening hours, phone)
  - ☐ Per-branch inventory and staff assignment
  - ☐ Branch-level analytics

- Inventory Health & Pricing Guidance
  - ☐ Aging report (30/60/90+ days)
  - ☐ Price change suggestions (based on market comparables)
  - ☐ Missing data report (images, description, key fields)

---

### 📣 Phase 4: Marketing & Monetization Parity (Weeks 15-20)

- Promoted Exposure
  - ☐ Featured listings (homepage/search top slots)
  - ☐ Bump to top (time-boxed)
  - ☐ Highlight (visual accent)
  - ☐ Credit wallet (prepay credits, consume per action)

- Audience & Retargeting
  - ☐ Saved searches + email alerts (daily/weekly)
  - ☐ Lead nurturing emails (price drop, similar cars)
  - ☐ UTM tracking for dealer campaigns

- Advertising Products
  - ☐ Dealer banner placements (category/home)
  - ☐ Budget capping and performance reports

- Reporting
  - ☐ Performance dashboard (impressions, CTR, leads, CPL)
  - ☐ Export to CSV/PDF for monthly reporting

---

### 🚗 Phase 5: Buyer Experience Parity (Weeks 21-28)

- Advanced Search & UX
  - ☐ Faceted filters: price, year, mileage, body type, fuel, transmission, location radius
  - ☐ Compare up to 4 vehicles
  - ☐ Recently viewed, recommended for you

- Trust & Decision Tools
  - ☐ Dealer reviews/ratings (verified buyers)
  - ☐ Vehicle history integrations (regional providers)
  - ☐ Finance calculator (bank partners), part-exchange valuation

- Media Quality
  - ☐ Image guidelines enforcement (min resolution, angles)
  - ☐ Video uploads and 360° support (progressive rollout)

---

### 🧩 Dealer Feed & Bulk Import Spec (CSV/XML)

Minimum CSV columns (header row required):

```
title,brand,model,trim,year,mileage,price,currency,location,bodyType,fuel,transmission,color,doors,images
"Corolla 1.6 XLi",Toyota,Corolla,XLi,2016,88000,14500000,SYP,Damascus,Sedan,Petrol,Automatic,White,4,"https://.../1.jpg|https://.../2.jpg"
```

XML: Provide <listings><listing>…</listing></listings> with equivalent fields. Validate up to 20 images per record.

Import API (secured with dealer token):

```http
POST /api/dealer/imports
Content-Type: multipart/form-data (file=inventory.csv|xml)
```

Response: jobId, totals (processed/success/failed), errorReportUrl

---

### 🔐 Roles & Permissions (Staff Accounts)

- Owner: full access (billing, roles, branches)
- Manager: listings, leads, reporting, branch management
- Sales: listings create/edit (own), lead handling
- Marketing: promotions, banner bookings, budgets

---

### 📈 Analytics Parity (Dealer Dashboard)

- Listing funnel: impressions → views → contacts → test drives → sales
- Cost per lead (by channel, by promotion)
- Inventory KPIs: average days on platform, price changes, image completeness
- Branch and staff performance breakdowns

---

### 🤝 Integrations (Roadmap)

- DMS/ERP: CSV/XML nightly feeds; later OAuth-based APIs
- Vehicle history partner(s); regional data sources
- Finance providers (bank referral APIs)
- Payments: PayPal/Stripe webhooks, local providers (future)

---

### 📐 SLAs & Scale (Targeting Caryo-grade Reliability)

- Availability: 99.9% (12-month target)
- Caching: CDN for images, Redis for hot queries
- Background jobs: imports, reports, emails via queue
- Observability: tracing + alerting on SLO breaches

---

## 📞 **SUPPORT & MAINTENANCE**

### **Common Issues**

| Issue | Cause | Solution |
|-------|-------|----------|
| Dealer can't create listing | Trial expired or limit reached | Check trial status, prompt to upgrade |
| Payment fails | Invalid card or insufficient funds | Show error, allow retry |
| Dashboard slow | Too many listings | Add pagination, optimize queries |
| Trial not expiring | Cron job not running | Check scheduler configuration |

### **Monitoring**

**Key Metrics to Monitor**:
- Trial conversion rate (daily)
- Failed payments (hourly)
- API response times (real-time)
- Database query performance (daily)
- Error rates (real-time)

**Alerts**:
- Trial conversion drops below 20%
- Failed payment rate exceeds 10%
- API response time > 1s
- Error rate > 5%

---

## 📖 **GLOSSARY**

- **ARPD**: Average Revenue Per Dealer
- **MRR**: Monthly Recurring Revenue
- **LTV**: Lifetime Value (total revenue from a dealer)
- **Churn**: Rate at which dealers cancel subscriptions
- **Trial Conversion**: % of trial dealers who become paying customers
- **Freemium**: Business model with free trial + paid tiers

---

**Document Maintained By**: Development Team
**For Questions**: See implementation team
**Last Review**: January 2025
