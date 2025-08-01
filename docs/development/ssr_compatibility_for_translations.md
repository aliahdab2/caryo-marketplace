# SSR Compatibility for Translation System

## Overview

This document provides information about ensuring Server-Side Rendering (SSR) compatibility with our translation system in the Caryo Marketplace application.

## The Issue

The translation system relies on browser-only APIs (like `document`, `window`, and `performance`) which are not available during server-side rendering in Next.js. Without proper checks, this can lead to errors during the build and server rendering process.

## Solution Implemented

We've implemented the following fixes to ensure SSR compatibility:

1. **Browser Environment Checks**: Added checks for browser environment before accessing browser-only APIs:
   ```typescript
   if (typeof document !== 'undefined') {
     // Browser-only code here
   }
   ```

2. **Performance API Checks**: Similarly added checks for the Performance API:
   ```typescript
   const startTime = typeof performance !== 'undefined' ? performance.now() : 0;
   ```

3. **"use client" Directive**: All components that interact directly with the browser DOM or need client-side only features are marked with the "use client" directive at the top of the file.

## Best Practices

When working with the translation system, follow these best practices:

1. **Always Check Environment**: Always check for the browser environment before accessing browser-only APIs:
   ```typescript
   if (typeof window !== 'undefined') {
     // Browser-only code
   }
   ```

2. **Use "use client" Directive**: Add the "use client" directive to components that use browser-only features:
   ```typescript
   "use client";
   
   import React from 'react';
   // Rest of component
   ```

3. **Server Components vs. Client Components**: Be aware of the distinction between server and client components in Next.js:
   - Server Components: Cannot use browser APIs or React hooks
   - Client Components: Can use browser APIs and React hooks

4. **Debug Safely**: Translation debugging tools should only run in development mode and on the client side:
   ```typescript
   if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
     // Debug code here
   }
   ```

## Testing

After implementing these changes, test the application in both development and production modes:

1. **Development Mode**:
   ```bash
   npm run dev
   ```

2. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

Verify that no SSR-related errors appear in the console and that translations are loading correctly.

## Troubleshooting

If you encounter SSR-related errors:

1. Check for direct access to browser APIs without environment checks
2. Verify that components using browser APIs have the "use client" directive
3. Consider moving browser-specific code to useEffect hooks that only run after the component mounts

## Related Files

- `/src/utils/i18n.ts`
- `/src/hooks/useLazyTranslation.ts`
- `/src/utils/translationDebug.ts`
- `/src/components/debug/TranslationDebugger.tsx`
