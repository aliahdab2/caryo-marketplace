import {
  buildSearchParams,
  parseSearchParams,
  validateFilters,
  buildSearchUrl,
  hasActiveFilters,
  countActiveFilters,
  FilterUrlParams
} from '../searchUrlUtils';

describe('searchUrlUtils', () => {
  describe('buildSearchParams', () => {
    it('builds params for brand slugs correctly', () => {
      const filters: FilterUrlParams = {
        brandSlugs: ['toyota', 'honda']
      };
      
      const params = buildSearchParams(filters);
      const paramString = params.toString();
      
      expect(paramString).toBe('brandSlugs=toyota&brandSlugs=honda');
    });

    it('builds params for model slugs correctly', () => {
      const filters: FilterUrlParams = {
        modelSlugs: ['camry', 'civic']
      };
      
      const params = buildSearchParams(filters);
      const paramString = params.toString();
      
      expect(paramString).toBe('modelSlugs=camry&modelSlugs=civic');
    });

    it('filters out empty brand/model slugs', () => {
      const filters: FilterUrlParams = {
        brandSlugs: ['toyota', '', 'honda', '   '],
        modelSlugs: ['camry', '', 'civic']
      };
      
      const params = buildSearchParams(filters);
      const paramString = params.toString();
      
      expect(paramString).toBe('brandSlugs=toyota&brandSlugs=honda&modelSlugs=camry&modelSlugs=civic');
    });

    it('builds params for numeric filters with validation', () => {
      const filters: FilterUrlParams = {
        minYear: 2020,
        maxYear: 2024,
        minPrice: 10000,
        maxPrice: 50000,
        minMileage: 0,
        maxMileage: 100000
      };
      
      const params = buildSearchParams(filters);
      
      expect(params.get('minYear')).toBe('2020');
      expect(params.get('maxYear')).toBe('2024');
      expect(params.get('minPrice')).toBe('10000');
      expect(params.get('maxPrice')).toBe('50000');
      expect(params.get('minMileage')).toBe('0');
      expect(params.get('maxMileage')).toBe('100000');
    });

    it('validates and filters out invalid numeric values', () => {
      const currentYear = new Date().getFullYear();
      const filters: FilterUrlParams = {
        minYear: 1800, // Too old, should be filtered out
        maxYear: currentYear + 5, // Too far in future, should be filtered out
        minPrice: -1000, // Negative, should be filtered out
        locationId: 0 // Zero or negative, should be filtered out
      };
      
      const params = buildSearchParams(filters);
      
      expect(params.get('minYear')).toBeNull();
      expect(params.get('maxYear')).toBeNull();
      expect(params.get('minPrice')).toBeNull();
      expect(params.get('locationId')).toBeNull();
    });

    it('builds params for entity ID filters', () => {
      const filters: FilterUrlParams = {
        conditionId: 1,
        transmissionId: 2,
        fuelTypeId: 3,
        bodyStyleId: 4,
        sellerTypeId: 5
      };
      
      const params = buildSearchParams(filters);
      
      expect(params.get('conditionId')).toBe('1');
      expect(params.get('transmissionId')).toBe('2');
      expect(params.get('fuelTypeId')).toBe('3');
      expect(params.get('bodyStyleId')).toBe('4');
      expect(params.get('sellerTypeId')).toBe('5');
    });
  });

  describe('parseSearchParams', () => {
    it('parses brand and model slugs correctly', () => {
      const params = new URLSearchParams('brandSlugs=toyota&brandSlugs=honda&modelSlugs=camry&modelSlugs=civic');
      
      const filters = parseSearchParams(params);
      
      expect(filters.brandSlugs).toEqual(['toyota', 'honda']);
      expect(filters.modelSlugs).toEqual(['camry', 'civic']);
    });

    it('handles single brand/model parameters', () => {
      const params = new URLSearchParams('brand=toyota&model=camry');
      
      const filters = parseSearchParams(params);
      
      expect(filters.brandSlugs).toEqual(['toyota']);
      expect(filters.modelSlugs).toEqual(['camry']);
    });

    it('prioritizes slug arrays over single parameters', () => {
      const params = new URLSearchParams('brandSlugs=honda&brand=toyota&modelSlugs=civic&model=camry');
      
      const filters = parseSearchParams(params);
      
      expect(filters.brandSlugs).toEqual(['honda']);
      expect(filters.modelSlugs).toEqual(['civic']);
    });

    it('parses numeric parameters with validation', () => {
      const params = new URLSearchParams('minYear=2020&maxYear=2024&minPrice=10000&maxPrice=50000');
      
      const filters = parseSearchParams(params);
      
      expect(filters.minYear).toBe(2020);
      expect(filters.maxYear).toBe(2024);
      expect(filters.minPrice).toBe(10000);
      expect(filters.maxPrice).toBe(50000);
    });

    it('filters out invalid numeric values during parsing', () => {
      const currentYear = new Date().getFullYear();
      const params = new URLSearchParams(`minYear=1800&maxYear=${currentYear + 5}&minPrice=-1000&minMileage=-500`);
      
      const filters = parseSearchParams(params);
      
      expect(filters.minYear).toBeUndefined();
      expect(filters.maxYear).toBeUndefined();
      expect(filters.minPrice).toBeUndefined();
      expect(filters.minMileage).toBeUndefined();
    });

    it('parses entity ID parameters', () => {
      const params = new URLSearchParams('conditionId=1&transmissionId=2&fuelTypeId=3');
      
      const filters = parseSearchParams(params);
      
      expect(filters.conditionId).toBe(1);
      expect(filters.transmissionId).toBe(2);
      expect(filters.fuelTypeId).toBe(3);
    });

    it('filters out empty brand/model slugs', () => {
      const params = new URLSearchParams();
      params.append('brandSlugs', 'toyota');
      params.append('brandSlugs', '');
      params.append('brandSlugs', 'honda');
      params.append('modelSlugs', 'camry');
      params.append('modelSlugs', '   ');
      
      const filters = parseSearchParams(params);
      
      expect(filters.brandSlugs).toEqual(['toyota', 'honda']);
      expect(filters.modelSlugs).toEqual(['camry']);
    });
  });

  describe('validateFilters', () => {
    it('validates correct filter ranges', () => {
      const filters: FilterUrlParams = {
        minYear: 2020,
        maxYear: 2024,
        minPrice: 10000,
        maxPrice: 50000,
        minMileage: 0,
        maxMileage: 100000
      };
      
      const result = validateFilters(filters);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects invalid year range', () => {
      const filters: FilterUrlParams = {
        minYear: 2024,
        maxYear: 2020
      };
      
      const result = validateFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum year cannot be greater than maximum year');
    });

    it('detects invalid price range', () => {
      const filters: FilterUrlParams = {
        minPrice: 50000,
        maxPrice: 10000
      };
      
      const result = validateFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum price cannot be greater than maximum price');
    });

    it('detects invalid mileage range', () => {
      const filters: FilterUrlParams = {
        minMileage: 100000,
        maxMileage: 50000
      };
      
      const result = validateFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum mileage cannot be greater than maximum mileage');
    });

    it('detects negative values', () => {
      const filters: FilterUrlParams = {
        minPrice: -1000,
        maxPrice: -500,
        minMileage: -100
      };
      
      const result = validateFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Minimum price cannot be negative');
      expect(result.errors).toContain('Maximum price cannot be negative');
      expect(result.errors).toContain('Minimum mileage cannot be negative');
    });

    it('detects invalid year bounds', () => {
      const currentYear = new Date().getFullYear();
      const filters: FilterUrlParams = {
        minYear: 1800,
        maxYear: currentYear + 5
      };
      
      const result = validateFilters(filters);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid minimum year');
      expect(result.errors).toContain('Invalid maximum year');
    });
  });

  describe('buildSearchUrl', () => {
    it('builds URL with filters', () => {
      const filters: FilterUrlParams = {
        brandSlugs: ['toyota'],
        minYear: 2020,
        maxYear: 2024
      };
      
      const url = buildSearchUrl(filters);
      
      expect(url).toBe('/search?brandSlugs=toyota&minYear=2020&maxYear=2024');
    });

    it('builds URL without query string when no filters', () => {
      const filters: FilterUrlParams = {};
      
      const url = buildSearchUrl(filters);
      
      expect(url).toBe('/search');
    });
  });

  describe('hasActiveFilters', () => {
    it('returns true when filters are active', () => {
      const filters: FilterUrlParams = {
        brandSlugs: ['toyota']
      };
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('returns true for numeric filters', () => {
      const filters: FilterUrlParams = {
        minYear: 2020
      };
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('returns false when no filters are active', () => {
      const filters: FilterUrlParams = {};
      
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('returns false for empty arrays', () => {
      const filters: FilterUrlParams = {
        brandSlugs: [],
        modelSlugs: []
      };
      
      expect(hasActiveFilters(filters)).toBe(false);
    });
  });

  describe('countActiveFilters', () => {
    it('counts individual filter types correctly', () => {
      const filters: FilterUrlParams = {
        brandSlugs: ['toyota', 'honda'],  // 1 filter type
        modelSlugs: ['camry'],            // 1 filter type
        minYear: 2020,                    // 1 filter type (year range)
        maxYear: 2024,                    // counted with minYear
        minPrice: 10000,                  // 1 filter type (price range)
        conditionId: 1                    // 1 filter type
      };
      
      expect(countActiveFilters(filters)).toBe(5);
    });

    it('counts year range as single filter', () => {
      const filters: FilterUrlParams = {
        minYear: 2020,
        maxYear: 2024
      };
      
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('counts price range as single filter', () => {
      const filters: FilterUrlParams = {
        minPrice: 10000,
        maxPrice: 50000
      };
      
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('counts location with ID as single filter', () => {
      const filters: FilterUrlParams = {
        location: 'cairo',
        locationId: 1
      };
      
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('returns 0 for no active filters', () => {
      const filters: FilterUrlParams = {};
      
      expect(countActiveFilters(filters)).toBe(0);
    });
  });
});
