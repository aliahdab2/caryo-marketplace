# Dealer Public Profile - Implementation Plan

## 📋 Executive Summary

**Goal:** Create public dealer profile pages that allow buyers to view dealer information and all their listings, similar to AutoTrader UK's "Retailer Store" pages.

**Timeline:** Phase 1 (2 weeks), Phase 2 (2–3 weeks)  
**Priority:** HIGH - Critical for dealer retention and competitive parity

### Phase Split (Agreed)

**Phase 1 (MVP)** — ship now, minimal scope:
- Public dealer page (ID-based route)
- Dealer listings grid + pagination
- Basic dealer profile fields (logo, banner, description, hours, social links)
- "View all listings" link from listing pages

**Phase 2 (Enhancements)** — after MVP:
- Reviews & ratings
- Verified dealer badges + admin verification
- Dealer analytics/insights
- Slug-based URLs + redirects

---

## 🔍 Current State Analysis

### What We Already Have

#### Backend (Dealer Entity)
| Field | Type | Status |
|-------|------|--------|
| `id` | Long | ✅ Exists |
| `user_id` | Long (FK) | ✅ Exists |
| `business_name` | String(100) | ✅ Exists |
| `vat_number` | String(50) | ✅ Exists |
| `trading_address` | String(255) | ✅ Exists |
| `business_email` | String(50) | ✅ Exists |
| `business_phone` | String(20) | ✅ Exists |
| `logo_url` | String(255) | ✅ Exists |
| `created_at` | LocalDateTime | ✅ Exists |
| `subscription_tier` | String(50) | ✅ Exists |

#### Backend APIs (DealerController)
| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/api/dealer/profile` | GET | Dealer only | ✅ Exists (private) |
| `/api/dealer/trial-status` | GET | Dealer only | ✅ Exists |
| `/api/dealer/can-create-listing` | GET | Dealer only | ✅ Exists |
| `/api/dealers/{id}/public` | GET | Public | ❌ **Missing** |
| `/api/dealers/{id}/listings` | GET | Public | ❌ **Missing** |

#### Frontend
| Component | Status |
|-----------|--------|
| `SellerInfo.tsx` | ✅ Shows basic seller info on listing |
| `/dealers/[id]` page | ❌ **Missing** |
| "View all listings" link | ❌ **Missing** |
| Dealer profile management | ❌ **Missing** |

---

## 🎯 What We Need to Build

### 1. Backend API Endpoints

#### 1.1 Public Dealer Profile
```
GET /api/dealers/{id}/public
```

**Response:**
```json
{
  "id": 1,
  "businessName": "Damascus Motors",
  "businessPhone": "+963-11-XXX-XXXX",
  "tradingAddress": "Damascus, Syria",
  "logoUrl": "https://...",
  "bannerUrl": "https://...",
  "memberSince": "2024-01-15",
  "description": "Trusted dealer since 2012...",
  "workingHours": {
    "weekdays": "9:00 AM - 6:00 PM",
    "saturday": "9:00 AM - 3:00 PM",
    "sunday": "Closed"
  },
  "socialLinks": {
    "facebook": "https://...",
    "instagram": "https://...",
    "whatsapp": "+963..."
  },
  "stats": {
    "totalListings": 23,
    "activeListings": 18,
    "soldCount": 45
  }
}
```

#### 1.2 Dealer Listings
```
GET /api/dealers/{id}/listings?page=0&size=12&sort=createdAt,desc
```

**Response:** Same as `/api/listings` but filtered by dealer

#### 1.3 Update Dealer Profile (for dealers)
```
PUT /api/dealer/profile
```

**Request:**
```json
{
  "description": "About our dealership...",
  "specialties": ["Toyota", "Honda"],
  "workingHours": {...},
  "socialLinks": {...}
}
```

---

### 2. Database Schema Changes

```sql
-- V60__Add_dealer_public_profile_fields.sql

ALTER TABLE dealers
  ADD COLUMN description TEXT,
  ADD COLUMN description_ar TEXT,
  ADD COLUMN working_hours JSONB,
  ADD COLUMN social_links JSONB,
  ADD COLUMN banner_url VARCHAR(255);

-- Phase 2 (optional): add slug, verification, gallery, specialties
-- ALTER TABLE dealers ADD COLUMN slug VARCHAR(100) UNIQUE;
-- CREATE INDEX idx_dealer_slug ON dealers(slug);
-- ALTER TABLE dealers ADD CONSTRAINT ck_dealer_slug_format CHECK (slug IS NULL OR slug ~* '^[a-z0-9-]+$');
-- ALTER TABLE dealers ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
-- ALTER TABLE dealers ADD COLUMN verification_date TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE dealers ADD COLUMN gallery_urls VARCHAR(255)[];
-- ALTER TABLE dealers ADD COLUMN specialties VARCHAR(255)[];
```

---

### 3. Frontend Pages & Components

#### 3.1 Public Dealer Profile Page
**Route:** `/dealers/[id]` (Phase 1)  
**Route:** `/dealers/[slug]` (Phase 2)

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  [Banner Image]                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │ [Logo]  Business Name           [Contact Button] ││
│  │         23 listings · Member 1yr                ││
│  └──────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────┤
│  [About] [Listings] [Location]             ← Tabs    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  About Us:                                            │
│  "Damascus Motors has been serving..."                │
│                                                       │
│  Working Hours:                                       │
│  Mon-Fri: 9AM-6PM | Sat: 9AM-3PM | Sun: Closed      │
│                                                       │
├──────────────────────────────────────────────────────┤
│  All Listings (23)                     [Grid][List]  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│  │ Car │ │ Car │ │ Car │ │ Car │                     │
│  └─────┘ └─────┘ └─────┘ └─────┘                     │
│  [Load More]                                          │
└──────────────────────────────────────────────────────┘
```

