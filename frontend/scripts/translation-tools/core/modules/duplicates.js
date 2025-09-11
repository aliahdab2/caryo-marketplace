/**
 * Translation Duplicates Module
 * Handles duplicate key detection and safe removal
 */

const fs = require('fs');
const path = require('path');
const { LOCALES_DIR, LANGUAGES, NAMESPACES } = require('./loader');

/**
 * Analyze a file for duplicate keys
 * @param {string} content - File content
 * @param {Object} options - Analysis options
 * @returns {Object} Analysis results
 */
function analyzeFileForDuplicates(content, options = {}) {
  const { includeValues = false } = options;

  const lines = content.split('\n');
  const keyPattern = /^\s*"([^"]+)":/;
  const keyOccurrences = new Map();
  const duplicates = [];

  lines.forEach((line, index) => {
    const match = line.match(keyPattern);
    if (match) {
      const key = match[1];
      const lineNumber = index + 1;

      if (!keyOccurrences.has(key)) {
        keyOccurrences.set(key, {
          occurrences: [],
          values: includeValues ? [] : null
        });
      }

      const keyData = keyOccurrences.get(key);
      keyData.occurrences.push(lineNumber);

      if (includeValues) {
        // Extract value from the line
        const valueMatch = line.match(/:\s*(".*"|[^,]*)/);
        if (valueMatch) {
          keyData.values.push(valueMatch[1].trim());
        }
      }
    }
  });

  // Find keys with multiple occurrences
  keyOccurrences.forEach((data, key) => {
    if (data.occurrences.length > 1) {
      duplicates.push({
        key,
        occurrences: data.occurrences,
        values: data.values,
        count: data.occurrences.length
      });
    }
  });

  return {
    duplicates,
    totalKeys: keyOccurrences.size,
    duplicateKeys: duplicates.length
  };
}

/**
 * Find duplicate keys within the same namespace
 * @param {Object} translations - Translation data object
 * @param {Object} options - Options for duplicate detection
 * @returns {Object} Duplicate analysis results
 */
function findDuplicateKeys(translations, options = {}) {
  const { verbose = true, includeValues = false } = options;

  if (verbose) console.log('🔍 Starting duplicate detection...');

  const results = {
    totalDuplicates: 0,
    duplicatesByFile: {},
    summary: {
      filesWithDuplicates: 0,
      totalDuplicateKeys: 0,
      languagesAffected: new Set()
    }
  };

  LANGUAGES.forEach(language => {
    if (verbose) console.log(`🌍 Processing language: ${language}`);

    NAMESPACES.forEach(namespace => {
      if (verbose) console.log(`📁 Processing namespace: ${namespace}`);

      const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
      const fileKey = `${language}/${namespace}.json`;

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const duplicateAnalysis = analyzeFileForDuplicates(content, { includeValues });

        if (duplicateAnalysis.duplicates.length > 0) {
          results.duplicatesByFile[fileKey] = duplicateAnalysis;
          results.totalDuplicates += duplicateAnalysis.duplicates.length;
          results.summary.filesWithDuplicates++;
          results.summary.totalDuplicateKeys += duplicateAnalysis.duplicates.length;
          results.summary.languagesAffected.add(language);

          if (verbose) {
            console.log(`🚨 Found ${duplicateAnalysis.duplicates.length} duplicates in ${fileKey}`);
            duplicateAnalysis.duplicates.forEach(dup => {
              console.log(`   "${dup.key}": ${dup.occurrences.length} occurrences`);
              if (includeValues) {
                console.log(`   Values: ${dup.values.join(' | ')}`);
              }
            });
          }
        } else if (verbose) {
          console.log(`✅ No duplicates in ${fileKey}`);
        }
      } catch (error) {
        if (verbose) {
          console.log(`⚠️ Could not read file ${fileKey} for duplicate detection: ${error.message}`);
        }
      }

    });
  });

  // Convert Set to Array for JSON serialization
  results.summary.languagesAffected = Array.from(results.summary.languagesAffected);

  if (verbose) {
    console.log(`✅ Duplicate detection completed.`);
    console.log(`📊 Summary: ${results.totalDuplicates} duplicates in ${results.summary.filesWithDuplicates} files`);
  }

  return results;
}

