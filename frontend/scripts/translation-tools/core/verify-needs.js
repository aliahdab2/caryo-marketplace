#!/usr/bin/env node

/**
 * 🎯 Translation Needs Verifier - Enhanced Version
 *
 * Advanced tool to verify incomplete translations are actually needed in source code.
 * Provides detailed analysis, caching, and export capabilities.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceDir: './src',
  localesDir: './public/locales',
  cacheFile: './.translation-cache.json',
  exportFile: './translation-needs-analysis.json',
  namespaces: ['auth', 'common', 'contact', 'dashboard', 'errors', 'favorites', 'home', 'listings', 'mediaGallery', 'messages', 'search', 'translation'],
  excludeDirs: ['node_modules', 'coverage', 'dist', 'build', '__tests__', '.next', '.git', '.vscode'],
  excludeFiles: ['.test.', '.spec.', '.d.ts', '.config.js', '.min.js']
};

// Statistics tracking
const stats = {
  startTime: Date.now(),
  filesScanned: 0,
  keysFound: 0,
  enMissing: 0,
  arMissing: 0,
  needed: 0,
  unneeded: 0
};

function showBanner() {
  console.log('🎯 TRANSLATION NEEDS VERIFIER - ENHANCED');
  console.log('========================================');
  console.log('Cross-referencing incomplete translations with source code usage\n');
}

function loadCache() {
  try {
    if (fs.existsSync(CONFIG.cacheFile)) {
      const cacheData = JSON.parse(fs.readFileSync(CONFIG.cacheFile, 'utf8'));
      const cacheAge = Date.now() - cacheData.timestamp;
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (cacheAge < maxAge) {
        console.log('📋 Using cached results (age: ' + Math.round(cacheAge / 1000) + 's)');
        return cacheData;
      }
    }
  } catch (error) {
    // Cache invalid, continue with fresh scan
  }
  return null;
}

function saveCache(data) {
  try {
    const cacheData = {
      timestamp: Date.now(),
      neededIncomplete: {
        enMissing: Array.from(data.neededIncomplete.enMissing),
        arMissing: Array.from(data.neededIncomplete.arMissing)
      },
      incompleteTranslations: {
        enMissing: Array.from(data.incompleteTranslations.enMissing),
        arMissing: Array.from(data.incompleteTranslations.arMissing),
        totalIncomplete: data.incompleteTranslations.totalIncomplete
      },
      stats: data.stats
    };
    fs.writeFileSync(CONFIG.cacheFile, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    // Non-critical, continue
  }
}

function scanSourceFiles(dirPath, usedKeys = new Set()) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemStats = fs.statSync(itemPath);

      if (itemStats.isDirectory()) {
        if (!item.startsWith('.') && !CONFIG.excludeDirs.includes(item)) {
          scanSourceFiles(itemPath, usedKeys);
        }
      } else if (itemStats.isFile()) {
        const shouldProcess = (
          (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx')) &&
          !CONFIG.excludeFiles.some(pattern => item.includes(pattern))
        );

        if (shouldProcess) {
          try {
            const content = fs.readFileSync(itemPath, 'utf8');
            const keysFound = extractTranslationKeys(content);
            keysFound.forEach(key => usedKeys.add(key));
            stats.filesScanned++;
            stats.keysFound += keysFound.length;
          } catch (error) {
            console.warn(`⚠️  Could not read ${item}: ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not scan directory ${dirPath}: ${error.message}`);
  }

  return usedKeys;
}

function extractTranslationKeys(content) {
  const keys = new Set();

  // Enhanced regex patterns for better detection
  const patterns = [
    /t\(['"]([^'"]+)['"]/g,                    // t('key')
    /t\(['"]([^'"]+)['"],\s*\{/g,             // t('key', {options})
    /t\(['"]([^'"]+)['"]\s*,\s*['"]/g,        // t('key', 'fallback')
    /i18n\.t\(['"]([^'"]+)['"]/g,             // i18n.t('key')
    /useTranslation\(['"]([^'"]+)['"]/g,      // useTranslation('namespace')
    /\bt\(['"]([^'"]+)['"]/g,                 // word boundary t(
    /\bt\(['"]([^'"]+)['"]\s*,/g,             // word boundary t( with params
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1].trim();
      if (key) keys.add(key);
    }
  });

  return Array.from(keys);
}

/**
 * Recursively get all keys from a nested object
 * @param {object} obj - The object to traverse
 * @param {string} prefix - Current key prefix
 * @returns {Map} - Map of key -> value
 */
function getAllKeys(obj, prefix = '') {
  const keys = new Map();

  function traverse(current, currentPath) {
    if (typeof current === 'object' && current !== null) {
      Object.keys(current).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        if (typeof current[key] === 'object' && current[key] !== null) {
          traverse(current[key], newPath);
        } else {
          keys.set(newPath, current[key]);
        }
      });
    }
  }

  traverse(obj, prefix);
  return keys;
}

/**
 * Get nested value from object using dot notation
 * @param {object} obj - The object to search
 * @param {string} path - Dot notation path (e.g., "listings.removeFromFavorites")
 * @returns {*} - The value or undefined if not found
 */
