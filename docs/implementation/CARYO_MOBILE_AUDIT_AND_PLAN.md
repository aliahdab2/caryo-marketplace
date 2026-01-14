# CaryoMobile Audit & Roadmap (November 19, 2025)

> **Status (January 2026):** This document is kept for historical reference. The separate CaryoMobile workspace was abandoned. Mobile development is paused while web app improvements (React Query, Zustand, error handling) are completed first. When mobile resumes, it will be built fresh within this monorepo.

This document captures the state of the standalone `CaryoMobile` workspace (`/Users/aliahdab/Documents/CaryoMobile`), compares it against the approved mobile scope in `docs/implementation/MOBILE_APP_STRATEGY.md`, and recommends whether to reuse or rebuild the app.

---

## 1. Current Repository Snapshot

### 1.1 Tooling & Project Wiring
- **Expo 54.0.20 / React Native 0.81.5 / React 19.1.0** (bleeding-edge betas). The mobile strategy assumes the current stable RN (≤0.76) to match the ecosystem used by Expo SDK 52. Staying on 54/0.81 would block several ecosystem libraries (React Navigation, RN Reanimated, vector icons) until they finish beta testing.
- **TypeScript files exist but aren’t compiled.** The project has no `tsconfig.json`, Babel config, or Expo TypeScript template. The entry point (`index.js`) still registers `./App.js` (default Expo template), so none of the `src/**/*.tsx` code actually mounts.
- **Missing dependency declarations.** `package.json` only lists `expo`, `expo-status-bar`, `react`, and `react-native`, yet the source imports the following packages:
  - `@tanstack/react-query`
  - `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
  - `react-native-safe-area-context`
  - `@react-native-async-storage/async-storage`
  - `react-native-toast-message`
  - `react-native-vector-icons/MaterialIcons`
  - `zustand`
  - future hooks such as `useImageOptimization` (imported but not implemented)
  This code will fail to bundle even if TypeScript were enabled.
- **Navigation loop**: `AppNavigator` polls `AsyncStorage` every second to check auth state, which is battery-expensive and doesn’t leverage the existing session hooks in the web repo.

### 1.2 Screens & Features
| Area | Implementation Today | Notes |
|------|----------------------|-------|
| Authentication | `LoginScreen` with username/password posting to `/auth/signin` | No registration, OTP, social login, or biometric auth. Token is stored but nothing triggers navigation besides the polling loop. |
| Home feed | `HomeScreen` fetches `/listings` and renders `CarCard`s | Lacks pagination, filtering, saved searches, offline cache, or skeleton composition beyond static placeholders. |
| Favorites | `FavoritesScreen` placeholder text only | Zustand store exists but UI never consumes it; no optimistic updates, empty/error states, or syncing. |
| Messages | `MessagesScreen` placeholder | No Socket.IO/WebSocket integration, no conversation list, and no attachment UI. |
| Listing details | `CarDetailsScreen` placeholder | Missing gallery, specs, seller info, video, pricing insights, share sheet, etc. |
| Dealer experience | None | No dashboard, listing editor, payments, or analytics screens. |
| Infrastructure | `apiService` wraps `fetch` with AsyncStorage tokens | No error boundary, retry policies, or React Query hooks despite `QueryClient` in `App.tsx`. |
| Theming & i18n | Custom theme tokens exist, but there is no internationalization layer | App still uses hardcoded English strings and doesn’t integrate existing translation JSONs. |
| Hooks/utilities | `useImageOptimization` is imported but not implemented (`src/hooks/` is empty). `logPerformance` exists but is unused | Build will crash at import resolution. |

### 1.3 Reusable Pieces
- **Design tokens and UI atoms** (`theme/colors.ts`, `spacing.ts`, `typography.ts`, basic cards/skeletons) look polished and reusable inside a new app.
- **`apiService` & `favoritesStore`** illustrate how to talk to the backend. They need hardening (error handling, DTO alignment) but can be ported.
- **Screen scaffolds** (Home, Login) provide layout references even though navigation wiring is incomplete.

### 1.4 Key Blockers
1. **Entry point mismatch** – Expo still loads `App.js` (sample screen), so the new code is dead. Needs `index.ts` + Expo TS config.
2. **Missing dependencies** – None of the imported libraries are installed, leading to runtime/bundle errors.
3. **Missing hooks/components** – Imports to non-existent files (`useImageOptimization`) will stop Metro.
4. **Platform services absent** – No configuration for push notifications (FCM/APNS), biometric auth, secure storage, or offline caches that the strategy requires.
5. **Architecture drift** – Polling AsyncStorage every second, lack of React Query provider usage, and no modular API layer conflict with the backend-first plan.

---

## 2. Gap Analysis vs. Approved Mobile Strategy

Reference: `docs/implementation/MOBILE_APP_STRATEGY.md` (Phase 1 scope covering buyers + dealers, offline mode, push notifications, AI assistant, payments).

| Capability (from strategy) | Status in `CaryoMobile` repo | Gap / Notes |
|----------------------------|------------------------------|-------------|
| **Stable RN/Expo baseline** (React Native ≥0.74, Expo SDK 52 with TypeScript) | Using Expo 54 beta, RN 0.81, no TS config | Need to re-init on supported SDK, add TS tooling, align with React Query & navigation requirements. |
| **Authentication suite** (login, register, forgot password, biometric, session reuse) | Only login screen; no token refresh, no biometric, no session hook | Must port `useOptimizedSession` logic, add secure storage + biometrics, and implement onboarding screens. |
| **Buyer experience** (search filters, saved searches, listing details, share, compare, valuation) | Basic home feed; search tab is placeholder; details screen empty | Requires full feature build plus offline caching and saved searches tied to backend endpoints. |
| **Favorites & Saved Searches** | Zustand store exists but UI missing; saved searches absent | Need dedicated screens, React Query caches, and push alert toggles. |
| **Messaging** (production-ready from web) | Messages tab placeholder; no socket connection or UI | Must embed the existing messaging service (Socket.IO endpoints, attachments, read receipts). |
| **Dealer experience** (dashboard, listing management, payments) | Nothing implemented | Need separate navigation stack or segmented controls for dealers, plus subscription management screens using the existing payment APIs. |
| **AI Smart Assistant** (price, photo, completeness, keyword) | Not present | Must hook into existing OpenAI services, add UI flows inside listing creation/edit screens. |
| **Notifications** (FCM/APNS, saved search alerts, lead alerts) | None configured | Need Firebase project, device token registration, backend endpoints, and in-app preference center. |
| **Offline mode & caching** | Not implemented | Need persistent storage (MMKV/AsyncStorage) for listings, favorites, drafts, and queueing actions. |
| **Video & media capture** | UI placeholders only | Need Expo Camera / Image Picker, upload queue, progress indicators, and integration with existing video endpoints. |
| **Testing & CI** (unit tests, linting, Detox/E2E) | No Jest config, no lint rules | Must add ESLint/TypeScript configs consistent with the monorepo standards. |

Conclusion: the current repo only covers ~10–15% of the Phase 1 scope and lacks the foundational tooling to implement the remaining 85–90%.

---

## 3. Recommendation & Forward Plan

### 3.1 Reuse vs. Rebuild
- **Refactor option:** Would require rewiring the entry point, adding a TypeScript toolchain, downgrading Expo/RN to stable versions (or upgrading every dependency to beta), installing 10+ missing packages, backfilling hooks, and rewriting most screens. This is essentially the same effort as starting anew, but with added risk from leftover template files.
- **Rebuild option (recommended):** Initialize a fresh Expo TypeScript app on the stable SDK, copy over the reusable theme/components/API pieces, and implement features according to the strategy. This keeps history clean, ensures deterministic dependencies, and avoids chasing beta regressions.

### 3.2 Proposed Build Plan (Fresh Expo Project)
1. **Bootstrap**
   - `expo init caryo-mobile --template expo-template-blank-typescript`
   - Target Expo SDK 52 w/ React Native 0.76 (currently LTS); enable Hermes.
   - Configure `tsconfig.json`, ESLint, and absolute import aliases (`@/`).
2. **Core Dependencies**
   - Navigation: `@react-navigation/native`, stack, tabs, drawer, Drawer linking with `react-native-screens`.
   - State/query: `@tanstack/react-query`, Zustand (for local stores), React Context for auth/session.
   - UI/utilities: `react-native-safe-area-context`, `react-native-toast-message`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-vector-icons`, `expo-image`, `expo-linear-gradient`.
   - Platform services: `expo-notifications`, `expo-secure-store`, `expo-device`, `expo-file-system`, `expo-camera`, `expo-image-picker`.