/**
 * Safely remove duplicate keys from translation files
 * Keeps the LAST occurrence of each duplicate key (JSON "last wins" behavior)
 */
function fixDuplicateKeys() {
  console.log('🛠️  Starting safe duplicate key removal...');
  console.log('⚠️  This will create backups and keep the LAST occurrence of each duplicate key\n');

  let totalFilesProcessed = 0;
  let totalDuplicatesRemoved = 0;
  let totalFilesFixed = 0;

  LANGUAGES.forEach(language => {
    NAMESPACES.forEach(namespace => {
      const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);

      try {
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        // Find duplicate keys
        const keyPattern = /^\s*"([^"]+)":/;
        const keyOccurrences = new Map(); // key -> array of line numbers
        const duplicates = new Map(); // key -> array of line numbers (excluding last)

        lines.forEach((line, index) => {
          const match = line.match(keyPattern);
          if (match) {
            const key = match[1];
            if (!keyOccurrences.has(key)) {
              keyOccurrences.set(key, []);
            }
            keyOccurrences.get(key).push(index);
          }
        });

        // Find keys with multiple occurrences
        keyOccurrences.forEach((lineNumbers, key) => {
          if (lineNumbers.length > 1) {
            // Keep the last occurrence, mark others for removal
            const toRemove = lineNumbers.slice(0, -1); // All except last
            duplicates.set(key, toRemove);
          }
        });

        if (duplicates.size === 0) {
          console.log(`✅ ${language}/${namespace}.json: No duplicates found`);
          return;
        }

        // Create backup
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.writeFileSync(backupPath, content);
        console.log(`💾 Created backup: ${path.basename(backupPath)}`);

        // Remove duplicate lines
        const linesToRemove = new Set();
        duplicates.forEach((lineNumbers) => {
          lineNumbers.forEach(lineNum => linesToRemove.add(lineNum));
        });

        // Create new content without duplicate lines
        const newLines = [];
        lines.forEach((line, index) => {
          if (!linesToRemove.has(index)) {
            newLines.push(line);
          }
        });

        const newContent = newLines.join('\n');

        // Validate new JSON
        try {
          JSON.parse(newContent);
        } catch (jsonError) {
          console.error(`❌ JSON validation failed after removing duplicates from ${language}/${namespace}.json`);
          console.error(`   Error: ${jsonError.message}`);
          console.log(`   Original file preserved, backup available at: ${backupPath}`);
          return;
        }

        // Write cleaned content
        fs.writeFileSync(filePath, newContent);

        // Report results
        console.log(`🧹 ${language}/${namespace}.json: Fixed ${duplicates.size} duplicate keys`);
        duplicates.forEach((lineNumbers, key) => {
          console.log(`   • "${key}": removed ${lineNumbers.length} duplicates, kept last occurrence`);
        });

        totalFilesProcessed++;
        totalFilesFixed++;
        totalDuplicatesRemoved += Array.from(duplicates.values()).reduce((sum, arr) => sum + arr.length, 0);

      } catch (error) {
        console.error(`❌ Error processing ${language}/${namespace}.json: ${error.message}`);
      }
    });
  });

  console.log(`\n📊 SUMMARY:`);
  console.log(`   • Files processed: ${totalFilesProcessed}`);
  console.log(`   • Files fixed: ${totalFilesFixed}`);
  console.log(`   • Duplicate keys removed: ${totalDuplicatesRemoved}`);

  if (totalFilesFixed > 0) {
    console.log(`\n✅ Duplicate removal completed successfully!`);
    console.log(`💡 TIP: Backups were created with .backup.{timestamp} extension`);
    console.log(`🔄 Run duplicate detection to verify all duplicates are gone`);
  } else {
    console.log(`\n✅ No duplicates found - all files are clean!`);
  }

  return { totalFilesFixed, totalDuplicatesRemoved };
}

module.exports = {
  findDuplicateKeys,
  fixDuplicateKeys
};
