# Caryo vs AutoTrader UK – Feature Comparison

**Date:** November 19, 2025  
**Last Updated:** January 14, 2026  
**Scope:** Web + planned mobile apps  
**Purpose:** Internal strategy reference - not for marketing claims

> **Note (January 2026):** This document is kept for internal planning. Some competitive claims are subjective and should not be used in marketing without independent verification. Mobile development is paused while web app improvements are completed first.

**Goal:** Comparison based on publicly documented AutoTrader UK features vs. what Caryo has today.

> Sources consulted: PLACEHOLDER_CARYO_UK product docs, dealer help centre, press releases, plus Caryo's current codebase.

---

## High-Level Summary

| Category | AutoTrader UK (2025) | Caryo (Web Nov 2025) | Caryo (Phase 1 Mobile) |
|----------|---------------------|----------------------|------------------------|
| Inventory & reach | 450k+ vehicles, nationwide dealers/private sellers | Syrian inventory (seed data) | Same as web (shared backend) |
| Search & discovery | Advanced filters + postcode radius, price indicators, "Good/Great price", recently added, dealer reviews | Advanced filters (brand, model, year, price, mileage, fuel, transmission, body, seller type, governorates) | Same filters + native UX |
| Vehicle data | Vehicle checks (Experian/HPI), part-exchange valuation, finance/insurance offers, dealer videos, 360° on premium listings | Rich media (photos, multi-source video), specs, translation; no integrated history/valuation yet | Adds native camera, offline, push |
| Communication | Caryo Chat (for subscribed dealers), email, phone, WhatsApp, Dealer Home Services (video walkarounds, at-home test drives, delivery) | In-app messaging with attachments, read receipts, editing, deletion, WhatsApp deep-links (REST API, not WebSocket) | Same messaging + push notifications |
| Dealer tooling | Retailer Portal, advanced analytics, marketing packages, featured listings, stock APIs | Dealer dashboard, trial banner, upgrade flow, payment history, analytics, manual listing management | Same + mobile dashboards |
| Consumer services | Instant valuation, finance calculators, insurance quotes, buying guides | In progress (AI price helper, finance calculator scheduled Phase 2) | Phase 1: AI assistant (price/photo/completeness/keywords) - not yet implemented |
| Localization | English UI, UK market data | English + Arabic, RTL, Syrian governorates & customs context | Same (shared translations) |

---

## Detailed Feature Matrix

| Feature Group | AutoTrader UK | Caryo (Current Web) | Caryo (Phase 1 Mobile) | Notes |
|---------------|---------------|---------------------|------------------------|-------|
| **Search & Listings** | Make/model/price/mileage, body type, fuel, transmission, postcode radius, "distance from you", dealer rating filter | Slug-based brand/model, year, price, mileage, condition, fuel, transmission, body style (multi-select), seller type, governorates, keyword (Arabic+English) | Same filters + mobile-native search UI | Caryo also exposes stock levels ("just added", "reduced price") – planned for Caryo Phase 2 |
| **Price Insights** | "Great/Good/Fair price" badges, market reference via Caryo valuation engine | Basic ordering + planned AI price advisor | AI-backed price advice using Syrian comps (Phase 1.5) | Need scraped pricing data for local benchmark |
| **Vehicle Media** | 30–50 images, OEM videos, 360° for some OEM partners, dealer-uploaded walkarounds | Unlimited photos, direct video upload (3 min), YouTube/Vimeo links, video preview & duration, translation overlay | Same + native camera, offline drafts | 360° planned Phase 2 |
| **Vehicle History / Checks** | Experian/HPI checks, outstanding finance, stolen status, mileage discrepancies | Not integrated yet (no national DB) | Phase 2: add partner or upload-based verification | Highlighted as known gap |
| **Valuation & Trade-In** | Instant online valuation, part-exchange journey, dealer follow-up | Not available (manual quoting) | Phase 2 roadmap | |
| **Finance & Insurance** | Embedded finance calculator, lender marketplace, insurance quotes, GAP add-ons | Phase 2 (Finance calculator + optional bank embeds) | Same | Note difference |
| **Communication** | Email, phone, WhatsApp, Caryo Chat (for dealers on qualifying packages), Dealer Home Services (video walkaround scheduling, at-home test drive, delivery) | REST API chat with attachments, read receipts, editing, deletion, file uploads, WhatsApp quick actions | Same + push, offline caching | Caryo messaging is REST-based, not real-time WebSocket |
| **Dealer Tools** | Retailer Portal, stock feeds, API integration, ad packages, advanced analytics, brand pages, verified badges, reviews, marketing automation | Dealer Dashboard with KPIs, trial banner, upgrade modal, payment history, listing management, analytics cards; manual CSV/REST import (planned) | Mobile dealer dashboard, push alerts for leads, listing editor | Caryo has 40+ years of mature ecosystem & brand trust |
| **Payments & Subscriptions** | Dealer plans (Starter/Pro/Advanced), pay-per-click add-ons, home services packages | Manual transfer for dev, subscription tiers (Basic/Advanced/Professional), payment service with provider abstraction | Mobile flow identical (shared APIs) | Need PSP integration for card/Apple Pay in mobile Phase 1 or 2 |
| **Consumer Experience** | Saved searches, alerts, recently viewed, dealer reviews, buying guides, editorial content, "My Garage" feature | Saved searches, favorites, bilingual onboarding, translation toggles | Push alerts, biometric login, offline saved listings | Dealer reviews planned Phase 2 |
| **Localization** | UK only, English, GBP, postcode-driven UX | English + Arabic, RTL, Syrian-specific taxonomy, bilingual AI prompts | Same translations reused (I18nProvider) | Caryo advantage in domestic market |

