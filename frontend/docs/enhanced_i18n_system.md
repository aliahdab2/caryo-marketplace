# Enhanced i18n System Documentation

This document explains the improvements made to the internationalization (i18n) system in the Caryo Marketplace application.

## Core Components

### 1. Enhanced i18n Configuration (`src/utils/i18n.ts`)

The core i18n configuration has been improved with:

- Type safety through TypeScript generics and interfaces
- Better language detection and fallback mechanisms
- Performance optimizations for loading resources
- Error handling for various edge cases
- Exported utility functions for language management

### 2. Language Direction Management (`src/utils/languageDirection.ts`)

A new utility to manage RTL/LTR language directions:

- `getLanguageDirection()`: Get direction information for a language
- `useLanguageDirection()`: React hook for accessing direction information
- `isRTL()`: Simple check for RTL languages
- `directionValue()`: Helper to switch values based on direction

### 3. Type-Safe Translation Hook (`src/utils/useTranslation.ts`)

An enhanced version of the `useTranslation` hook that provides:

- Type-safe translation keys with TypeScript
- Auto-completion for translation paths
- Checking for existence of translations
- Direct access to i18n instance

### 4. Translation Loading Optimization (`src/utils/translationLoader.ts`)

Utilities to optimize loading of translation resources:

- Lazy loading of non-critical languages
- Preloading of languages before user switches
- Performance-aware loading using browser idle time
- Sequential loading to avoid network congestion

### 5. Enhanced Language Provider (`src/components/EnhancedLanguageProvider.tsx`)

Improved language context provider with:

- Proper initialization from various sources (cookies, localStorage, browser)
- Efficient language switching with proper state updates
- Document attribute management for RTL/LTR support
- Persistent language preferences

### 6. Enhanced Language Switcher (`src/components/EnhancedLanguageSwitcher.tsx`)

A redesigned language switcher component with:

- Dropdown interface for language selection
- Preloading of language resources on hover
- Responsive design with customizable sizes
- Accessibility improvements

### 7. Language Path Management (`src/utils/languagePath.ts`)

Utilities for managing language in URL paths:

- Support for language prefixes in URLs
- Automatic path localization
- Excludable paths for API endpoints, static assets, etc.
- Redirection to localized paths

## Usage Examples

### Basic Translation

```tsx
import { useTranslation } from '@/utils/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <p>{t('home.hero.subtitle')}</p>
    </div>
  );
}
```

### Handling RTL/LTR

```tsx
import { useLanguageDirection } from '@/utils/languageDirection';

function DirectionalComponent() {
  const { isRTL, dirClass } = useLanguageDirection();
  
  return (
    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={dirClass}>This text will align correctly based on language</div>
    </div>
  );
}
```

### Changing Language

```tsx
import { useLanguage } from '@/components/EnhancedLanguageProvider';

function LanguageControl() {
  const { locale, changeLanguage } = useLanguage();
  
  return (
    <div>
      <p>Current language: {locale}</p>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('ar')}>Arabic</button>
    </div>
  );
}
```

### Creating Localized Links

```tsx
import { useLanguagePath } from '@/utils/languagePath';
import Link from 'next/link';

function LocalizedLinks() {
  const { getLocalizedUrl } = useLanguagePath();
  
  return (
    <nav>
      <Link href={getLocalizedUrl('/')}>Home</Link>
      <Link href={getLocalizedUrl('/about')}>About</Link>
      <Link href={getLocalizedUrl('/contact')}>Contact</Link>
    </nav>
  );
}
```

## Best Practices

1. **Use Type-Safe Translations**: Always use the enhanced `useTranslation` hook for type safety
2. **Handle RTL/LTR Properly**: Use the direction utilities for proper text and layout alignment
3. **Lazy Load Translations**: For large applications, lazy load non-critical language resources
4. **Preload on Hover**: Preload language resources when users hover over language switcher
5. **Use Consistent Path Strategy**: Decide on URL strategy (with or without language prefixes)
6. **Test in Multiple Languages**: Always test UI in both RTL and LTR languages
7. **Update Document Attributes**: Ensure proper `dir` and `lang` attributes on HTML elements
8. **Add Language Classes**: Use language-specific CSS classes for styling overrides

## Migration Guide

To migrate from the old i18n system to this enhanced version:

1. Replace existing `useTranslation` imports with the new type-safe version
2. Replace `LanguageProvider` with `EnhancedLanguageProvider`
3. Replace `LanguageSwitcher` with `EnhancedLanguageSwitcher`
4. Update layout components to use the direction utilities
5. Add language path management where needed
