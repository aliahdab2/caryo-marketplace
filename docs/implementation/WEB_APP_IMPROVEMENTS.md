# Web App Improvements Plan

**Date:** January 14, 2026  
**Status:** In Progress  
**Priority:** Complete before starting mobile development

---

## Overview

This document outlines improvements to modernize the web app's state management and error handling patterns. These changes will:

1. Improve code quality and maintainability
2. Reduce bugs related to loading/error states
3. Create patterns that can be shared with mobile app later

---

## Current State

The web app currently uses:
- `useState` + `useEffect` for data fetching (manual loading/error handling)
- React Query installed but only used in 1 hook (`useSellerTypes.ts`)
- No Zustand (Context used for some global state)
- Inconsistent loading/error/empty states across components

---

## Target State

After improvements:
- React Query for all server data (automatic caching, loading states)
- Zustand for cross-screen UI state (filters, modals)
- Standardized QueryWrapper for consistent loading/error/empty UI
- Reusable patterns for mobile app

---

## Priority 1: React Query Adoption (3-5 days)

### Goal
Replace manual `useState` + `useEffect` data fetching with React Query hooks.

### Tasks

| Task | Files to Create/Modify | Effort | Status |
|------|------------------------|--------|--------|
| Create hooks/queries/ folder structure | `frontend/src/hooks/queries/` | 0.5 day | ✅ Done |
| Create useListings hook | `hooks/queries/useListings.ts` | 0.5 day | ✅ Done |
| Create useListing hook (single) | `hooks/queries/useListings.ts` | 0.5 day | ✅ Done |
| Create useFavorites hook | `hooks/queries/useFavorites.ts` | 0.5 day | ✅ Done |
| Create useSavedSearches hook | `hooks/queries/useSavedSearches.ts` | 0.5 day | ✅ Done |
| Create useConversations hook | `hooks/queries/useMessaging.ts` | 0.5 day | ✅ Done |
| Create useMessages hook | `hooks/queries/useMessaging.ts` | 0.5 day | ✅ Done |
| Create useDealerStats hook | `hooks/queries/useDealer.ts` | 0.5 day | ✅ Done |
| Migrate saved-searches page | `dashboard/saved-searches/page.tsx` | 0.5 day | ✅ Done |
| Migrate DealerDashboard | `components/dealer/DealerDashboard.tsx` | 0.5 day | ✅ Done |
| Migrate listings page | `dashboard/listings/page.tsx` | 0.5 day | ✅ Done |
| Migrate MessagesPage | `components/messaging/MessagesPage.tsx` | 0.5 day | ✅ Done |
| Migrate Favorites page | `favorites/page.tsx` | 0.5 day | ✅ Done |
| Add MessagesPage tests | `MessagesPage.test.tsx` | 0.5 day | ✅ Done |
| Migrate remaining (blocked-users, alerts) | Various pages | 1 day | Pending (optional) |

### Pattern to Follow

Use `useSellerTypes.ts` as the reference pattern:

```typescript
// hooks/queries/useListings.ts
import { useQuery } from '@tanstack/react-query';
import { getListings } from '@/services/listings';
import { ListingFilters } from '@/types/listings';

export function useListings(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => getListings(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Mutation Pattern

```typescript
// hooks/queries/useCreateListing.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createListing } from '@/services/listings';

