# 💰 **Caryo Marketplace - Pricing Documentation**

## 📊 **Subscription Tiers**

### **Dealer Subscription Plans**

| Tier | Price/Month | Currency | Listings Limit | Target Audience |
|------|-------------|----------|----------------|-----------------|
| **Basic** | $50 | USD | Up to 100 listings | Small dealerships (1-3 locations) |
| **Advanced** | $100 | USD | Up to 250 listings | Medium dealerships (4-10 locations) |
| **Professional** | $200 | USD | Unlimited listings | Large dealerships (10+ locations) |

### **Configuration Location**

**Backend Configuration** (`application.properties`):
```properties
subscription.basic.price=50
subscription.basic.listing_limit=100
subscription.advanced.price=100
subscription.advanced.listing_limit=250
subscription.professional.price=200
subscription.professional.listing_limit=-1
```

### **Trial Plan**

**Free Trial** (for new dealers):
- **Duration**: 2 months
- **Listing Limit**: 15 total listings
- **Grace Period**: 3 days after expiry
- **Target Conversion**: 30% of trial dealers to paid plans

### **Private Seller Pricing**

| Feature | Price | Description |
|---------|-------|-------------|
| **Free** | $0 | 3 listings/month |
| **Extra Listings** | $2 each | Additional listings beyond 3 |
| **Highlight Ad** | $3 per listing | Featured placement |
| **Bump-Up** | $2 per use | Move listing to top |

---

## 📝 **Business Rationale**

### **Dealer Pricing Strategy**

1. **Basic Tier ($50)**:
   - Entry point for small dealerships
   - Up to 100 listings covers most small operations
   - Competitive pricing to maximize adoption

2. **Advanced Tier ($100)**:
   - Most popular tier (recommended)
   - Up to 250 listings suits growing businesses
   - 2x price for 2.5x listings = better value

3. **Professional Tier ($200)**:
   - Unlimited listings for enterprise
   - Premium features and priority support
   - Highest lifetime value (LTV)

### **Revenue Targets**

- **ARPD** (Average Revenue Per Dealer): Target $87/month
- **Trial Conversion Rate**: Target 30%
- **Churn Rate**: Target <5%
- **LTV** (Lifetime Value): Target $500+ per dealer

---

## 🔧 **Technical Implementation**

### **Backend**

Prices are configured in:
- `backend/caryo-backend/src/main/resources/application.properties`
- Lines 173-179

### **Frontend**

Prices are currently hardcoded in:
- `frontend/src/components/dealer/UpgradeModal.tsx`
- Lines 48-96 (SUBSCRIPTION_TIERS constant)

### **Price Management** ✅ **Industry Standard Implementation**

**Single Source of Truth**: Prices are configured ONLY in backend:
1. Backend: `application.properties` (configuration)
2. Backend: `PricingController.java` (exposes via API)
3. Frontend: `pricing.ts` (fetches from API dynamically)

**To Change Prices**:
1. Update `application.properties` only
2. Restart backend
3. Frontend automatically shows new prices (no redeployment needed!)

**Benefits**:
- ✅ Single source of truth
- ✅ No frontend code changes needed
- ✅ Follows Stripe/PayPal industry pattern
- ✅ Easy to maintain

---

## 🌍 **Currency Support**

Currently: **USD only**

**Future Considerations**:
- **SYP** (Syrian Pound) - For local market
- Regional pricing variations
- Currency conversion for international dealers

---

## 📅 **Last Updated**

- **Date**: 2025-10-31
- **Version**: 1.0
- **Status**: Active pricing model

---

## 📞 **How to Change Prices** ✅ **Industry Standard**

**Super Simple Process**:

1. **Update Backend Config ONLY**:
   ```properties
   # In application.properties
   subscription.basic.price=50
   subscription.advanced.price=100
   subscription.professional.price=200
   ```

2. **Restart Backend**:
   ```bash
   # Restart Spring Boot
   ./gradlew bootRun
   ```

3. **Done!** 🎉
   - Frontend automatically fetches new prices from API
   - No frontend code changes needed
   - No frontend redeployment required
   - Prices update automatically!

**Example**: Change Basic price from $50 to $60
- ✅ Update `subscription.basic.price=60` in `application.properties`
- ✅ Restart backend
- ✅ Frontend shows $60 automatically

That's it! One file, one restart. Simple! ✅

---

## ⚠️ **Important Notes**

- **Prices are in USD** - No local currency support yet
- **Prices are hardcoded** - Frontend must match backend config
- **Trial is always free** - 2 months with 15 listings
- **Manual bank transfer** has 0% processing fees
- **Syrian bank gateways** will have ~0.5% processing fees

---

**Questions? Contact**: Business Team
**Technical Issues**: Development Team
