# 🌍 Expansion Guide

## Current Status: Syria Only 🇸🇾

**Focus Now**: Build features for Syrian market
**Expand Later**: When you have 1000+ users

---

## When to Expand

Wait until:
- ✅ 1000+ active Syrian users
- ✅ Product-market fit validated
- ✅ Core features stable
- ✅ Team ready for multi-market support

---

## How to Add a New Market (15 minutes)

### Step 1: Add Market Config (5 min)

Edit `frontend/src/config/businessRegistration.ts`:

```typescript
// 1. Add country to type
export type CountryCode = 'SY' | 'JO'; // Added Jordan

// 2. Add config
export const BUSINESS_REGISTRATION_CONFIGS = {
  SY: { /* ... existing Syria config ... */ },

  // Add Jordan
  JO: {
    country: 'JO',
    labelEn: 'Commercial Registration Number',
    labelAr: 'رقم السجل التجاري',
    required: false,
    placeholderEn: 'e.g., 12345',
    placeholderAr: 'مثال: ١٢٣٤٥',
    tooltipEn: 'Jordanian commercial registration',
    tooltipAr: 'رقم السجل التجاري الأردني',
    validationPattern: /^[A-Za-z0-9\-\/]+$/,
    minLength: 3,
    maxLength: 20,
    errorMessageEn: 'Must be at least 3 characters',
    errorMessageAr: 'يجب أن يكون 3 أحرف على الأقل',
  },
};

// 3. Update function
export function getCurrentMarket(): CountryCode {
  const env = process.env.NEXT_PUBLIC_MARKET;
  if (env === 'JO') return 'JO';
  return 'SY'; // Default
}
```

### Step 2: Buy Domain (5 min)

- Buy `caryo.jo`
- Point DNS to your server

### Step 3: Deploy (5 min)

```bash
# Set environment variable
export NEXT_PUBLIC_MARKET=JO

# Build and deploy
npm run build
npm start
```

**Done!** caryo.jo now shows Jordanian validation.

---

## Suggested Markets

| Market | Why | Complexity |
|--------|-----|------------|
| 🇯🇴 Jordan | Very similar to Syria | Easy |
| 🇱🇧 Lebanon | Very similar to Syria | Easy |
| 🇪🇬 Egypt | Different format (XXX-XXX-XXX) | Medium |
| 🇦🇪 UAE | Different system (Trade License) | Medium |
| 🇸🇦 Saudi | Different system (10-digit CR) | Medium |

---

## What to Add Later

When expanding to multiple markets, you'll need:

1. **Listing Filtering** (3 hours)
   - Add `market` column to database
   - Filter cars by market
   - Users only see cars in their market

2. **Currency Support** (4 hours)
   - Display prices in local currency
   - SYP, JOD, EGP, etc.

3. **Payment Methods** (8 hours)
   - Market-specific payment processors
   - Syrian cash, Jordanian cards, etc.

4. **Phone Validation** (2 hours)
   - Different formats per market
   - +963 (SY), +962 (JO), etc.

**Add these only when you actually expand!**

---

## Example Market Configs

### Jordan (Easy - Similar to Syria)
```typescript
JO: {
  labelEn: 'Commercial Registration Number',
  labelAr: 'رقم السجل التجاري',
  required: false,
  validationPattern: /^[A-Za-z0-9\-\/]+$/,
  minLength: 3,
}
```

### Egypt (Medium - Different Format)
```typescript
EG: {
  labelEn: 'Tax Registration Number',
  labelAr: 'رقم التسجيل الضريبي',
  required: true,
  validationPattern: /^\d{3}-\d{3}-\d{3}$/,
  placeholderEn: '123-456-789',
}
```

### UAE (Medium - Strict Format)
```typescript
AE: {
  labelEn: 'Trade License Number',
  labelAr: 'رقم الرخصة التجارية',
  required: true,
  validationPattern: /^\d{6,10}$/,
  minLength: 6,
  maxLength: 10,
}
```

---

## Testing Checklist

After adding a market:

- [ ] Dealer signup shows correct field label
- [ ] Validation works (try valid/invalid numbers)
- [ ] Language switching works (EN ↔ AR)
- [ ] Optional/Required indicator correct
- [ ] Error messages show correctly

---

## Summary

**Now**: Focus on Syria, build features
**Later**: Add markets in 15 minutes each
**Much Later**: Add currency, payments, filters

The foundation is ready - expand when you're ready! 🚀

---

*Last updated: January 2025*

