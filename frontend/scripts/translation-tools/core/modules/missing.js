/**
 * Translation Missing Keys Module
 * Handles detection of missing translation keys
 */

const fs = require('fs');
const path = require('path');
const { LOCALES_DIR, LANGUAGES, NAMESPACES } = require('./loader');
const { trackPerformance, getCached } = require('./utils');

/**
 * Find missing translations across languages
 */
function findMissingTranslations(translations) {
  return trackPerformance('Finding missing translations', () => {
    return getCached('missing-translations', () => {
      console.log('🔍 Analyzing translation completeness...');

      const allKeys = new Set();
      const missingByLanguage = {};
      const completenessStats = {};

      // Initialize data structures
      LANGUAGES.forEach(lang => {
        missingByLanguage[lang] = {};
        completenessStats[lang] = { total: 0, translated: 0, missing: 0 };
      });

      // Collect all unique keys
      LANGUAGES.forEach(language => {
        NAMESPACES.forEach(namespace => {
          const namespaceData = translations[language][namespace];
          if (namespaceData && typeof namespaceData === 'object') {
            Object.keys(namespaceData).forEach(key => {
              allKeys.add(`${namespace}:${key}`);
            });
          }
        });
      });

      // Check each language for missing keys
      LANGUAGES.forEach(language => {
        NAMESPACES.forEach(namespace => {
          const namespaceData = translations[language][namespace];
          const missingKeys = [];

          allKeys.forEach(fullKey => {
            const [keyNamespace, key] = fullKey.split(':');
            if (keyNamespace === namespace) {
              if (!namespaceData || !namespaceData[key]) {
                missingKeys.push(key);
              }
            }
          });

          if (missingKeys.length > 0) {
            missingByLanguage[language][namespace] = missingKeys;
            completenessStats[language].missing += missingKeys.length;
          }

          // Count total keys for this namespace
          const namespaceKeys = Array.from(allKeys).filter(k => k.startsWith(`${namespace}:`));
          completenessStats[language].total += namespaceKeys.length;

          // Count translated keys
          if (namespaceData && typeof namespaceData === 'object') {
            completenessStats[language].translated += Object.keys(namespaceData).length;
          }
        });
      });

      return {
        missingByLanguage,
        completenessStats,
        totalUniqueKeys: allKeys.size
      };
    });
  });
}

/**
 * Find orphaned translations (keys that exist but aren't used in code)
 */
function findOrphanedTranslations(translations) {
  return trackPerformance('Finding orphaned translations', () => {
    return getCached('orphaned-translations', () => {
      console.log('🔍 Scanning source files for translation usage...');

      const srcDir = path.resolve(__dirname, '..', '..', '..', '..', 'src');
      const usedKeys = new Map();
      const orphanedByLanguage = {};

      // Initialize data structures
      LANGUAGES.forEach(lang => {
        orphanedByLanguage[lang] = {};
      });

      // Scan source files for translation usage
      function scanDirectory(dirPath) {
        try {
          const items = fs.readdirSync(dirPath);

          items.forEach(item => {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory() && !item.startsWith('.') &&
                item !== 'node_modules' && item !== 'coverage' &&
                item !== 'dist' && item !== 'build' && item !== '__tests__' &&
                item !== '.next' && item !== '.git') {
              scanDirectory(itemPath);
            } else if (stats.isFile() &&
                       (item.endsWith('.js') || item.endsWith('.jsx') ||
                        item.endsWith('.ts') || item.endsWith('.tsx')) &&
                       !item.includes('.test.') && !item.includes('.spec.') &&
                       !item.includes('.d.ts') && !item.endsWith('.config.js')) {
              const content = fs.readFileSync(itemPath, 'utf8');
              const keysInFile = extractTranslationKeys(content, itemPath);

              keysInFile.forEach(key => {
                if (!usedKeys.has(key)) {
                  usedKeys.set(key, []);
                }
                usedKeys.get(key).push(itemPath);
              });
            }
          });
        } catch (error) {
          console.warn(`⚠️  Could not scan directory: ${dirPath}`);
        }
      }

      scanDirectory(srcDir);

      // Find orphaned keys
      LANGUAGES.forEach(language => {
        NAMESPACES.forEach(namespace => {
          const namespaceData = translations[language][namespace];
          const orphanedKeys = [];

          if (namespaceData && typeof namespaceData === 'object') {
            Object.keys(namespaceData).forEach(key => {
              if (!usedKeys.has(key)) {
                orphanedKeys.push(key);
              }
            });
          }

          if (orphanedKeys.length > 0) {
            orphanedByLanguage[language][namespace] = orphanedKeys;
          }
        });
      });

      return {
        orphanedByLanguage,
        usedKeysCount: usedKeys.size,
        totalFilesScanned: Array.from(usedKeys.values()).reduce((sum, files) => sum + files.length, 0)
      };
    });
  });
}

/**
 * Extract translation keys from source code
 * Enhanced to detect more usage patterns
 */
