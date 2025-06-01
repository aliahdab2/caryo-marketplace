# Translation Management Scripts

This directory contains utility scripts for managing translations in the Caryo Marketplace application.

## Available Scripts

### Translation Flattening

These scripts help convert nested translation structures to flat key-value pairs, following the recommendations in the [Translation Guide for Developers](../../docs/translation_guide_for_developers.md).

- **`flattenTranslations.js`**: Core utility function that converts nested objects to flat keys
- **`flattenCommonJson.js`**: Flattens just the common.json files (English and Arabic)
- **`flattenAllTranslations.js`**: Comprehensive script to flatten all translation files

## Usage

```bash
# To flatten just the common.json files (recommended first step)
node scripts/flattenCommonJson.js

# To flatten all translation files (once common.json is verified)
node scripts/flattenAllTranslations.js
```

## Documentation

For detailed information about the translation flattening process, see:
- [Translation Flattening Guide](../docs/translation_flattening.md)
- [Translation Guide for Developers](../../docs/translation_guide_for_developers.md)
