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
| Create hooks/queries/ folder structure | `frontend/src/hooks/queries/` | 0.5 day | Pending |
| Create useListings hook | `hooks/queries/useListings.ts` | 0.5 day | Pending |
| Create useListing hook (single) | `hooks/queries/useListing.ts` | 0.5 day | Pending |
| Create useFavorites hook | `hooks/queries/useFavorites.ts` | 0.5 day | Pending |
| Create useSavedSearches hook | `hooks/queries/useSavedSearches.ts` | 0.5 day | Pending |
| Create useConversations hook | `hooks/queries/useConversations.ts` | 0.5 day | Pending |
| Create useMessages hook | `hooks/queries/useMessages.ts` | 0.5 day | Pending |
| Create useDealerStats hook | `hooks/queries/useDealerStats.ts` | 0.5 day | Pending |
| Migrate components to use new hooks | Various components | 1-2 days | Pending |

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
| Create LoadingSkeleton component | `components/common/LoadingSkeleton.tsx` | 2 hours | Pending |
| Create ErrorDisplay component | `components/common/ErrorDisplay.tsx` | 2 hours | Pending |
| Create EmptyState component | `components/common/EmptyState.tsx` | 2 hours | Pending |
| Create QueryWrapper component | `components/common/QueryWrapper.tsx` | 2 hours | Pending |

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

## After Completion

Once these improvements are done:
1. Web app will be more maintainable
2. Patterns can be directly reused in mobile app
3. Mobile development can start with proven architecture
