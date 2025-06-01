/**
 * Script to flatten all translation files in the project
 * This converts nested keys to flat dot-notation keys
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { flattenTranslation } from './flattenTranslations.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const LOCALES_DIR = path.join(__dirname, '..', 'public', 'locales');
const SUPPORTED_LANGUAGES = ['en', 'ar'];

// Process a single translation file
function processTranslationFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    // Flatten the structure
    const flattened = flattenTranslation(translations);
    
    // Sort keys alphabetically for better maintainability
    const sortedFlattened = Object.fromEntries(
      Object.entries(flattened).sort(([a], [b]) => a.localeCompare(b))
    );
    
    // Create a backup of the original file
    const backupPath = `${filePath}.backup`;
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log(`Backup created: ${backupPath}`);
    
    // Write the flattened version
    fs.writeFileSync(
      filePath, 
      JSON.stringify(sortedFlattened, null, 2), 
      'utf8'
    );
    console.log(`Successfully flattened: ${filePath}`);
    
    return {
      original: Object.keys(translations).length,
      flattened: Object.keys(flattened).length
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return null;
  }
}

// Process all translation files for a language
function processLanguage(lang) {
  const langDir = path.join(LOCALES_DIR, lang);
  
  // Ensure the directory exists
  if (!fs.existsSync(langDir)) {
    console.error(`Language directory not found: ${langDir}`);
    return;
  }
  
  // Get all JSON files
  const files = fs.readdirSync(langDir)
    .filter(file => file.endsWith('.json') && file !== 'common.json'); // Skip common.json
  
  console.log(`\nProcessing ${files.length} files for ${lang}... (excluding common.json)`);
  
  // Process each file
  let totalOriginalKeys = 0;
  let totalFlattenedKeys = 0;
  
  files.forEach(file => {
    const filePath = path.join(langDir, file);
    const stats = processTranslationFile(filePath);
    
    if (stats) {
      totalOriginalKeys += stats.original;
      totalFlattenedKeys += stats.flattened;
    }
  });
  
  console.log(`\nSummary for ${lang}:`);
  console.log(`Original object keys: ${totalOriginalKeys}`);
  console.log(`Flattened keys: ${totalFlattenedKeys}`);
  console.log(`Keys increase: ${totalFlattenedKeys - totalOriginalKeys}`);
}

// Main execution
console.log('Starting translation flattening process...');

SUPPORTED_LANGUAGES.forEach(lang => {
  processLanguage(lang);
});

console.log('\nFlattening process completed!');
console.log('Please test your application thoroughly before committing changes.');
console.log('If you encounter any issues, restore from the .backup files.');
