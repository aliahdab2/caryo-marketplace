/**
 * URL parameter utilities for search functionality
 * Supports AutoTrader UK style slug-based filtering
 */

export interface FilterUrlParams {
  brandSlugs?: string[];
  modelSlugs?: string[];
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  location?: string;
  locationId?: number;
  conditionId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  bodyStyleId?: number;
  sellerTypeId?: number;
}

/**
 * Builds URL search parameters from filter object
 * Follows AutoTrader UK pattern with multiple values for same parameter
 */
export function buildSearchParams(filters: FilterUrlParams): URLSearchParams {
  const params = new URLSearchParams();
  
  // Brand slugs - multiple values: ?brandSlugs=toyota&brandSlugs=honda
  if (filters.brandSlugs && filters.brandSlugs.length > 0) {
    filters.brandSlugs.forEach(brandSlug => {
      if (brandSlug.trim()) {
        params.append('brandSlugs', brandSlug);
      }
    });
  }
  
  // Model slugs - multiple values: ?modelSlugs=camry&modelSlugs=civic
  if (filters.modelSlugs && filters.modelSlugs.length > 0) {
    filters.modelSlugs.forEach(modelSlug => {
      if (modelSlug.trim()) {
        params.append('modelSlugs', modelSlug);
      }
    });
  }
  
  // Single value parameters
  if (filters.location) params.append('location', filters.location);
  if (filters.locationId && filters.locationId > 0) {
    params.append('locationId', filters.locationId.toString());
  }
  
  // Numeric filters with validation
  if (filters.minYear && filters.minYear > 1900) {
    params.append('minYear', filters.minYear.toString());
  }
  if (filters.maxYear && filters.maxYear <= new Date().getFullYear() + 1) {
    params.append('maxYear', filters.maxYear.toString());
  }
  if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice >= 0) {
    params.append('minPrice', filters.minPrice.toString());
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice >= 0) {
    params.append('maxPrice', filters.maxPrice.toString());
  }
  if (filters.minMileage !== undefined && filters.minMileage !== null && filters.minMileage >= 0) {
    params.append('minMileage', filters.minMileage.toString());
  }
  if (filters.maxMileage !== undefined && filters.maxMileage !== null && filters.maxMileage >= 0) {
    params.append('maxMileage', filters.maxMileage.toString());
  }
  
  // Entity ID filters
  if (filters.conditionId && filters.conditionId > 0) {
    params.append('conditionId', filters.conditionId.toString());
  }
  if (filters.transmissionId && filters.transmissionId > 0) {
    params.append('transmissionId', filters.transmissionId.toString());
  }
  if (filters.fuelTypeId && filters.fuelTypeId > 0) {
    params.append('fuelTypeId', filters.fuelTypeId.toString());
  }
  if (filters.bodyStyleId && filters.bodyStyleId > 0) {
    params.append('bodyStyleId', filters.bodyStyleId.toString());
  }
  if (filters.sellerTypeId && filters.sellerTypeId > 0) {
    params.append('sellerTypeId', filters.sellerTypeId.toString());
  }
  
  return params;
}

/**
 * Parses URL search parameters into filter object
 * Handles slug-based filtering with support for single parameter format
 */