export function useCreateListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    },
  });
}
```

---

## Priority 2: Zustand for UI State (1-2 days)

### Goal
Add Zustand for cross-screen UI state that doesn't belong in React Query.

### Tasks

| Task | Files to Create/Modify | Effort | Status |
|------|------------------------|--------|--------|
| Install Zustand | `npm install zustand` | 5 min | Pending |
| Create stores/ folder | `frontend/src/stores/` | 5 min | Pending |
| Create uiStore | `stores/uiStore.ts` | 0.5 day | Pending |
| Migrate filter state | Update search components | 0.5 day | Pending |
| Migrate modal state | Update modal components | 0.5 day | Pending |

### Pattern

```typescript
// stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Filter state
  savedFilters: Record<string, unknown>;
  setSavedFilters: (filters: Record<string, unknown>) => void;
  
  // Modal state
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  
  // Preferences
  preferredLanguage: 'en' | 'ar';
  setPreferredLanguage: (lang: 'en' | 'ar') => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      savedFilters: {},
      setSavedFilters: (filters) => set({ savedFilters: filters }),
      
      activeModal: null,
      setActiveModal: (modal) => set({ activeModal: modal }),
      
      preferredLanguage: 'en',
      setPreferredLanguage: (lang) => set({ preferredLanguage: lang }),
    }),
    { name: 'caryo-ui' }
  )
);
```

### What Goes in Zustand vs React Query

| Data Type | Where | Example |
|-----------|-------|---------|
| Server data | React Query | Listings, favorites, messages |
| Persisted UI preferences | Zustand | Language, saved filters |
| Temporary UI state | Component useState | Form inputs, local toggles |
| Cross-screen UI state | Zustand | Active modal, sidebar open |

---

## Priority 3: Error Handling Standardization (1 day)

### Goal
Create consistent loading, empty, and error states across all screens.

### Tasks

| Task | Files to Create | Effort | Status |
|------|-----------------|--------|--------|
| Create LoadingSkeleton component | `components/common/LoadingSkeleton.tsx` | 2 hours | ✅ Done |
| Create ErrorDisplay component | `components/common/ErrorDisplay.tsx` | 2 hours | ✅ Done |
| Create EmptyState component | `components/common/EmptyState.tsx` | 2 hours | ✅ Done |
| Create QueryWrapper component | `components/common/QueryWrapper.tsx` | 2 hours | ✅ Done |
| Add tests for common components | `components/common/__tests__/` | 2 hours | ✅ Done |
| Migrate components to use QueryWrapper | Various components | 1 day | In Progress |

### QueryWrapper Pattern

```typescript
// components/common/QueryWrapper.tsx
import { UseQueryResult } from '@tanstack/react-query';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { EmptyState } from './EmptyState';

interface QueryWrapperProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  emptyMessage?: string;
  emptyComponent?: React.ReactNode;
}

export function QueryWrapper<T>({
  query,
  children,
  loadingComponent,
  emptyMessage = 'No data found',
  emptyComponent,
}: QueryWrapperProps<T>) {
  if (query.isLoading) {
    return loadingComponent || <LoadingSkeleton />;
  }

  if (query.error) {
    return <ErrorDisplay error={query.error} retry={query.refetch} />;
  }

  if (!query.data || (Array.isArray(query.data) && query.data.length === 0)) {
    return emptyComponent || <EmptyState message={emptyMessage} />;
  }

  return <>{children(query.data)}</>;
}
```

### Usage

```tsx
// Before (manual handling in every component)
const [listings, setListings] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  getListings()
    .then(setListings)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (listings.length === 0) return <div>No listings</div>;

// After (clean and consistent)
const listingsQuery = useListings(filters);

<QueryWrapper query={listingsQuery} emptyMessage={t('noListings')}>
  {(listings) => <ListingsGrid listings={listings} />}