#### 3.2 Components Needed
| Component | Description |
|-----------|-------------|
| `DealerProfileHeader` | Banner, logo, name |
| `DealerStats` | Listings count, member since |
| `DealerAbout` | Description, hours |
| `DealerListings` | Grid of dealer's listings |
| `DealerContact` | Contact buttons, phone, WhatsApp |
| `DealerLocation` | Map, address |

#### 3.3 Dashboard: Profile Management
**Route:** `/dashboard/profile`

**Features:**
- Upload logo
- Upload banner
- Edit description (EN/AR)
- Set working hours
- Add social links
- Add specialties (Phase 2)

---

### 4. Integration Points

#### 4.1 Update SellerInfo Component
```tsx
// Add link to dealer profile
{isDealer && (
  <Link href={`/dealers/${listing.sellerId}`}>
    View all {listingsCount} listings from this dealer →
  </Link>
)}
```

#### 4.2 Update CarListingCard
```tsx
// Add dealer badge/link on cards
{listing.sellerType === 'dealer' && (
  <Link href={`/dealers/${listing.sellerId}`}>
    <Badge>Dealer</Badge>
  </Link>
)}
```

---

## 📅 Implementation Timeline

### Phase 1 — Week 1: Backend + Database

| Day | Task | Effort |
|-----|------|--------|
| 1 | Database migration (new fields) | 2h |
| 1 | Update Dealer entity | 2h |
| 2 | Create `PublicDealerController` | 4h |
| 2 | Create `PublicDealerResponse` DTO | 2h |
| 3 | Add `GET /dealers/{id}/public` endpoint | 3h |
| 3 | Add `GET /dealers/{id}/listings` endpoint | 2h |
| 4 | Add `PUT /dealer/profile` endpoint | 4h |
| 5 | Write unit tests | 4h |
| 5 | Write integration tests | 4h |

### Phase 1 — Week 2: Frontend

| Day | Task | Effort |
|-----|------|--------|
| 1 | Create dealer API service | 2h |
| 1 | Create dealer types | 1h |
| 1 | Create React Query hooks | 2h |
| 2 | Create `DealerProfilePage` | 6h |
| 3 | Create `DealerProfileHeader` | 3h |
| 3 | Create `DealerListings` component | 3h |
| 4 | Create `DealerAbout` component | 2h |
| 4 | Create `DealerContact` component | 2h |
| 4 | Update `SellerInfo` with link | 2h |
| 5 | Dashboard profile management (basic fields) | 6h |
| 5 | Testing & polish | 4h |

---

## 🔧 Technical Details

### Backend Files to Create/Modify

**New Files:**
```
controller/
  └── PublicDealerController.java
payload/response/
  └── PublicDealerResponse.java
  └── DealerStatsResponse.java
service/
  └── PublicDealerService.java
```

**Modified Files:**
```
model/Dealer.java (add new fields)
repository/DealerRepository.java (add queries)
controller/DealerController.java (add profile update)
```

### Frontend Files to Create/Modify

**New Files:**
```
app/[locale]/dealers/[id]/page.tsx
app/[locale]/dealers/[id]/DealerProfileClient.tsx
components/dealer/public/
  ├── DealerProfileHeader.tsx
  ├── DealerStats.tsx
  ├── DealerAbout.tsx
  ├── DealerListings.tsx
  ├── DealerContact.tsx
  └── DealerLocation.tsx
services/publicDealerApi.ts
hooks/queries/usePublicDealer.ts
types/dealer.ts (update)
```

**Modified Files:**
```
components/listings/[id]/components/SellerInfo.tsx (add link)
components/listings/CarListingCard.tsx (add badge)
```

---

## ✅ Definition of Done

### Backend
- [ ] Database migration applied successfully
- [ ] Public dealer endpoint returns correct data
- [ ] Dealer listings endpoint works with pagination
- [ ] Profile update endpoint works for dealers
- [ ] All endpoints have unit tests
- [ ] All endpoints have integration tests

### Frontend
- [ ] Dealer profile page renders correctly
- [ ] All dealer listings display with pagination
- [ ] "View all listings" link works from SellerInfo
- [ ] Profile management works in dashboard
- [ ] RTL support for Arabic
- [ ] Mobile responsive design
- [ ] E2E tests for dealer profile

---

## 🚀 Future Enhancements (Phase 2)

After this implementation, we can add:

1. **Dealer Reviews** - Feefo-style verified reviews
2. **Dealer Verification** - Badge for verified businesses
3. **Performance Badges** - "Quick Responder", "Top Seller"
4. **Dealer Analytics** - Views, inquiries, conversion
5. **SEO Optimization** - Slugs + redirect strategy
6. **Social Sharing** - Share dealer profile

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Dealer profile page load time | < 2s |
| "View all listings" click rate | > 5% |
| Dealer profile completion rate | > 50% |
| Bounce rate on dealer pages | < 40% |

---

## 🔗 Related Documents

- [MOBILE_APP_STRATEGY.md](./MOBILE_APP_STRATEGY.md)
- [WEB_APP_IMPROVEMENTS.md](./WEB_APP_IMPROVEMENTS.md)
- [API.md](../../backend/caryo-backend/API.md)
