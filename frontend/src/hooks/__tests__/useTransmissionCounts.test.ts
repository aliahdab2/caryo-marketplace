import { renderHook, waitFor } from '@testing-library/react';
import { useTransmissionCounts, TransmissionCounts } from '../useTransmissionCounts';
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
    if (params.fuelTypeSlugs) {
      params.fuelTypeSlugs.forEach((fuelType: string) => searchParams.append('fuelTypeSlugs', fuelType));
    }
    if (params.bodyStyleIds) {
      params.bodyStyleIds.forEach((bodyStyleId: number) => searchParams.append('bodyStyleIds', bodyStyleId.toString()));
    }
    return searchParams;
  }),
  getStandardErrorMessage: jest.fn(() => 'Failed to load transmission counts'),
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

describe('useTransmissionCounts', () => {
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
      const { result } = renderHook(() => useTransmissionCounts());

      expect(result.current.transmissionCounts).toEqual({});
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful API Calls', () => {
    it('should fetch transmission counts successfully', async () => {
      const mockResponse: TransmissionCounts = {
        automatic: 400,
        manual: 600,
      };

      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useTransmissionCounts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.transmissionCounts).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(cachedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/transmissions'),
        expect.any(Object)
      );
    });

    it('should handle filters correctly', async () => {
      const mockResponse: TransmissionCounts = {
        automatic: 200,
        manual: 300,
      };

      const filters: CarListingFilterParams = {
        brands: ['toyota', 'honda'],
        models: ['camry', 'civic'],
        minYear: 2020,
        maxYear: 2023,
        minPrice: 10000,
        maxPrice: 50000,
        maxMileage: 100000,
        locations: ['damascus'],
        fuelTypeSlugs: ['gasoline'],
        bodyStyleIds: [1, 2],
      };

      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useTransmissionCounts(filters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.transmissionCounts).toEqual(mockResponse);
      expect(cachedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/transmissions?brandSlugs=toyota&brandSlugs=honda&modelSlugs=camry&modelSlugs=civic&minYear=2020&maxYear=2023&minPrice=10000&maxPrice=50000&maxMileage=100000&location=damascus&fuelTypeSlugs=gasoline&bodyStyleIds=1&bodyStyleIds=2'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', async () => {
      const httpError = new Error('HTTP error! status: 500');
      (cachedFetch as jest.Mock).mockRejectedValueOnce(httpError);

      const { result } = renderHook(() => useTransmissionCounts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load transmission counts');
      expect(result.current.transmissionCounts).toEqual({});
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      (cachedFetch as jest.Mock).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useTransmissionCounts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load transmission counts');
      expect(result.current.transmissionCounts).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined filters gracefully', async () => {
      const mockResponse: TransmissionCounts = {
        automatic: 400,
        manual: 600,
      };

      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useTransmissionCounts(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(cachedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/transmissions'),
        expect.any(Object)
      );
      expect(result.current.transmissionCounts).toEqual(mockResponse);
    });

    it('should handle partial filters correctly', async () => {
      const mockResponse: TransmissionCounts = {
        automatic: 200,
        manual: 300,
      };

      const partialFilters: CarListingFilterParams = {
        brands: ['toyota'],
        minYear: 2020,
      };

      (cachedFetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useTransmissionCounts(partialFilters));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(cachedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/transmissions?brandSlugs=toyota&minYear=2020'),
        expect.any(Object)
      );
      expect(result.current.transmissionCounts).toEqual(mockResponse);
    });
  });
}); 