export function parseSearchParams(searchParams: URLSearchParams): FilterUrlParams {
  const filters: FilterUrlParams = {};
  
  // Parse brand slugs (multiple values)
  const brandSlugs = searchParams.getAll('brandSlugs').filter(slug => slug.trim());
  if (brandSlugs.length > 0) {
    filters.brandSlugs = brandSlugs;
  }
  
  // Parse model slugs (multiple values)
  const modelSlugs = searchParams.getAll('modelSlugs').filter(slug => slug.trim());
  if (modelSlugs.length > 0) {
    filters.modelSlugs = modelSlugs;
  }
  
  // Handle single brand/model parameters (clean URLs from HomeSearchBar)
  const brandParam = searchParams.get('brand');
  if (brandParam && !filters.brandSlugs) {
    filters.brandSlugs = [brandParam];
  }
  
  const modelParam = searchParams.get('model');
  if (modelParam && !filters.modelSlugs) {
    filters.modelSlugs = [modelParam];
  }
  
  // Parse location parameters
  const location = searchParams.get('location');
  if (location) filters.location = location;
  
  const locationId = searchParams.get('locationId');
  if (locationId) filters.locationId = parseInt(locationId, 10);
  
  // Parse numeric filters with validation
  const minYear = searchParams.get('minYear');
  if (minYear) {
    const year = parseInt(minYear, 10);
    if (year > 1900) filters.minYear = year;
  }
  
  const maxYear = searchParams.get('maxYear');
  if (maxYear) {
    const year = parseInt(maxYear, 10);
    if (year <= new Date().getFullYear() + 1) filters.maxYear = year;
  }
  
  const minPrice = searchParams.get('minPrice');
  if (minPrice) {
    const price = parseFloat(minPrice);
    if (price >= 0) filters.minPrice = price;
  }
  
  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) {
    const price = parseFloat(maxPrice);
    if (price >= 0) filters.maxPrice = price;
  }
  
  const minMileage = searchParams.get('minMileage');
  if (minMileage) {
    const mileage = parseInt(minMileage, 10);
    if (mileage >= 0) filters.minMileage = mileage;
  }
  
  const maxMileage = searchParams.get('maxMileage');
  if (maxMileage) {
    const mileage = parseInt(maxMileage, 10);
    if (mileage >= 0) filters.maxMileage = mileage;
  }
  
  // Parse entity ID filters
  const conditionId = searchParams.get('conditionId');
  if (conditionId) {
    const id = parseInt(conditionId, 10);
    if (id > 0) filters.conditionId = id;
  }
  
  const transmissionId = searchParams.get('transmissionId');
  if (transmissionId) {
    const id = parseInt(transmissionId, 10);
    if (id > 0) filters.transmissionId = id;
  }
  
  const fuelTypeId = searchParams.get('fuelTypeId');
  if (fuelTypeId) {
    const id = parseInt(fuelTypeId, 10);
    if (id > 0) filters.fuelTypeId = id;
  }
  
  const bodyStyleId = searchParams.get('bodyStyleId');
  if (bodyStyleId) {
    const id = parseInt(bodyStyleId, 10);
    if (id > 0) filters.bodyStyleId = id;
  }
  
  const sellerTypeId = searchParams.get('sellerTypeId');
  if (sellerTypeId) {
    const id = parseInt(sellerTypeId, 10);
    if (id > 0) filters.sellerTypeId = id;
  }
  
  return filters;
}

/**
 * Validates filter values
 */
export function validateFilters(filters: FilterUrlParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate year range
  if (filters.minYear && filters.maxYear && filters.minYear > filters.maxYear) {
    errors.push('Minimum year cannot be greater than maximum year');
  }
  
  // Validate price range
  if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
    errors.push('Minimum price cannot be greater than maximum price');
  }
  
  // Validate mileage range
  if (filters.minMileage && filters.maxMileage && filters.minMileage > filters.maxMileage) {
    errors.push('Minimum mileage cannot be greater than maximum mileage');
  }
  
  // Validate year bounds
  const currentYear = new Date().getFullYear();
  if (filters.minYear && (filters.minYear < 1900 || filters.minYear > currentYear + 1)) {
    errors.push('Invalid minimum year');
  }
  if (filters.maxYear && (filters.maxYear < 1900 || filters.maxYear > currentYear + 1)) {
    errors.push('Invalid maximum year');
  }
  
  // Validate price bounds
  if (filters.minPrice && filters.minPrice < 0) {
    errors.push('Minimum price cannot be negative');
  }
  if (filters.maxPrice && filters.maxPrice < 0) {
    errors.push('Maximum price cannot be negative');
  }
  
  // Validate mileage bounds
  if (filters.minMileage && filters.minMileage < 0) {
    errors.push('Minimum mileage cannot be negative');
  }
  if (filters.maxMileage && filters.maxMileage < 0) {
    errors.push('Maximum mileage cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Builds a clean URL path for search with filters
 */
export function buildSearchUrl(filters: FilterUrlParams): string {
  const params = buildSearchParams(filters);
  const queryString = params.toString();
  return `/search${queryString ? `?${queryString}` : ''}`;
}

/**
 * Checks if any filters are active
 */
export function hasActiveFilters(filters: FilterUrlParams): boolean {
  return Object.values(filters).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Counts the number of active filters
 */
export function countActiveFilters(filters: FilterUrlParams): number {
  let count = 0;
  
  if (filters.brandSlugs && filters.brandSlugs.length > 0) count++;
  if (filters.modelSlugs && filters.modelSlugs.length > 0) count++;
  if (filters.location || filters.locationId) count++;
  if (filters.minYear || filters.maxYear) count++;
  if (filters.minPrice || filters.maxPrice) count++;
  if (filters.minMileage || filters.maxMileage) count++;
  if (filters.conditionId) count++;
  if (filters.transmissionId) count++;
  if (filters.fuelTypeId) count++;
  if (filters.bodyStyleId) count++;
  if (filters.sellerTypeId) count++;
  
  return count;
}
