/**
 * Translation Utilities Module
 * Common utilities for caching, performance tracking, and helpers
 */

const fs = require('fs');
const path = require('path');

// Cache management
const cache = new Map();
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Cached function execution
 */
function getCached(key, fn) {
  // Make cache keys environment-specific to avoid test/prod conflicts
  const envKey = `${process.env.NODE_ENV || 'production'}:${key}`;
  const cached = cache.get(envKey);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TIMEOUT) {
    return cached.data;
  }

  const result = fn();
  cache.set(envKey, { data: result, timestamp: Date.now() });
  return result;
}

/**
 * Clear all cached data
 */
function clearCache() {
  cache.clear();
}

/**
 * Performance tracking wrapper
 */
function trackPerformance(label, fn) {
  const startTime = Date.now();
  try {
    const result = fn();
    const endTime = Date.now();
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PERF) {
      console.log(`⏱️  ${label}: ${endTime - startTime}ms`);
    }
    return result;
  } catch (error) {
    const endTime = Date.now();
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PERF) {
      console.log(`⏱️  ${label}: ${endTime - startTime}ms (ERROR)`);
    }
    throw error;
  }
}

/**
 * Validate translation key pattern
 */
function validateKeyPattern(key) {
  // Basic validation - can be extended
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Check for common issues
  if (key.includes(' ')) {
    return false; // Spaces in keys can cause issues
  }

  if (key.startsWith('_') || key.endsWith('_')) {
    return false; // Leading/trailing underscores
  }

  return true;
}

/**
 * Extract translation keys from a string
 */
function extractTranslationKeys(content) {
  const keyPattern = /t\(['"]([^'"]+)['"]/g;
  const keys = [];
  let match;

  while ((match = keyPattern.exec(content)) !== null) {
    keys.push(match[1]);
  }

  return [...new Set(keys)]; // Remove duplicates
}

/**
 * Validate translation keys format
 */
function validateTranslationKeys(keys) {
  const issues = [];

  keys.forEach(key => {
    if (!validateKeyPattern(key)) {
      issues.push({
        key,
        issue: 'Invalid key pattern'
      });
    }
  });

  return issues;
}

/**
 * Safe file operations with error handling
 */
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`⚠️  Could not read file: ${filePath}`);
    return null;
  }
}

function safeWriteFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Could not write file: ${filePath}`, error.message);
    return false;
  }
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get file stats safely
 */
function getFileStats(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (error) {
    return null;
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate timestamp for backups
 */
function generateTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * Deep clone an object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

module.exports = {
  getCached,
  clearCache,
  trackPerformance,
  validateKeyPattern,
  extractTranslationKeys,
  validateTranslationKeys,
  safeReadFile,
  safeWriteFile,
  ensureDirectory,
  getFileStats,
  formatFileSize,
  generateTimestamp,
  deepClone
};
