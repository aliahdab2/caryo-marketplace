import { renderHook, waitFor } from '@testing-library/react';
import { useTransmissionCounts } from '../useTransmissionCounts';
import { CarListingFilterParams } from '@/services/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the API utilities
jest.mock('@/utils/apiUtils', () => ({
  API_BASE_URL: 'http://localhost:8080',
  buildQueryParams: jest.requireActual('@/utils/apiUtils').buildQueryParams,
  getStandardErrorMessage: jest.requireActual('@/utils/apiUtils').getStandardErrorMessage,
}));

describe('useTransmissionCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should start with loading state and empty data', () => {
      const { result } = renderHook(() => useTransmissionCounts());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.transmissionCounts).toEqual({});
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful API Calls', () => {
    it('should fetch transmission counts successfully', async () => {
      const mockResponse = {
        automatic: 800,
        manual: 1200,
        cvt: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransmissionCounts());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.transmissionCounts).toEqual({});
      expect(result.current.error).toBeNull();

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.transmissionCounts).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/transmissions')
      );
    });

    it('should handle filters correctly', async () => {
      const mockResponse = {
        automatic: 400,
        manual: 600,
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransmissionCounts(filters));

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.transmissionCounts).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/transmissions?brandSlugs=toyota&brandSlugs=honda&modelSlugs=camry&modelSlugs=civic&minYear=2020&maxYear=2023&minPrice=10000&maxPrice=50000&maxMileage=100000&location=damascus&fuelTypeSlugs=gasoline&bodyStyleIds=1&bodyStyleIds=2')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useTransmissionCounts());

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load transmission counts');
      expect(result.current.transmissionCounts).toEqual({});
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTransmissionCounts());

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load transmission counts');
      expect(result.current.transmissionCounts).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined filters gracefully', async () => {
      const mockResponse = {
        automatic: 800,
        manual: 1200,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransmissionCounts(undefined));

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/transmissions')
      );
      expect(result.current.transmissionCounts).toEqual(mockResponse);
    });

    it('should handle partial filters correctly', async () => {
      const mockResponse = {
        automatic: 400,
        manual: 600,
      };

      const filters: CarListingFilterParams = {
        brands: ['toyota'],
        minYear: 2020,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransmissionCounts(filters));

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/transmissions?brandSlugs=toyota&minYear=2020')
      );
      expect(result.current.transmissionCounts).toEqual(mockResponse);
    });
  });
}); 