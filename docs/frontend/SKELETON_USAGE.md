# Skeleton Loading States - Usage Guide

## Overview

We use a **primitive skeleton system** following industry best practices (similar to Shadcn/ui, Chakra UI, Material UI). This approach provides maximum flexibility while maintaining consistency.

## The Skeleton Component

Location: [`/frontend/src/components/ui/Skeleton.tsx`](file:///Users/aliahdab/Documents/caryo-marketplace/frontend/src/components/ui/Skeleton.tsx)

### Basic Usage

```tsx
import Skeleton from '@/components/ui/Skeleton';

// Simple text line
<Skeleton className="h-4 w-3/4" />

// Full-width image placeholder
<Skeleton className="h-52 w-full" />

// Circle/avatar
<Skeleton className="h-12 w-12 rounded-full" />
```

## Real-World Examples

### Car Listing Card Skeleton

```tsx
{
  isLoading &&
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5">
        <Skeleton className="h-52 w-full mb-4" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    ));
}
```

### Table Row Skeleton

```tsx
<tr>
  <td>
    <Skeleton className="h-4 w-full" />
  </td>
  <td>
    <Skeleton className="h-4 w-24" />
  </td>
  <td>
    <Skeleton className="h-4 w-16" />
  </td>
</tr>
```

### Profile Header Skeleton

```tsx
<div className="flex items-center gap-4">
  <Skeleton className="h-16 w-16 rounded-full" />
  <div className="flex-1">
    <Skeleton className="h-6 w-48 mb-2" />
    <Skeleton className="h-4 w-32" />
  </div>
</div>
```

## Best Practices

1. **Match the layout**: Skeleton dimensions should match the actual content to prevent layout shifts
2. **Use consistent spacing**: Apply the same margin/padding as the real content
3. **Dark mode**: The `Skeleton` component automatically adapts to dark mode
4. **Accessibility**: Skeletons include `aria-hidden="true"` by default

## When to Use Skeletons

✅ **Use skeletons for:**

- List items (car listings, search results)
- Cards and content blocks
- Tables and data grids
- Profile pages
- Image galleries

❌ **Don't use skeletons for:**

- Instant operations (< 200ms)
- Background data refreshes
- Modal/dialog content (use spinners instead)
- Form submissions (use button loading states)

## Migration from Old Patterns

If you find inline skeleton code like this:

```tsx
// ❌ Old way (don't do this)
<div className="animate-pulse">
  <div className="h-4 bg-gray-300 rounded" />
</div>
```

Replace it with:

```tsx
// ✅ New way
<Skeleton className="h-4 w-full" />
```

## Reference Implementation

See [`HomeCarListings.tsx`](file:///Users/aliahdab/Documents/caryo-marketplace/frontend/src/components/home/HomeCarListings.tsx) for a complete example.
