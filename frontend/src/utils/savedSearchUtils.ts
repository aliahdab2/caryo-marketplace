/**
 * Utility functions for saved search functionality
 */

export interface FrontendFilters {
  brands?: string[];
  models?: string[];
  locations?: string[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  transmissionId?: number;
  fuelTypeSlugs?: string[];
  bodyType?: string[];
  sellerTypeIds?: number[];
}

/**
 * Transform frontend filters to backend format
 * Centralized logic to avoid duplication between components
 */
export function transformFiltersToBackendFormat(
  filters: FrontendFilters, 
  searchQuery?: string
): Record<string, unknown> {
  const backendFilters: Record<string, unknown> = {};
  
  // Transform field names to match backend expectations
  if (filters.brands && filters.brands.length > 0) {
    backendFilters.brandSlugs = filters.brands;
  }
  if (filters.models && filters.models.length > 0) {
    backendFilters.modelSlugs = filters.models;
  }
  if (filters.locations && filters.locations.length > 0) {
    backendFilters.location = filters.locations; // Note: 'location' not 'locations'
  }
  if (filters.minPrice) backendFilters.minPrice = filters.minPrice;
  if (filters.maxPrice) backendFilters.maxPrice = filters.maxPrice;
  if (filters.minYear) backendFilters.minYear = filters.minYear;
  if (filters.maxYear) backendFilters.maxYear = filters.maxYear;
  if (filters.minMileage) backendFilters.minMileage = filters.minMileage;
  if (filters.maxMileage) backendFilters.maxMileage = filters.maxMileage;
  if (filters.transmissionId) backendFilters.transmissionId = filters.transmissionId;
  if (filters.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0) {
    backendFilters.fuelTypeSlugs = filters.fuelTypeSlugs;
  }
  if (filters.bodyType && filters.bodyType.length > 0) {
    backendFilters.bodyType = filters.bodyType;
  }
  if (filters.sellerTypeIds && filters.sellerTypeIds.length > 0) {
    backendFilters.sellerTypeIds = filters.sellerTypeIds;
  }
  if (searchQuery) {
    backendFilters.searchQuery = searchQuery;
  }
  
  return backendFilters;
}

/**
 * Generate user-friendly alert name from filters
 */
export function generateAlertNameFromFilters(
  filters: FrontendFilters,
  searchQuery?: string,
  brandNames?: Map<string, string>,
  modelNames?: Map<string, string>
): { nameEn: string; nameAr: string } {
  const parts: string[] = [];
  
  // Add brands
  if (filters.brands && filters.brands.length > 0) {
    const brandLabels = filters.brands.map(slug => 
      brandNames?.get(slug) || slug.charAt(0).toUpperCase() + slug.slice(1)
    );
    parts.push(brandLabels.join(', '));
  }
  
  // Add models
  if (filters.models && filters.models.length > 0) {
    const modelLabels = filters.models.map(slug => 
      modelNames?.get(slug) || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    parts.push(modelLabels.join(', '));
  }
  
  // Add price range
  if (filters.minPrice || filters.maxPrice) {
    if (filters.minPrice && filters.maxPrice) {
      parts.push(`$${filters.minPrice.toLocaleString()} - $${filters.maxPrice.toLocaleString()}`);
    } else if (filters.minPrice) {
      parts.push(`From $${filters.minPrice.toLocaleString()}`);
    } else if (filters.maxPrice) {
      parts.push(`Up to $${filters.maxPrice.toLocaleString()}`);
    }
  }
  
  // Add year range
  if (filters.minYear || filters.maxYear) {
    if (filters.minYear && filters.maxYear) {
      parts.push(`${filters.minYear} - ${filters.maxYear}`);
    } else if (filters.minYear) {
      parts.push(`From ${filters.minYear}`);
    } else if (filters.maxYear) {
      parts.push(`Up to ${filters.maxYear}`);
    }
  }
  
  // Add search query
  if (searchQuery) {
    parts.push(`"${searchQuery}"`);
  }
  
  const nameEn = parts.length > 0 ? parts.join(' • ') : 'Car Search Alert';
  const nameAr = 'تنبيه البحث عن السيارات'; // Could be more sophisticated
  
  return { nameEn, nameAr };
}

/**
 * Validate if filters have meaningful criteria
 */
export function hasValidSearchCriteria(filters: FrontendFilters, searchQuery?: string): boolean {
  return !!(
    (filters.brands && filters.brands.length > 0) ||
    (filters.models && filters.models.length > 0) ||
    (filters.locations && filters.locations.length > 0) ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minYear ||
    filters.maxYear ||
    filters.minMileage ||
    filters.maxMileage ||
    filters.transmissionId ||
    (filters.fuelTypeSlugs && filters.fuelTypeSlugs.length > 0) ||
    (filters.bodyType && filters.bodyType.length > 0) ||
    (filters.sellerTypeIds && filters.sellerTypeIds.length > 0) ||
    (searchQuery && searchQuery.trim().length > 0)
  );
}