</QueryWrapper>
```

---

## Priority 4: Form Improvements (Optional, 3-5 days)

### Goal
Improve form handling with React Hook Form + Zod validation.

### Tasks

| Task | Effort | Status |
|------|--------|--------|
| Install react-hook-form + zod | 5 min | Pending |
| Create form schemas | 1 day | Pending |
| Migrate listing creation form | 2 days | Pending |
| Migrate auth forms | 1 day | Pending |

### When to Do This
Only after Priorities 1-3 are complete. This is optional and can be done later.

---

## Priority 5: Optimistic Updates (Optional, 2-3 days)

### Goal
Add instant UI feedback for common actions.

### Tasks

| Action | Effort | Status |
|--------|--------|--------|
| Favorites toggle | 0.5 day | Pending |
| Message send | 0.5 day | Pending |
| Listing draft save | 1 day | Pending |

### Pattern

```typescript
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (listingId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['favorites']);
      
      // Optimistically update
      queryClient.setQueryData(['favorites'], (old) => 
        old?.includes(listingId) 
          ? old.filter(id => id !== listingId)
          : [...(old || []), listingId]
      );
      
      return { previous };
    },
    onError: (err, listingId, context) => {
      // Rollback on error
      queryClient.setQueryData(['favorites'], context?.previous);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
```

---

## Implementation Order

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | React Query setup | Query hooks for listings, favorites, messaging |
| 2 | React Query migration | Components using new hooks |
| 2-3 | Zustand setup | UI store, filter/modal state |
| 3 | Error handling | QueryWrapper, ErrorDisplay, EmptyState, LoadingSkeleton |
| 3-4 | Testing | Verify all screens have loading/error/empty states |

---

## Success Criteria

- [ ] All data fetching uses React Query hooks
- [ ] No manual loading/error state management in components
- [ ] Zustand handles cross-screen UI state
- [ ] Every screen has loading, error, and empty states
- [ ] All existing tests pass
- [ ] No regressions in functionality

---

## Priority 6: End-to-End Tests (3-5 days)

### Goal
Add automated E2E tests for critical user flows using Playwright or Cypress.

### Why This Matters
- Unit tests verify individual components work
- E2E tests verify the entire user journey works end-to-end
- Catches integration issues that unit tests miss
- Essential for confident deployments

### Tasks

| Task | Effort | Status |
|------|--------|--------|
| Choose testing framework (Playwright recommended) | 0.5 day | Pending |
| Set up E2E test infrastructure | 0.5 day | Pending |
| Create test for login/logout flow | 0.5 day | Pending |
| Create test for browse → listing details | 0.5 day | Pending |
| Create test for favorite/unfavorite | 0.5 day | Pending |
| Create test for create listing (draft) | 1 day | Pending |
| Create test for send message | 0.5 day | Pending |
| Create test for dealer subscription flow | 1 day | Pending |
| Add E2E tests to CI pipeline | 0.5 day | Pending |

### Critical User Flows to Test

1. **Authentication**: Login → access protected page → logout
2. **Browse & View**: Home → search → filters → listing details
3. **Favorites**: View listing → add to favorites → view favorites page
4. **Messaging**: View listing → contact seller → send message
5. **Listing Creation**: Start listing → add details → upload photos → save draft
6. **Dealer Upgrade**: Dashboard → view trial status → upgrade subscription

### Framework Recommendation

**Playwright** is recommended because:
- Built-in TypeScript support
- Faster than Cypress
- Better cross-browser testing
- Auto-wait for elements (less flaky tests)
- Built-in test recording

---

## Priority 7: Performance Monitoring (2-3 days)

### Goal
Add production monitoring to track performance and errors.

### Why This Matters
- Know when users experience slow pages
- Catch errors before users report them
- Track real performance metrics (not just local tests)
- Essential for production-ready apps

### Tasks

| Task | Effort | Status |
|------|--------|--------|
| Choose monitoring solution | 0.5 day | Pending |
| Set up frontend error tracking | 0.5 day | Pending |
| Add Core Web Vitals monitoring | 0.5 day | Pending |
| Set up backend APM (if not present) | 0.5 day | Pending |
| Create performance dashboard | 0.5 day | Pending |
| Set up alerting for errors/slow pages | 0.5 day | Pending |

### Recommended Tools

| Tool | Purpose | Cost |
|------|---------|------|
| **Sentry** | Error tracking (frontend + backend) | Free tier available |
| **Vercel Analytics** | Core Web Vitals (if using Vercel) | Included with Vercel |
| **PostHog** | Product analytics + session replay | Free tier available |
| **New Relic / Datadog** | Full APM (enterprise) | Paid |

### Minimum Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| LCP (Largest Contentful Paint) | < 2.5s | Page load speed |
| FID (First Input Delay) | < 100ms | Interactivity |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability |
| Error Rate | < 1% | Reliability |
| API Response Time (p95) | < 500ms | Backend performance |

---

## Updated Implementation Order

| Phase | Focus | Effort | Status |
|-------|-------|--------|--------|
| 1 | React Query setup + hooks | 2 days | ✅ Done |
| 2 | React Query migration | 2-3 days | ✅ Done (core pages) |
| 3 | Zustand setup | 1-2 days | Pending |
| 4 | Error handling components | 1 day | ✅ Done |
| 5 | Form improvements (optional) | 3-5 days | Pending |
| 6 | Optimistic updates (optional) | 2-3 days | Pending |
| 7 | E2E tests | 3-5 days | Pending |
| 8 | Performance monitoring | 2-3 days | Pending |

### Migration Summary (as of Jan 15, 2026)

**Migrated to React Query:**
- ✅ Saved Searches page
- ✅ Dealer Dashboard
- ✅ Listings page (dashboard)
- ✅ Messages page
- ✅ Favorites page

**Using custom hooks (stable, future migration optional):**
- Search page (uses `useApiData` with caching)
- Blocked Users page
- Saved Alerts page

**Already server-side rendered:**
- Listing Detail page (data passed as props)

---

## After Completion

Once these improvements are done:
1. Web app will be more maintainable
2. Patterns can be directly reused in mobile app
3. Mobile development can start with proven architecture
4. E2E tests will catch regressions automatically
5. Performance monitoring will ensure production quality
