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

      const srcDir = path.resolve(__dirname, '..', '..', '..', 'src');
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

            if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
              scanDirectory(itemPath);
            } else if (stats.isFile() && (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx'))) {
              const content = fs.readFileSync(itemPath, 'utf8');
              const keysInFile = extractTranslationKeys(content);

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
 */
function extractTranslationKeys(content) {
  const patterns = [
    /t\(['"]([^'"]+)['"]/g,  // t('key')
    /t\(['"]([^'"]+)['"],/g, // t('key', ...)
    /i18n\.t\(['"]([^'"]+)['"]/g, // i18n.t('key')
    /useTranslation\(['"]([^'"]+)['"]/g, // useTranslation('namespace')
  ];

  const keys = new Set();

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      keys.add(match[1]);
    }
  });

  return Array.from(keys);
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
