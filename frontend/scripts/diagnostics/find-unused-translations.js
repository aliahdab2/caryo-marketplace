/**
 * Script to find unused translation keys in the codebase
 * 
 * Run with:
 * node scripts/diagnostics/find-unused-translations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.join(__dirname, '../..');
const LOCALES_DIR = path.join(PROJECT_ROOT, 'public/locales');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const NAMESPACES = ['auth', 'common', 'errors']; // Add all your namespaces here
const LANGUAGES = ['en', 'ar']; // Add all your languages here
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

async function getAllFiles(dir, fileList = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      fileList = await getAllFiles(filePath, fileList);
    } else if (EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function findTranslationKeysInCode(files) {
  const pattern = /t\(['"`]([^'"`]+)['"`]/g;
  const keysFound = new Set();

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      // Extract the namespace if key contains namespace
      if (key.includes(':')) {
        const [namespace, actualKey] = key.split(':');
        keysFound.add(`${namespace}:${actualKey}`);
      } else {
        keysFound.add(key);
      }
    }
  }

  return keysFound;
}

async function getTranslationKeys() {
  const allKeys = {};

  for (const lang of LANGUAGES) {
    allKeys[lang] = {};
    
    for (const namespace of NAMESPACES) {
      try {
        const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
        if (fs.existsSync(filePath)) {
          const content = await readFile(filePath, 'utf8');
          const keys = JSON.parse(content);
          allKeys[lang][namespace] = keys;
        } else {
          console.warn(`Translation file not found: ${filePath}`);
          allKeys[lang][namespace] = {};
        }
      } catch (error) {
        console.error(`Error reading translation file: ${error.message}`);
        allKeys[lang][namespace] = {};
      }
    }
  }

  return allKeys;
}

async function findUnusedTranslations() {
  console.log('Scanning files for translation keys...');
  const files = await getAllFiles(SRC_DIR);
  console.log(`Found ${files.length} files to scan.`);

  const keysInCode = await findTranslationKeysInCode(files);
  console.log(`Found ${keysInCode.size} translation keys used in code.`);

  const translationKeys = await getTranslationKeys();
  
  // Flatten translation keys from all namespaces for each language
  const unusedKeys = {};
  
  for (const lang of LANGUAGES) {
    unusedKeys[lang] = {};
    
    for (const namespace of NAMESPACES) {
      const keysInNamespace = translationKeys[lang][namespace] || {};
      unusedKeys[lang][namespace] = [];
      
      // Check if each key in the translation file is used in the code
      for (const key of Object.keys(keysInNamespace)) {
        const fullKey = `${namespace}:${key}`;
        // Check if key is used directly or with namespace
        if (!keysInCode.has(key) && !keysInCode.has(fullKey)) {
          unusedKeys[lang][namespace].push(key);
        }
      }
    }
  }

  console.log('\n--- Unused Translation Keys ---');
  let hasUnusedKeys = false;
  
  for (const lang of LANGUAGES) {
    for (const namespace of NAMESPACES) {
      const unusedInNamespace = unusedKeys[lang][namespace];
      if (unusedInNamespace.length > 0) {
        hasUnusedKeys = true;
        console.log(`\n${lang}/${namespace}.json (${unusedInNamespace.length} unused keys):`);
        unusedInNamespace.forEach(key => {
          console.log(`  - "${key}": "${translationKeys[lang][namespace][key]}"`);
        });
      }
    }
  }
  
  if (!hasUnusedKeys) {
    console.log('No unused translation keys found. Great job!');
  }
}

findUnusedTranslations().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
