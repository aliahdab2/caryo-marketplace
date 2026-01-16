# Performance Best Practices

This document outlines the performance patterns used in Caryo Marketplace to ensure fast page loads and efficient resource usage.

## Table of Contents
1. [Translation (i18n) Performance](#translation-i18n-performance)
2. [API Call Deduplication](#api-call-deduplication)
3. [Common Anti-Patterns](#common-anti-patterns)
4. [Testing for Performance](#testing-for-performance)

---

## Translation (i18n) Performance

### Lazy Loading Namespaces

We use lazy loading for translation files. Only the `common` namespace loads initially; other namespaces load on-demand when components request them.

#### ✅ Correct Pattern

```typescript
// Define namespaces OUTSIDE the component to prevent recreation
const PAGE_NAMESPACES = ['home', 'common'];

export default function HomePage() {
  const { t } = useLazyTranslation(PAGE_NAMESPACES);
  // ...
}
```

#### ❌ Incorrect Pattern

```typescript
export default function HomePage() {
  // BAD: Creates new array on every render
  const { t } = useLazyTranslation(['home', 'common']);
}
```

### Namespace Limits

- **Maximum 5 namespaces per component** - If you need more, consider:
  - Splitting the component
  - Moving common strings to `common.json`
  - Lazy loading less-used namespaces

### I18nProvider Behavior

The `I18nProvider` no longer bulk-loads all namespaces. It only:
1. Sets the language
2. Sets document direction (RTL/LTR)
3. Loads `common` namespace

Each page/component loads its own namespaces via `useTranslation` or `useLazyTranslation`.

---

## API Call Deduplication

### useApiData Hook

The `useApiData` hook prevents duplicate API calls through:
1. **Refs for unstable parameters** - `fetchFunction`, `params`, `errorMessage` stored in refs
2. **In-flight tracking** - Prevents duplicate requests during React StrictMode
3. **Mount tracking** - Prevents state updates after unmount

#### ✅ Correct Dependency Usage

```typescript
// Static data - fetch once on mount
const { data: brands } = useApiData(
  fetchBrands,
  '/api/brands',
  [], // Empty deps - fetch once
);

// Dynamic data - fetch when dependency changes
const { data: models } = useApiData(
  () => fetchModels(makeId),
  `/api/brands/${makeId}/models`,
  [makeId], // Only makeId triggers re-fetch
);
```

#### ❌ Never Include These in Dependencies

| Value | Why It's Bad |
|-------|--------------|
| `t` (translation function) | Changes when translations load |
| `i18n` instance | Unstable reference |
| Inline functions | New reference each render |
| Inline objects | New reference each render |

```typescript
// ❌ BAD - causes duplicate API calls
const { data } = useApiData(fetchBrands, '/api/brands', [t]);

// ✅ GOOD - stable dependencies only
const { data } = useApiData(fetchBrands, '/api/brands', []);
```

### React Query

For complex data fetching scenarios, use React Query (`@tanstack/react-query`):
- Built-in deduplication
- Automatic caching
- Background refetching

---

## Common Anti-Patterns

### 1. Translation Function in Dependencies

```typescript
// ❌ CAUSES: Duplicate API calls when translations load
useApiData(fetch, endpoint, [t]);
useEffect(() => { /* ... */ }, [t]);

// ✅ FIX: Remove t from dependencies
useApiData(fetch, endpoint, []);
useEffect(() => { /* ... */ }, []);
```

### 2. Bulk Loading Translations

```typescript
// ❌ CAUSES: All namespaces load on every page
await i18n.loadNamespaces(['ns1', 'ns2', 'ns3', 'ns4', ...]);

// ✅ FIX: Let each component load its own namespaces
const { t } = useTranslation(['specific-namespace']);
```

### 3. Inline Function in useEffect

```typescript
// ❌ CAUSES: Function recreated every render, effect runs every time
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData is inline, changes every render

// ✅ FIX: Use useCallback or refs
const fetchDataStable = useCallback(() => {
  fetchData();
}, [dependency]);

useEffect(() => {
  fetchDataStable();
}, [fetchDataStable]);
```

### 4. No Fetch Guard for StrictMode

```typescript
// ❌ CAUSES: Duplicate fetches in development
useEffect(() => {
  fetchData();
}, []);

// ✅ FIX: Add a ref to track if fetched
const hasFetched = useRef(false);
useEffect(() => {
  if (hasFetched.current) return;
  hasFetched.current = true;
  fetchData();
}, []);
```

---

## Testing for Performance

### Performance Test Suite

Run the performance tests to verify best practices are followed:

```bash
npm test -- --testPathPattern="performance"
```

### What the Tests Check

| Test | Purpose |
|------|---------|
| Namespace limits | Ensure no page loads more than 5 namespaces |
| API call limits | Document expected API calls per page |
| useApiData contract | Verify hook follows the ref pattern |
| I18nProvider behavior | Confirm no bulk loading |

### Manual Testing

1. Open DevTools → Network tab
2. Filter by XHR/Fetch
3. Reload the page
4. Count translation files (should be ≤5 for most pages)
5. Check for duplicate API calls (same URL twice)

---

## Quick Reference

| Pattern | Good | Bad |
|---------|------|-----|
| Translation namespaces | `const NS = ['a', 'b']` outside component | `['a', 'b']` inline |
| useApiData deps | `[]` or `[primitiveValue]` | `[t]` or `[i18n]` |
| StrictMode protection | Use refs to track fetch state | Unguarded useEffect |
| Namespace count | ≤5 per component | >5 namespaces |

---

## Related Files

- [`useApiData.ts`](../../frontend/src/hooks/useApiData.ts) - API data fetching hook
- [`I18nProvider.tsx`](../../frontend/src/components/I18nProvider.tsx) - Translation provider
- [`networkRequests.test.ts`](../../frontend/src/__tests__/performance/networkRequests.test.ts) - Performance tests