function getNestedValue(obj, keyPath) {
  // First try direct key lookup (handles flat keys with dots like "form.button.send")
  if (obj[keyPath] !== undefined) {
    return obj[keyPath];
  }
  // Then try nested traversal (handles actual nested objects)
  return keyPath.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function analyzeIncompleteTranslations() {
  const incompleteTranslations = {
    enMissing: new Map(),
    arMissing: new Map(),
    totalIncomplete: 0
  };

  CONFIG.namespaces.forEach(namespace => {
    const enFile = path.join(CONFIG.localesDir, 'en', `${namespace}.json`);
    const arFile = path.join(CONFIG.localesDir, 'ar', `${namespace}.json`);

    if (fs.existsSync(enFile) && fs.existsSync(arFile)) {
      try {
        const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
        const arData = JSON.parse(fs.readFileSync(arFile, 'utf8'));

        // Get all unique keys including nested keys (no namespace prefix — keys must
        // match the structure inside the JSON file so getNestedValue works correctly)
        const enKeys = getAllKeys(enData);
        const arKeys = getAllKeys(arData);
        const allKeys = new Set([...enKeys.keys(), ...arKeys.keys()]);

        allKeys.forEach(fullKey => {
          const enValue = getNestedValue(enData, fullKey);
          const arValue = getNestedValue(arData, fullKey);

          if (enValue === undefined) {
            incompleteTranslations.enMissing.set(`${namespace}:${fullKey}`, {
              key: fullKey,
              namespace,
              enValue: null,
              arValue,
              context: `${namespace}.json`
            });
          }
          if (arValue === undefined) {
            incompleteTranslations.arMissing.set(`${namespace}:${fullKey}`, {
              key: fullKey,
              namespace,
              enValue,
              arValue: null,
              context: `${namespace}.json`
            });
          }
        });
      } catch (error) {
        console.warn(`⚠️  Error processing ${namespace}: ${error.message}`);
      }
    }
  });

  incompleteTranslations.totalIncomplete = incompleteTranslations.enMissing.size + incompleteTranslations.arMissing.size;
  stats.enMissing = incompleteTranslations.enMissing.size;
  stats.arMissing = incompleteTranslations.arMissing.size;

  return incompleteTranslations;
}

function crossReferenceUsage(usedKeys, incompleteTranslations) {
  const neededIncomplete = {
    enMissing: new Map(),
    arMissing: new Map()
  };

  // Check EN missing translations
  incompleteTranslations.enMissing.forEach((details, fullKey) => {
    const keyWithoutNamespace = details.key;
    const keyWithNamespace = `${details.namespace}:${details.key}`;

    if (usedKeys.has(keyWithNamespace) || usedKeys.has(keyWithoutNamespace)) {
      neededIncomplete.enMissing.set(fullKey, { ...details, used: true });
      stats.needed++;
    } else {
      stats.unneeded++;
    }
  });

  // Check AR missing translations
  incompleteTranslations.arMissing.forEach((details, fullKey) => {
    const keyWithoutNamespace = details.key;
    const keyWithNamespace = `${details.namespace}:${details.key}`;

    if (usedKeys.has(keyWithNamespace) || usedKeys.has(keyWithoutNamespace)) {
      neededIncomplete.arMissing.set(fullKey, { ...details, used: true });
      stats.needed++;
    } else {
      stats.unneeded++;
    }
  });

  return neededIncomplete;
}

function displayResults(neededIncomplete, incompleteTranslations) {
  console.log('\n🎯 ANALYSIS RESULTS:');
  console.log('===================');
  console.log(`📊 Files scanned: ${stats.filesScanned}`);
  console.log(`🔑 Keys found in code: ${stats.keysFound}`);
  console.log(`⏱️  Analysis time: ${Date.now() - stats.startTime}ms`);
  console.log('');

  if (incompleteTranslations.totalIncomplete === 0) {
    console.log('🎉 All translations are complete! Nothing to verify.');
    return;
  }

  const neededPercentage = ((stats.needed / incompleteTranslations.totalIncomplete) * 100).toFixed(1);

  console.log('INCOMPLETE TRANSLATIONS THAT ARE ACTUALLY NEEDED:');
  console.log('=================================================');

  // Display EN missing
  if (neededIncomplete.enMissing.size > 0) {
    console.log(`\n🇺🇸 EN Missing (${neededIncomplete.enMissing.size} needed):`);
    console.log('─'.repeat(50));

    Array.from(neededIncomplete.enMissing.entries()).slice(0, 8).forEach(([fullKey, details]) => {
      console.log(`  ✅ ${fullKey}`);
      console.log(`     AR value: "${details.arValue}"`);
    });

    if (neededIncomplete.enMissing.size > 8) {
      console.log(`  ... and ${neededIncomplete.enMissing.size - 8} more`);
    }
  }

  // Display AR missing
  if (neededIncomplete.arMissing.size > 0) {
    console.log(`\n🇸🇦 AR Missing (${neededIncomplete.arMissing.size} needed):`);
    console.log('─'.repeat(50));

    Array.from(neededIncomplete.arMissing.entries()).slice(0, 8).forEach(([fullKey, details]) => {
      console.log(`  ✅ ${fullKey}`);
      console.log(`     EN value: "${details.enValue}"`);
    });

    if (neededIncomplete.arMissing.size > 8) {
      console.log(`  ... and ${neededIncomplete.arMissing.size - 8} more`);
    }
  }

  if (neededIncomplete.enMissing.size === 0 && neededIncomplete.arMissing.size === 0) {
    console.log('\nNo needed incomplete translations found.');
  }

  console.log('\n📊 SUMMARY:');
  console.log('===========');
  console.log(`Total incomplete translations: ${incompleteTranslations.totalIncomplete}`);
  console.log(`Actually needed: ${stats.needed} (${neededPercentage}%)`);
  console.log(`Potentially unnecessary: ${stats.unneeded} (${(100 - parseFloat(neededPercentage)).toFixed(1)}%)`);

  if (incompleteTranslations.totalIncomplete > 0 && stats.needed === incompleteTranslations.totalIncomplete) {
    console.log('\n🎉 PERFECT! All incomplete translations are actually used in the code!');
  } else if (stats.unneeded > 0) {
    console.log('\n💡 RECOMMENDATION:');
    console.log('==================');
    console.log(`${stats.unneeded} incomplete translations appear to be unused.`);
    console.log('Consider cleaning these up with: npm run translation:orphaned-safe');
  }
}

function exportResults(neededIncomplete, incompleteTranslations) {
  const exportData = {
    generatedAt: new Date().toISOString(),
    analysis: {
      filesScanned: stats.filesScanned,
      keysFound: stats.keysFound,
      analysisTime: Date.now() - stats.startTime,
      totalIncomplete: incompleteTranslations.totalIncomplete,
      needed: stats.needed,
      unneeded: stats.unneeded,
      neededPercentage: ((stats.needed / incompleteTranslations.totalIncomplete) * 100).toFixed(1)
    },
    neededTranslations: {
      enMissing: Array.from(neededIncomplete.enMissing).map(([key, details]) => ({
        key,
        namespace: details.namespace,
        arValue: details.arValue,
        priority: 'high'
      })),
      arMissing: Array.from(neededIncomplete.arMissing).map(([key, details]) => ({
        key,
        namespace: details.namespace,
        enValue: details.enValue,
        priority: 'high'
      }))
    }
  };

  fs.writeFileSync(CONFIG.exportFile, JSON.stringify(exportData, null, 2));
  console.log(`\n💾 Results exported to: ${CONFIG.exportFile}`);
}

// Main execution
async function main() {
  showBanner();

  // Try to load from cache first
  let cachedData = loadCache();

  if (cachedData) {
    // Use cached data - reconstruct Maps from arrays
    const neededIncomplete = {
      enMissing: new Map(cachedData.neededIncomplete.enMissing),
      arMissing: new Map(cachedData.neededIncomplete.arMissing)
    };
    const incompleteTranslations = {
      enMissing: new Map(cachedData.incompleteTranslations.enMissing),
      arMissing: new Map(cachedData.incompleteTranslations.arMissing),
      totalIncomplete: cachedData.incompleteTranslations.totalIncomplete
    };
    Object.assign(stats, cachedData.stats);

    displayResults(neededIncomplete, incompleteTranslations);
  } else {
    // Fresh analysis
    console.log('🔍 Step 1: Scanning source code for translation usage...');
    const usedKeys = scanSourceFiles(CONFIG.sourceDir);
    console.log(`✅ Found ${usedKeys.size} unique keys used in ${stats.filesScanned} files\n`);

    console.log('🔍 Step 2: Analyzing incomplete translations...');
    const incompleteTranslations = analyzeIncompleteTranslations();
    console.log(`✅ Found ${stats.enMissing} EN missing, ${stats.arMissing} AR missing`);
    console.log(`✅ Total incomplete: ${incompleteTranslations.totalIncomplete}\n`);

    console.log('🔍 Step 3: Cross-referencing with source code usage...');
    const neededIncomplete = crossReferenceUsage(usedKeys, incompleteTranslations);

    // Cache the results
    saveCache({
      neededIncomplete,
      incompleteTranslations,
      stats
    });

    displayResults(neededIncomplete, incompleteTranslations);
  }

  // Export results
  if (fs.existsSync(CONFIG.cacheFile)) {
    try {
      const cacheData = JSON.parse(fs.readFileSync(CONFIG.cacheFile, 'utf8'));
      const incompleteTranslations = cacheData.incompleteTranslations;
      const neededIncomplete = cacheData.neededIncomplete;
      exportResults(neededIncomplete, incompleteTranslations);
    } catch (error) {
      console.warn('⚠️  Could not export results:', error.message);
    }
  }

  console.log('\n✅ Verification complete!');
  console.log('💡 Tip: Results cached for 5 minutes. Run with --force to refresh.');
}

// CLI interface
if (require.main === module) {
  // Handle command line arguments
  if (process.argv.includes('--force')) {
    if (fs.existsSync(CONFIG.cacheFile)) {
      fs.unlinkSync(CONFIG.cacheFile);
    }
  }

  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
