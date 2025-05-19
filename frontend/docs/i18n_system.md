# Internationalization (i18n) System Documentation

This document provides an overview of the internationalization system implemented in the Caryo Marketplace frontend application.

## Overview

The application supports two languages:
- Arabic (ar) - Default language with RTL support
- English (en) - Alternative language with LTR support

The i18n system is designed to:
- Provide type-safe translation capabilities
- Support RTL/LTR layouts automatically
- Persist language preferences
- Detect user's preferred language

## Key Files

### `src/utils/i18n.ts`

The core i18n configuration file that:
- Initializes the i18n system
- Loads translation resources
- Handles language detection and switching
- Manages language persistence in cookies and localStorage

### `src/utils/useTranslation.ts`

A type-safe translation hook that:
- Provides autocomplete for translation keys
- Ensures type safety for translation lookups
- Checks for translation existence

### `src/utils/direction.ts`

Utilities for handling RTL/LTR layout:
- Detecting if a language is RTL
- Getting direction-aware CSS classes
- Observing direction changes in the document

## Usage Examples

### Basic Translation

```tsx
import { useTranslation } from '@/utils/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('welcome')}</h1>;
}
```

### Translations with Variables

```tsx
import { useTranslation } from '@/utils/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return <p>{t('greeting', { name: 'John' })}</p>;
}
```

### Changing the Language

```tsx
import { useTranslation } from '@/utils/useTranslation';
import { LANGUAGES } from '@/utils/i18n';

function LanguageSwitcher() {
  const { t, language, changeLanguage } = useTranslation();
  
  return (
    <button onClick={() => changeLanguage(language === LANGUAGES.AR ? LANGUAGES.EN : LANGUAGES.AR)}>
      {t('switchLanguage')}
    </button>
  );
}
```

### Direction-Aware Styling

```tsx
import { useDirection } from '@/utils/direction';

function DirectionalComponent() {
  const { isRTL, getClasses } = useDirection();
  
  return (
    <div className={getClasses(
      'base-classes', 
      'ltr-specific-classes', 
      'rtl-specific-classes'
    )}>
      {isRTL ? 'RTL Content' : 'LTR Content'}
    </div>
  );
}
```

## Translation File Structure

Translation files are located in:
```
/public/locales/{language}/common.json
```

For example:
```json
// English translations
{
  "common": {
    "welcome": "Welcome"
  }
}

// Arabic translations
{
  "common": {
    "welcome": "مرحباً"
  }
}
```

## Best Practices

1. **Use the type-safe hook**: Always use the `useTranslation` hook from `@/utils/useTranslation.ts` for better type safety and autocompletion.

2. **Semantic key structure**: Organize translation keys by feature or component, e.g., `auth.login.title`, `listings.filter.price`.

3. **Handle RTL/LTR properly**: Use the direction utilities to ensure your UI adapts correctly to both reading directions.

4. **Placeholder variables**: Use placeholders like `{{variable}}` in translations rather than concatenating strings.

5. **Currency and dates**: Use Intl API for formatting currency, dates, and numbers according to the user's locale.

6. **Default text**: Always provide a default text in English in your components as a fallback.

7. **Translation context**: Add comments in translation files to provide context for translators.

8. **Missing translations**: Handle missing translations gracefully by checking for translation existence with `hasTranslation`.

## Adding New Languages

To add a new language:

1. Create a new translation file in `/public/locales/{language}/common.json`
2. Update the `LANGUAGES` constant in `src/utils/i18n.ts`
3. Update language selection UI in the appropriate components

## Translation Management

For larger projects, consider implementing a translation management system or service like Lokalise, Crowdin, or Phrase to streamline the translation workflow and collaboration with translators.
