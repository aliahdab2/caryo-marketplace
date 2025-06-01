# Translation Flattening Guide

This document explains the process of flattening nested translation structures in the Caryo Marketplace application, in accordance with the [Translation Guide for Developers](../../docs/translation_guide_for_developers.md).

## Why Flatten Translation Keys?

The official translation guide recommends using flat keys rather than nested objects for several reasons:

- **Performance**: Flat keys provide faster lookups and reduce parsing overhead
- **Maintainability**: Easier to search, sort, and maintain
- **Compatibility**: Better support with translation management tools
- **Consistency**: Follows i18next best practices
- **Simplicity**: Reduces complexity and potential errors

## What Changes?

Before flattening:
```json
{
  "auth": {
    "signin": "Sign In",
    "signup": "Sign Up"
  }
}
```

After flattening:
```json
{
  "auth.signin": "Sign In",
  "auth.signup": "Sign Up"
}
```

## How Components Access Translations

The good news is that most component code **doesn't need to change**. If your components already use dot notation:

```tsx
t('auth.signin')
```

This will continue to work with both nested and flattened structures. The i18next library handles both formats transparently.

## Implementation Process

We've created scripts to help with the flattening process:

1. **`flattenTranslations.js`**: Core utility function that converts nested objects to flat keys
2. **`flattenCommonJson.js`**: Demonstration script that flattens just the common.json files
3. **`flattenAllTranslations.js`**: Comprehensive script to flatten all translation files

### Testing the Change

Before applying flattening to all files, we've created sample flattened versions:

- `common.flattened.json`: Shows what the flattened structure looks like
- Original files will be backed up with `.backup.json` extension when running the scripts

## Migration Strategy

We recommend a phased approach:

1. **Start with Common Files**: Begin with common.json which is widely used
2. **Test Thoroughly**: Verify all components still render correctly
3. **Monitor Performance**: Look for improvements in load times and translation lookups
4. **Expand to Other Files**: Once validated, apply to other translation files

## Running the Scripts

```bash
# To flatten just the common.json files (recommended first step)
node scripts/flattenCommonJson.js

# To flatten all translation files (once common.json is verified)
node scripts/flattenAllTranslations.js
```

## Rollback Plan

If issues arise, you can restore from the backup files:

```bash
# Example to restore a backup
cp public/locales/en/common.backup.json public/locales/en/common.json
```

## Performance Impact

Flattening can yield several performance improvements:

- Faster key lookups (no nested property traversal)
- Reduced memory overhead
- More efficient caching by i18next
- Potentially smaller bundle sizes

These improvements will be more noticeable as the application scales with more translations and components.