function extractTranslationKeys(content, filePath) {
  const patterns = [
    // Standard t() function calls
    /t\(['"]([^'"]+)['"]/g,  // t('key')
    /t\(['"]([^'"]+)['"],/g, // t('key', ...)
    /t\(['"]([^'"]+)['"]\s*,/g, // t('key', fallback)
    /\bt\(['"]([^'"]+)['"]/g, // word boundary for t(
    /\bt\(['"]([^'"]+)['"]\s*,/g, // word boundary for t( with fallback

    // i18n patterns
    /i18n\.t\(['"]([^'"]+)['"]/g, // i18n.t('key')
    /useTranslation\(['"]([^'"]+)['"]/g, // useTranslation('namespace')

    // Helper function patterns (getTranslation, translate, etc.)
    /getTranslation\(['"]([^'"]+)['"]/g, // getTranslation('key', ...)
    /translate\(['"]([^'"]+)['"]/g, // translate('key')
    /getMessage\(['"]([^'"]+)['"]/g, // getMessage('key')

    // Template literal patterns with known prefixes
    /t\([`'"]([a-zA-Z]+:[a-zA-Z_]+)[`'"]/g, // t('namespace:key')

    // JSX/TSX attribute patterns
    /label=\{t\(['"]([^'"]+)['"]/g, // label={t('key')}
    /title=\{t\(['"]([^'"]+)['"]/g, // title={t('key')}
    /placeholder=\{t\(['"]([^'"]+)['"]/g, // placeholder={t('key')}
    /aria-label=\{[^}]*['"]([^'"]+)['"]/g, // aria-label patterns

    // Object key patterns for translation objects
    /['"]([a-zA-Z_]+)['"]\s*:\s*t\(/g, // 'key': t(

    // String literals that look like translation keys (namespace:key pattern)
    /['"]([a-zA-Z]+:[a-zA-Z][a-zA-Z0-9_]+)['"]/g, // 'namespace:key'

    // Dot notation patterns (namespace.key)
    /t\(['"]([a-zA-Z]+\.[a-zA-Z][a-zA-Z0-9_.]+)['"]/g, // t('namespace.key')
    /['"]([a-zA-Z]+\.[a-zA-Z][a-zA-Z0-9_.]+)['"]/g, // 'namespace.key' string literals

    // Template literal patterns with namespace variable
    /t\(`\$\{[^}]+\}:([a-zA-Z][a-zA-Z0-9_]+)`/g, // t(`${namespace}:key`)
    /t\(`\$\{[^}]+\}\.([a-zA-Z][a-zA-Z0-9_]+)`/g, // t(`${namespace}.key`)

    // Direct key references in object literals (common in tests)
    /['"]([a-zA-Z][a-zA-Z0-9_]+)['"]\s*:/g, // 'someKey':
  ];

  const keys = new Set();

  patterns.forEach(pattern => {
    let match;
    // Reset lastIndex to ensure consistent matching
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      // Add the key
      keys.add(key);

      // If key has namespace prefix (e.g., 'auth:loginTitle'), also add just the key part
      if (key.includes(':')) {
        const keyPart = key.split(':')[1];
        if (keyPart) {
          keys.add(keyPart);
        }
      }

      // If key has dot notation (e.g., 'listings.expiresIn'), also add just the key part
      if (key.includes('.')) {
        const keyPart = key.split('.').pop();
        if (keyPart) {
          keys.add(keyPart);
        }
      }
    }
  });

  // Detect dynamic t() calls and resolve array values
  extractDynamicKeys(content, filePath).forEach(key => keys.add(key));

  return Array.from(keys);
}

/**
 * Detect dynamic t(variable) calls and resolve to concrete keys
 * by tracing the variable back to array/object definitions.
 *
 * Handles:
 *   ARRAY.map(v => t(v))           — simple array iteration
 *   ARRAY.map(v => t(v.prop))      — object array with property access
 *   for (const v of ARRAY) t(v)    — for...of loops
 */
function extractDynamicKeys(content, filePath) {
  const keys = new Set();

  // 1. Find t(variable) and t(variable.property) where arg is NOT a string literal
  const dynamicCalls = [];
  const dynamicRegex = /\bt\(([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?\s*[,)]/g;
  let m;
  while ((m = dynamicRegex.exec(content)) !== null) {
    const fullMatch = content.slice(m.index, m.index + m[0].length);
    // Skip if the argument starts with a quote (already a literal)
    if (/\bt\(\s*['"`]/.test(fullMatch)) continue;
    // Skip common non-translation variables
    if (['key', 'value', 'err', 'error', 'e', 'i', 'j', 'k', 'n', 'cb', 'fn', 'res', 'req', 'props', 'children', 'ref', 'event', 'ev'].includes(m[1])) continue;
    dynamicCalls.push({ varName: m[1], property: m[2] || null });
  }

  if (dynamicCalls.length === 0) return keys;

  dynamicCalls.forEach(({ varName, property }) => {
    // 2. Find the source array for this variable via iteration patterns
    const arrayNames = findSourceArrays(content, varName);

    arrayNames.forEach(arrayName => {
      // 3. Extract values from the array definition (local or imported)
      const values = resolveArrayValues(content, arrayName, property, filePath);
      values.forEach(v => keys.add(v));
    });
  });

  return keys;
}

/**
 * Find which arrays feed a given variable via iteration.
 * Matches: ARRAY.map(varName =>, ARRAY.forEach(varName =>,
 *          for (const varName of ARRAY), for (let varName of ARRAY)
 */
function findSourceArrays(content, varName) {
  const arrays = new Set();
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // .map(varName => / .forEach(varName => / .filter(varName =>
  const iterRegex = new RegExp(
    '([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\.\\s*(?:map|forEach|filter|flatMap)\\s*\\(\\s*\\(?\\s*' + escaped + '\\b',
    'g'
  );
  let im;
  while ((im = iterRegex.exec(content)) !== null) {
    arrays.add(im[1]);
  }

  // for (const varName of ARRAY) / for (let varName of ARRAY)
  const forOfRegex = new RegExp(
    'for\\s*\\(\\s*(?:const|let|var)\\s+' + escaped + '\\s+of\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)',
    'g'
  );
  while ((im = forOfRegex.exec(content)) !== null) {
    arrays.add(im[1]);
  }

  return Array.from(arrays);
}

/**
 * Resolve an array name to its string literal values.
 * Looks in local definitions first, then follows imports.
 */
function resolveArrayValues(content, arrayName, property, filePath) {
  const values = new Set();

  // Try local definition: const ARRAY = [...]
  const localValues = extractArrayFromContent(content, arrayName, property);
  localValues.forEach(v => values.add(v));

  // If nothing found locally, try to resolve import
  if (values.size === 0 && filePath) {
    const importPath = resolveImportPath(content, arrayName, filePath);
    if (importPath) {
      try {
        const importedContent = fs.readFileSync(importPath, 'utf8');
        const importedValues = extractArrayFromContent(importedContent, arrayName, property);
        importedValues.forEach(v => values.add(v));
      } catch (e) {
        // Imported file not readable — skip silently
      }
    }
  }

  return values;
}

/**
 * Extract string values from an array definition in file content.
 * For simple arrays: const A = ['a', 'b'] → ['a', 'b']
 * For object arrays with property: const A = [{ label: 'x' }] → ['x']
 */
function extractArrayFromContent(content, arrayName, property) {
  const values = new Set();
  const escaped = arrayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match: const ARRAY_NAME = [...] (allow multiline)
  const arrayRegex = new RegExp(
    '(?:const|let|var|export\\s+const)\\s+' + escaped + '\\s*(?::[^=]*)?=\\s*\\[([\\s\\S]*?)\\]',
  );
  const arrayMatch = arrayRegex.exec(content);
  if (!arrayMatch) return values;

  const arrayBody = arrayMatch[1];

  if (property) {
    // Object array: extract values of the specific property
    // Match: property: 'value' or property: "value"
    const propEscaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const propRegex = new RegExp(propEscaped + "\\s*:\\s*['\"]([^'\"]+)['\"]", 'g');
    let pm;
    while ((pm = propRegex.exec(arrayBody)) !== null) {
      values.add(pm[1]);
    }
  } else {
    // Simple string array: extract all string literals
    const strRegex = /['"]([^'"]+)['"]/g;
    let sm;
    while ((sm = strRegex.exec(arrayBody)) !== null) {
      values.add(sm[1]);
    }
  }

  return values;
}

/**
 * Resolve an import path to an absolute file path.
 * Handles: import { NAME } from './path' and require('./path')
 */
function resolveImportPath(content, name, currentFilePath) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // import { NAME } from './path' or import { NAME } from '../path'
  const importRegex = new RegExp(
    "import\\s+\\{[^}]*\\b" + escaped + "\\b[^}]*\\}\\s+from\\s+['\"]([^'\"]+)['\"]"
  );
  const importMatch = importRegex.exec(content);

  // const { NAME } = require('./path')
  const requireRegex = new RegExp(
    "(?:const|let|var)\\s+\\{[^}]*\\b" + escaped + "\\b[^}]*\\}\\s*=\\s*require\\s*\\(['\"]([^'\"]+)['\"]\\)"
  );
  const requireMatch = requireRegex.exec(content);

  const relativePath = (importMatch && importMatch[1]) || (requireMatch && requireMatch[1]);
  if (!relativePath || !relativePath.startsWith('.')) return null;

  const dir = path.dirname(currentFilePath);
  const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];

  for (const ext of extensions) {
    const candidate = path.resolve(dir, relativePath + ext);
    if (fs.existsSync(candidate)) return candidate;
  }

  // Try index file in directory
  for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
    const candidate = path.resolve(dir, relativePath, 'index' + ext);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Generate missing translations export
 */
function exportMissingTranslations(missingData, language) {
  const exportData = {};

  if (missingData.missingByLanguage[language]) {
    Object.entries(missingData.missingByLanguage[language]).forEach(([namespace, keys]) => {
      if (keys && keys.length > 0) {
        exportData[namespace] = {};
        keys.forEach(key => {
          exportData[namespace][key] = `[MISSING: ${key}]`;
        });
      }
    });
  }

  return exportData;
}

module.exports = {
  findMissingTranslations,
  findOrphanedTranslations,
  extractTranslationKeys,
  exportMissingTranslations
};
