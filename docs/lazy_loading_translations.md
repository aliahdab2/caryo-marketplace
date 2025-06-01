# Lazy Loading Translations in Caryo Marketplace

This document explains how to use the `useLazyTranslation` hook for implementing lazy loading of translations in Caryo Marketplace components.

## Overview

Lazy loading translations improves application performance by only loading the translation files that are needed for the current view, rather than loading all translations upfront.

## Using the `useLazyTranslation` Hook

### Basic Usage

```tsx
import useLazyTranslation from '@/hooks/useLazyTranslation';
import { useTranslation } from 'react-i18next';

function MyComponent() {
  // Load the 'myNamespace' namespace when the component mounts
  useLazyTranslation('myNamespace');
  
  // Use the translations as usual
  const { t } = useTranslation('myNamespace');
  
  return <div>{t('myNamespace.someKey')}</div>;
}
```

### Loading Multiple Namespaces

```tsx
import useLazyTranslation from '@/hooks/useLazyTranslation';
import { useTranslation } from 'react-i18next';

function MyComponent() {
  // Load multiple namespaces
  useLazyTranslation(['namespace1', 'namespace2']);
  
  // Use translations from multiple namespaces
  const { t } = useTranslation(['namespace1', 'namespace2']);
  
  return (
    <div>
      <h1>{t('namespace1.title')}</h1>
      <p>{t('namespace2.description')}</p>
    </div>
  );
}
```

## Benefits

- **Improved Initial Load Time**: Only essential translations are loaded initially
- **Better Performance**: Translation files are loaded only when needed
- **Reduced Memory Usage**: Fewer resources used when only some parts of the application are accessed

## Best Practices

1. Use the `useLazyTranslation` hook in all components that need translations
2. Group translations logically by namespace (e.g., 'auth', 'dashboard', 'profile')
3. Load only the namespaces that are needed for the current component
4. For shared translations, consider using a 'common' namespace that can be loaded globally

## Implementation Details

The `useLazyTranslation` hook internally uses the i18next library's `loadNamespaces` method to dynamically load translation files. It handles both single namespace strings and arrays of namespace strings.
