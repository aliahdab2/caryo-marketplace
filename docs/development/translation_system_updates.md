# Translation System Updates for Caryo Marketplace

This document describes recent updates to the translation system in the Caryo Marketplace application.

## Architecture Improvements

### 1. Key Structure Update

Translation files now use direct keys within namespaces, rather than prefixed keys:

#### Old approach:
```json
{
  "auth.signIn": "Sign In",
  "auth.username": "Username"
}
```

#### New approach:
```json
{
  "signIn": "Sign In",
  "username": "Username"
}
```

When using the `useTranslation` or `useLazyTranslation` hooks with a namespace, you now use the direct key:

```tsx
// OLD
const { t } = useTranslation('auth');
t('auth.signIn'); // Wrong! Namespace is already specified

// NEW
const { t } = useTranslation('auth');
t('signIn'); // Correct! Just use the key directly
```

### 2. Lazy Loading Implementation

We've implemented a robust lazy-loading mechanism for translations to improve performance:

- The `useLazyTranslation` hook now properly loads namespaces on demand
- Loading status is tracked with the `ready` flag
- Components should show loading states while translations are loading

Example usage:
```tsx
const { t, ready } = useLazyTranslation('auth');

return (
  <>
    {!ready ? (
      <div>Loading...</div>
    ) : (
      <button>{t('signIn')}</button>
    )}
  </>
);
```

### 3. Module Export Structure

We've introduced a new `i18nExports.ts` file that properly exports all i18n-related functions and types:

```typescript
// Import from i18nExports.ts instead of directly from i18n.ts
import { changeLanguage, LANGUAGES } from '@/utils/i18nExports';
```

This approach ensures proper type exports and maintains compatibility with TypeScript's strict mode.

### 4. Language Switching

The `changeLanguage` function now properly updates:
- The i18n instance language
- Document language attributes and direction
- localStorage and cookies for persistence
- Dispatches events for components to react to changes

### 5. Debugging Improvements

We've enhanced the translation debugging tools:
- Cache hit/miss logging
- Namespace loading reports
- Language change tracking

## Best Practices for Developers

1. **Always use the namespace parameter** with translation hooks:
   ```tsx
   // GOOD: Specify namespace
   const { t } = useTranslation('auth');
   
   // BAD: No namespace specified, relies on defaultNS
   const { t } = useTranslation();
   ```

2. **Handle the loading state** when using lazy translations:
   ```tsx
   const { t, ready } = useLazyTranslation('auth');
   if (!ready) return <LoadingIndicator />;
   ```

3. **Import from i18nExports.ts** instead of directly from i18n.ts:
   ```tsx
   import { changeLanguage } from '@/utils/i18nExports';
   ```

4. **Check translation availability** before rendering:
   ```tsx
   {ready && t('welcome')}
   ```

5. **Remember key structure** - don't prefix keys with the namespace:
   ```tsx
   // WRONG
   const { t } = useTranslation('auth');
   t('auth.signIn');
   
   // RIGHT
   const { t } = useTranslation('auth');
   t('signIn');
   ```

## Deployment Considerations

1. Ensure all translation files are properly bundled
2. Verify that both languages work in production mode
3. Test language switching in all components
4. Monitor for missing translations in production logs
