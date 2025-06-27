/**
 * Utility functions for building hierarchical brand filtering syntax
 */

export interface BrandModelFilter {
  brandName: string;
  models?: string[];
}

/**
 * Builds hierarchical brand filter string from brand and model selections
 * @param brandName - The brand name
 * @param modelName - Optional specific model name
 * @returns Hierarchical filter string for the API
 */
export function buildHierarchicalBrandFilter(brandName: string, modelName?: string): string {
  if (!brandName.trim()) {
    return '';
  }

  if (!modelName || !modelName.trim()) {
    return brandName.trim();
  }

  return `${brandName.trim()}:${modelName.trim()}`;
}

/**
 * Builds complex hierarchical brand filter string from multiple brand/model combinations
 * @param filters - Array of brand/model combinations
 * @returns Hierarchical filter string for the API
 */
export function buildComplexHierarchicalBrandFilter(filters: BrandModelFilter[]): string {
  if (!filters || filters.length === 0) {
    return '';
  }

  return filters
    .filter(filter => filter.brandName && filter.brandName.trim())
    .map(filter => {
      const brandName = filter.brandName.trim();
      
      if (!filter.models || filter.models.length === 0) {
        return brandName;
      }
      
      const validModels = filter.models.filter(model => model && model.trim());
      if (validModels.length === 0) {
        return brandName;
      }
      
      return `${brandName}:${validModels.join(';')}`;
    })
    .join(',');
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
