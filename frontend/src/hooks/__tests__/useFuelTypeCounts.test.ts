import { renderHook, waitFor } from '@testing-library/react';
import { useFuelTypeCounts } from '../useFuelTypeCounts';
import { CarListingFilterParams } from '@/services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('useFuelTypeCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should start with loading state and empty data', () => {
      const { result } = renderHook(() => useFuelTypeCounts());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.fuelTypeCounts).toEqual({});
      expect(result.current.error).toBeNull();
    });
  });

  describe('Successful API Calls', () => {
    it('should fetch fuel type counts successfully', async () => {
      const mockCounts = {
        gasoline: 150,
        diesel: 80,
        electric: 20,
        hybrid: 30
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCounts
      });

      const { result } = renderHook(() => useFuelTypeCounts());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.fuelTypeCounts).toEqual({});
      expect(result.current.error).toBeNull();

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual(mockCounts);
      expect(result.current.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/listings/counts/fuel-types'));
    });

    it('should fetch fuel type counts with filters', async () => {
      const mockCounts = {
        gasoline: 50,
        diesel: 25
      };

      const filters: CarListingFilterParams = {
        brands: ['toyota', 'honda'],
        models: ['camry', 'civic'],
        minYear: 2020,
        maxYear: 2023,
        locations: ['damascus'],
        minPrice: 10000,
        maxPrice: 50000,
        minMileage: 0,
        maxMileage: 100000
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCounts
      });

      const { result } = renderHook(() => useFuelTypeCounts(filters));

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual(mockCounts);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/fuel-types')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFuelTypeCounts());

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual({});
      expect(result.current.error).toBe('Failed to load fuel type counts');
    });

    it('should handle HTTP errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useFuelTypeCounts());

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual({});
      expect(result.current.error).toBe('Failed to load fuel type counts');
    });
  });

  describe('Filter Updates', () => {
    it('should refetch when filters change', async () => {
      const mockCounts1 = {
        gasoline: 150,
      };

      const mockCounts2 = {
        gasoline: 100,
        diesel: 50,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCounts1
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCounts2
        });

      const initialFilters: CarListingFilterParams = { brands: ['toyota'] };
      const { result, rerender } = renderHook(
        ({ filters }) => useFuelTypeCounts(filters),
        { initialProps: { filters: initialFilters } }
      );

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual(mockCounts1);

      // Change filters
      const newFilters: CarListingFilterParams = { brands: ['toyota'], models: ['camry'] };
      rerender({ filters: newFilters });

      // Fast-forward the debounce timer again
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.fuelTypeCounts).toEqual(mockCounts2);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filters gracefully', async () => {
      const mockCounts = {
        gasoline: 150,
        diesel: 80,
        electric: 20
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCounts
      });

      const { result } = renderHook(() => useFuelTypeCounts({}));

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual(mockCounts);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/listings/counts/fuel-types'));
    });

    it('should handle null and undefined filter values', async () => {
      const mockCounts = {
        gasoline: 150,
        diesel: 80,
        electric: 20
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCounts
      });

      const filtersWithNulls: CarListingFilterParams = {
        brands: ['toyota'],
        models: undefined,
        minYear: null as any,
        maxYear: undefined,
        locations: ['damascus'],
        minPrice: 10000,
        maxPrice: undefined,
        minMileage: null as any,
        maxMileage: 100000
      };

      const { result } = renderHook(() => useFuelTypeCounts(filtersWithNulls));

      // Fast-forward the debounce timer
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fuelTypeCounts).toEqual(mockCounts);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/listings/counts/fuel-types'));
    });
  });
}); 