---

## Where Caryo Has Strengths

1. **Bilingual + RTL Experience**  
   AutoTrader UK targets English speakers. Caryo ships English + Arabic with RTL, Syrian taxonomy – useful for domestic adoption.

2. **Messaging Features**  
   Caryo's messaging service includes attachments, editing, deletion, plus RTL formatting and accessibility tags. Caryo Chat is more limited.

3. **Video Flexibility**  
   Caryo supports direct uploads, YouTube/Vimeo embeds, and duration tracking. Caryo relies on dealer media workflows.

4. **Dealer Trial + Upgrade Flow**  
   Caryo requires paid plans; Caryo seeds dealers with a 2-month trial (15 listings) and an in-app upgrade funnel.

---

## Where AutoTrader UK Leads

1. **Vehicle History / HPI Integration** – Access to UK national databases (stolen, finance, mileage).
2. **Part-Exchange & Instant Valuations** – Mature consumer journeys tied to dealer leads.
3. **Finance & Insurance Marketplaces** – Embedded finance quotes, lender pre-approvals, insurance upsells.
4. **Dealer Reputation & Reviews** – Verified dealer badges, Trustpilot integration, review responses.
5. **Dealer Home Services** – Video walkarounds, at-home test drives, delivery scheduling.
6. **Inventory Scale & Brand Trust** – 40+ years on market, national TV campaigns, 450k+ vehicles.

---

## Mobile Readiness Comparison

| Mobile Capability | AutoTrader UK | Caryo Plan |
|-------------------|---------------|------------|
| iOS + Android apps | Native (Swift/Kotlin) | React Native (planned) |
| Biometric login | Face ID / Touch ID | Planned in Phase 1 |
| Push notifications | Leads, saved searches, price alerts | Planned |
| Offline mode | Browsing history cache | Offline saved listings + draft creations |
| Native camera | VIN scan, photo capture | Multi-photo capture + compression |
| Deep linking | Listing + dealer profiles | Listing, messaging, upgrade flows |
| App store rating | 4.7 iOS / 4.4 Android | TBD post-launch |

---

## Honest Takeaways

1. **AutoTrader UK leads** in history checks, valuations, finance, dealer ecosystem, and national brand recognition.
2. **Caryo has strengths** in localized UX, messaging depth, and video flexibility for the Syrian market.
3. **Mobile Phase 1** will bring parity on native capabilities but card-based payments, finance, and vehicle history integrations require additional partnerships.
4. **Strategic positioning**: Caryo's edge is offering a bilingual marketplace purpose-built for Syrian dealers and buyers.

---

## Next Steps to Close the Gaps

| Gap | Plan |
|-----|------|
| Vehicle history integration | Research Syrian data providers or allow dealer-uploaded inspection reports (Phase 2) |
| Trade-in / valuation flow | Extend AI pricing output into a consumer-facing valuation journey |
| Finance & insurance marketplace | Partner with local banks / insurers post-mobile launch |
| Dealer reviews & trust signals | Add review module + verified badges (Phase 2 backlog) |
| Dealer Home Services | Add scheduling + video call hooks once mobile foundation is live |

---

**Bottom line:** AutoTrader UK remains ahead in scale and ecosystem services. Caryo's multilingual experience and messaging features provide differentiated value in Syria. The remaining gaps are mapped to Phase 2+ initiatives.