3. **Project Structure**
   ```
   src/
     app.tsx (providers: SafeArea, QueryClient, I18n, Theme)
     navigation/ (auth stack, buyer tabs, dealer stack, modal stack)
     screens/
       auth/, buyer/, dealer/, messaging/, profile/, onboarding/
     modules/
       listings/, favorites/, saved-searches/, payments/, chat/, ai-assistant/
     services/
       api-client (reuse web `apiRequest` wrapper), messaging socket, push notifications
     state/
       authStore, favoritesStore, dealerStore
     hooks/
       useSession, useOfflineCache, useImageOptimization (implement)
     lib/
       analytics, logger, env
     assets/ (reusable icons, lotties)
   ```
4. **Migration Steps**
   - Port the **theme** (`colors`, `spacing`, `typography`) and UI atoms (`SearchBar`, `QuickFilters`, `CarCard`, skeletons) after converting them to TS + Expo Image.
   - Adapt `apiService` to leverage the existing `apiRequest` helper in `frontend/src/services/auth/session-manager.ts` for consistent auth handling.
   - Bring over `favoritesStore` logic but convert to an idiomatic Zustand slice with selectors.
   - Implement the messaging module by reusing the already-tested Socket.IO layer from the web (same endpoints, DTOs).
   - Align translation usage with `react-i18next` or Expo’s i18n solution by copying JSON files from `frontend/public/locales`.
5. **Feature Implementation Order** (mirrors strategy timeline):
   - **Month 1:** Auth flows, navigation, buyer home/search/detail, favorites, saved searches.
   - **Month 2:** Dealer dashboard + listing management, media capture/upload, payments/subscriptions.
   - **Month 3:** Messaging UI, push notifications, offline caching, translations, QA hardening.
   - **Month 4 (buffer):** AI assistant widgets, valuation tools, analytics polish, store submissions.
6. **Testing & Delivery**
   - Add Jest + React Native Testing Library for unit tests, MSW/native networking mocks for service tests, and Detox/E2E for smoke flows.
   - Integrate with CI (GitHub Actions) to run lint/test/build on both mobile and web repos.

### 3.3 Next Steps
1. Archive the current `CaryoMobile` repo as a design prototype reference.
2. Initialize the new Expo TypeScript project within the main `caryo-marketplace` monorepo (e.g., `mobile/` folder) for shared tooling and CI.
3. Copy the reusable theme/components/API modules into the new project, adding unit tests as they are ported.
4. Follow the implementation order above, leveraging the backend endpoints and documentation already completed.

By rebuilding on a clean, stable Expo baseline, we avoid hidden technical debt from the prototype, stay aligned with the documented mobile strategy, and can deliver the Phase 1 feature set inside the 5.5-month timeline.

