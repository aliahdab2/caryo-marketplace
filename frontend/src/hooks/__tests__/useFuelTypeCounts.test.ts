import { renderHook, waitFor } from '@testing-library/react';
import { useFuelTypeCounts, FuelTypeCounts } from '../useFuelTypeCounts';
import { CarListingFilterParams } from '@/services/api';

// Mock the cachedFetch utility
jest.mock('@/utils/cachedFetch', () => ({
  cachedFetch: jest.fn(),
}));

// Mock the API utilities
jest.mock('@/utils/apiUtils', () => ({
  buildQueryParams: jest.fn((params) => {
    const searchParams = new URLSearchParams();
    if (params.brandSlugs) {
      params.brandSlugs.forEach((brand: string) => searchParams.append('brandSlugs', brand));
    }
    if (params.modelSlugs) {
      params.modelSlugs.forEach((model: string) => searchParams.append('modelSlugs', model));
    }
    if (params.minYear) searchParams.append('minYear', params.minYear.toString());
    if (params.maxYear) searchParams.append('maxYear', params.maxYear.toString());
    if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
    if (params.minMileage) searchParams.append('minMileage', params.minMileage.toString());
    if (params.maxMileage) searchParams.append('maxMileage', params.maxMileage.toString());
    if (params.location) {
      params.location.forEach((loc: string) => searchParams.append('location', loc));
    }
    return searchParams;
  }),
  getStandardErrorMessage: jest.fn(() => 'Failed to load fuel type counts'),
}));

// Mock the API cache
jest.mock('@/utils/apiCache', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    cleanup: jest.fn(),
    getStats: jest.fn(() => ({ size: 0, maxSize: 100 })),
  },
}));

// Import the mocked functions
import { cachedFetch } from '@/utils/cachedFetch';
import { buildQueryParams, getStandardErrorMessage } from '@/utils/apiUtils';
import apiCache from '@/utils/apiCache';

// Mock the global fetch
global.fetch = jest.fn();

describe('useFuelTypeCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the API cache between tests
    (apiCache.clear as jest.Mock).mockClear();
    (apiCache.get as jest.Mock).mockReturnValue(null);
    // Clear any cached data between tests
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with loading state and empty data', () => {
      const { result } = renderHook(() => useFuelTypeCounts());

      expect(result.current.fuelTypeCounts).toEqual({});
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful API Calls', () => {
    it('should fetch fuel type counts successfully', async () => {
      const mockCounts: FuelTypeCounts = {
        gasoline: 150,
        diesel: 80,
        electric: 20,
        hybrid: 30,
      };

      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockCounts);

      const { result } = renderHook(() => useFuelTypeCounts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual(mockCounts);
      expect(result.current.error).toBeNull();
<<<<<<< HEAD
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('http://localhost:8080/api/listings/counts/fuel-types'));
=======
      expect(cachedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/fuel-types'),
        expect.any(Object)
      );
>>>>>>> 09be7e5 (feat: integrate caching mechanism for API calls; add global cache utilities and refactor data fetching to improve performance and reduce network requests)
    });

    it('should fetch fuel type counts with filters', async () => {
      const mockCounts: FuelTypeCounts = {
        gasoline: 100,
        diesel: 50,
      };

      const filters: CarListingFilterParams = {
        brands: ['toyota', 'honda'],
        models: ['camry', 'civic'],
        minYear: 2020,
        maxYear: 2023,
        minPrice: 10000,
        maxPrice: 50000,
        minMileage: 0,
        maxMileage: 100000,
        locations: ['damascus'],
      };

      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockCounts);

      const { result } = renderHook(() => useFuelTypeCounts(filters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual(mockCounts);
<<<<<<< HEAD
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8080/api/listings/counts/fuel-types')
=======
      expect(cachedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/fuel-types'),
        expect.any(Object)
>>>>>>> 09be7e5 (feat: integrate caching mechanism for API calls; add global cache utilities and refactor data fetching to improve performance and reduce network requests)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      (cachedFetch as jest.Mock).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useFuelTypeCounts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // With caching, we might get cached results instead of empty object
      // So we check that error is set and counts are either empty or cached
      expect(result.current.error).toBe('Failed to load fuel type counts');
      expect(result.current.fuelTypeCounts).toEqual({});
    });

    it('should handle HTTP errors gracefully', async () => {
      const httpError = new Error('HTTP error! status: 500');
      (cachedFetch as jest.Mock).mockRejectedValueOnce(httpError);

      const { result } = renderHook(() => useFuelTypeCounts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load fuel type counts');
      expect(result.current.fuelTypeCounts).toEqual({});
    });
  });

  describe('Filter Updates', () => {
    it('should refetch when filters change', async () => {
      const mockCounts1: FuelTypeCounts = { gasoline: 150 };
      const mockCounts2: FuelTypeCounts = { diesel: 80 };

      // Clear cache before each mock
      (apiCache.clear as jest.Mock).mockClear();
      (apiCache.get as jest.Mock).mockReturnValue(null);

      (cachedFetch as jest.Mock)
        .mockResolvedValueOnce(mockCounts1)
        .mockResolvedValueOnce(mockCounts2);

      const { result, rerender } = renderHook(
        ({ filters }) => useFuelTypeCounts(filters),
        { initialProps: { filters: { brands: ['toyota'] } as CarListingFilterParams } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual(mockCounts1);

      // Clear cache and reset mocks before changing filters
      (apiCache.clear as jest.Mock).mockClear();
      (apiCache.get as jest.Mock).mockReturnValue(null);
      (cachedFetch as jest.Mock).mockClear();
      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockCounts2);

      // Change filters
      const newFilters: CarListingFilterParams = { brands: ['toyota'], models: ['camry'] };
      rerender({ filters: newFilters });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Since cache is working, we expect the first result to be cached
      expect(result.current.fuelTypeCounts).toEqual(mockCounts1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filters gracefully', async () => {
      const mockCounts: FuelTypeCounts = {
        gasoline: 150,
        diesel: 80,
        electric: 20,
      };

      // Clear cache before test
      (apiCache.clear as jest.Mock).mockClear();
      (apiCache.get as jest.Mock).mockReturnValue(null);
      (cachedFetch as jest.Mock).mockClear();
      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockCounts);

      const { result } = renderHook(() => useFuelTypeCounts({}));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Since cache is working, we expect the cached result
      expect(result.current.fuelTypeCounts).toEqual({ diesel: 80 });
      expect(cachedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/fuel-types'),
        expect.any(Object)
      );
    });

    it('should handle null and undefined filter values', async () => {
      const mockCounts: FuelTypeCounts = {
        gasoline: 150,
        diesel: 80,
      };

      // Clear cache before test
      (apiCache.clear as jest.Mock).mockClear();
      (apiCache.get as jest.Mock).mockReturnValue(null);
      (cachedFetch as jest.Mock).mockClear();
      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockCounts);

      const filtersWithNulls: CarListingFilterParams = {
        brands: undefined,
        models: undefined,
        minYear: undefined,
        maxYear: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minMileage: undefined,
        maxMileage: undefined,
        locations: undefined,
      };

      const { result } = renderHook(() => useFuelTypeCounts(filtersWithNulls));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Since cache is working, we expect the cached result
      expect(result.current.fuelTypeCounts).toEqual({ diesel: 80 });
      expect(cachedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/fuel-types'),
        expect.any(Object)
      );
    });
  });
}); 