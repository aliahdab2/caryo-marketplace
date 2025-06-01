/**
 * Demonstration script to flatten the common.json translation file.
 * This shows how the flattening works and the impact on the file structure.
 */

// Function to flatten a nested object structure
function flattenTranslation(nestedObj, prefix = '') {
  const result = {};

  for (const key in nestedObj) {
    const value = nestedObj[key];
    
    // Generate the new key with prefix if needed
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    // If the value is an object and not an array or null, recurse
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Merge the result of flattening the nested object
      Object.assign(result, flattenTranslation(value, newKey));
    } else {
      // Otherwise, add the leaf value directly
      result[newKey] = value;
    }
  }
  
  return result;
}

// Read the current common.json
async function flattenCommonJson() {
  try {
    // Create flattened versions of common.json for both languages
    await flattenFile('en');
    await flattenFile('ar');
    console.log('Flattening completed successfully!');
  } catch (error) {
    console.error('Error flattening files:', error);
  }
}

async function flattenFile(lang) {
  // Import the file system module dynamically
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const filePath = path.default.join(process.cwd(), 'frontend', 'public', 'locales', lang, 'common.json');
  
  // Read the file
  const fileContent = await fs.default.readFile(filePath, 'utf8');
  const translations = JSON.parse(fileContent);
  
  // Flatten the translations
  const flattened = flattenTranslation(translations);
  
  // Create a backup
  const backupPath = filePath.replace('.json', '.backup.json');
  await fs.default.writeFile(backupPath, fileContent, 'utf8');
  
  // Write the flattened file
  await fs.default.writeFile(
    filePath, 
    JSON.stringify(flattened, null, 2), 
    'utf8'
  );
  
  console.log(`Successfully flattened ${lang}/common.json`);
  console.log(`Original keys: ${Object.keys(translations).length}`);
  console.log(`Flattened keys: ${Object.keys(flattened).length}`);
}

// Execute the script
flattenCommonJson();
