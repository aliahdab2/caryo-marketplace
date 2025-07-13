/**
 * Enhanced utility functions for building hierarchical brand filtering syntax
 * with improved performance and type safety
 */

export interface BrandModelFilter {
  brandName: string;
  models?: string[];
}

// Cache for built filters to improve performance with LRU eviction
const filterCache = new Map<string, string>();
const MAX_CACHE_SIZE = 1000;

/**
 * Gets an entry from the cache with LRU behavior (moves accessed item to end)
 */
function getCacheEntry(key: string): string | undefined {
  if (!filterCache.has(key)) {
    return undefined;
  }
  
  // Get the value and refresh its position (delete and re-add)
  const value = filterCache.get(key)!;
  filterCache.delete(key);
  filterCache.set(key, value);
  return value;
}
function setCacheEntry(key: string, value: string): void {
  // If key already exists, delete it first to refresh its position
  if (filterCache.has(key)) {
    filterCache.delete(key);
  }
  
  // If cache is at max capacity, remove the oldest entry (first in Map)
  if (filterCache.size >= MAX_CACHE_SIZE) {
    const firstKey = filterCache.keys().next().value;
    if (firstKey) {
      filterCache.delete(firstKey);
    }
  }
  
  // Add new entry (will be most recent)
  filterCache.set(key, value);
}

/**
 * Builds hierarchical brand filter string from brand and model selections with caching
 * @param brandName - The brand name
 * @param modelName - Optional specific model name or semicolon-separated model names
 * @returns Hierarchical filter string for the API
 */
export function buildHierarchicalBrandFilter(brandName: string, modelName?: string): string {
  // Create cache key
  const cacheKey = `${brandName}:${modelName || ''}`;
  
  // Check cache first
  const cachedResult = getCacheEntry(cacheKey);
  if (cachedResult !== undefined) {
    return cachedResult;
  }

  // Validate and sanitize inputs
  const sanitizedBrand = brandName.trim();
  if (!sanitizedBrand) {
    setCacheEntry(cacheKey, '');
    return '';
  }

  const sanitizedModel = modelName?.trim();
  if (!sanitizedModel) {
    setCacheEntry(cacheKey, sanitizedBrand);
    return sanitizedBrand;
  }

  // Clean up model names and remove any empty strings
  const cleanModelNames = sanitizedModel
    .split(';')
    .map(m => m.trim())
    .filter(Boolean);

  if (cleanModelNames.length === 0) {
    setCacheEntry(cacheKey, sanitizedBrand);
    return sanitizedBrand;
  }

  const result = `${sanitizedBrand}:${cleanModelNames.join(';')}`;
  setCacheEntry(cacheKey, result);
  
  return result;
}

/**
 * Enhanced function to build complex hierarchical brand filter string from multiple brand/model combinations
 * @param filters - Array of brand/model combinations
 * @returns Hierarchical filter string for the API
 */
export function buildComplexHierarchicalBrandFilter(filters: BrandModelFilter[]): string {
  if (!filters?.length) {
    return '';
  }

  // Create cache key for complex filters
  const complexCacheKey = JSON.stringify(filters);
  const cachedComplexResult = getCacheEntry(complexCacheKey);
  if (cachedComplexResult !== undefined) {
    return cachedComplexResult;
  }

  const result = filters
    .filter((filter): filter is BrandModelFilter => 
      Boolean(filter?.brandName?.trim())
    )
    .map(filter => {
      const brandName = filter.brandName.trim();
      
      if (!filter.models?.length) {
        return brandName;
      }

      // Filter and clean model names
      const validModels = filter.models
        .map(model => model?.trim())
        .filter(Boolean);

      if (validModels.length === 0) {
        return brandName;
      }

      return `${brandName}:${validModels.join(';')}`;
    })
    .filter(Boolean)
    .join(',');

  setCacheEntry(complexCacheKey, result);

  return result;
}

/**
 * Parses hierarchical brand filter string back into brand/model combinations
 * @param hierarchicalFilter - The hierarchical filter string from the API
 * @returns Array of brand/model combinations
 */
export function parseHierarchicalBrandFilter(hierarchicalFilter: string): BrandModelFilter[] {
  if (!hierarchicalFilter || !hierarchicalFilter.trim()) {
    return [];
  }

  return hierarchicalFilter.split(',').map(brandGroup => {
    const trimmedGroup = brandGroup.trim();
    
    if (!trimmedGroup.includes(':')) {
      return { brandName: trimmedGroup };
    }
    
    const [brandName, modelsString] = trimmedGroup.split(':', 2);
    const models = modelsString ? modelsString.split(';').map(model => model.trim()).filter(Boolean) : [];
    
    return {
      brandName: brandName.trim(),
      models: models.length > 0 ? models : undefined
    };
  }).filter(filter => filter.brandName);
}

/**
 * Extracts the first brand name from a hierarchical filter string
 * @param hierarchicalFilter - The hierarchical filter string
 * @returns The first brand name or empty string
 */
export function extractFirstBrand(hierarchicalFilter: string): string {
  const parsed = parseHierarchicalBrandFilter(hierarchicalFilter);
  return parsed.length > 0 ? parsed[0].brandName : '';
}

/**
 * Extracts the first model name from a hierarchical filter string
 * @param hierarchicalFilter - The hierarchical filter string
 * @returns The first model name or empty string
 */
export function extractFirstModel(hierarchicalFilter: string): string {
  const parsed = parseHierarchicalBrandFilter(hierarchicalFilter);
  if (parsed.length > 0 && parsed[0].models && parsed[0].models.length > 0) {
    return parsed[0].models[0];
  }
  return '';
}
