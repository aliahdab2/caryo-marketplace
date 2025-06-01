/**
 * Flattens a nested object structure into a flat key-value structure.
 * Example: { auth: { signin: 'Sign In' } } becomes { 'auth.signin': 'Sign In' }
 * 
 * @param {Object} nestedObj The nested object to flatten
 * @param {string} prefix Current prefix for the flattened keys (used in recursion)
 * @returns {Object} A flattened object with dot-notation keys
 */
export function flattenTranslation(nestedObj, prefix = '') {
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
