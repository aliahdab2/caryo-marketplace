import { renderHook, waitFor } from '@testing-library/react';
import { useFuelTypeCounts } from '../useFuelTypeCounts';
import { CarListingFilterParams } from '@/services/api';

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';

describe('useFuelTypeCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fuelTypeCounts).toEqual(mockCounts);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/listings/counts/fuel-types');
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

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fuelTypeCounts).toEqual(mockCounts);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:8080/api/listings/counts/fuel-types')
    );
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFuelTypeCounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fuelTypeCounts).toEqual({});
    expect(result.current.error).toBe('Failed to load fuel type counts');
  });

  it.skip('should handle non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({})
    });

    const { result } = renderHook(() => useFuelTypeCounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load fuel type counts');
    }, { timeout: 2000 });

    expect(result.current.fuelTypeCounts).toEqual({});
  });

  it('should handle response without json method', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Server error'
    });

    const { result } = renderHook(() => useFuelTypeCounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fuelTypeCounts).toEqual({});
    expect(result.current.error).toBe('Failed to load fuel type counts');
  });

  it('should refetch when filters change', async () => {
    const mockCounts1 = { gasoline: 150 };
    const mockCounts2 = { diesel: 80 };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCounts1
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCounts2
      });

    const { result, rerender } = renderHook(
      ({ filters }: { filters?: CarListingFilterParams }) => useFuelTypeCounts(filters),
      {
        initialProps: { filters: undefined as CarListingFilterParams | undefined }
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fuelTypeCounts).toEqual(mockCounts1);

    // Change filters
    const newFilters: CarListingFilterParams = { brands: ['toyota'] };
    rerender({ filters: newFilters as CarListingFilterParams | undefined });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fuelTypeCounts).toEqual(mockCounts2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle empty filters gracefully', async () => {
    const mockCounts = { gasoline: 150 };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCounts
    });

    const filters: CarListingFilterParams = {
      brands: [],
      models: [],
      locations: []
    };

    const { result } = renderHook(() => useFuelTypeCounts(filters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fuelTypeCounts).toEqual(mockCounts);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/listings/counts/fuel-types');
  });

  it('should handle null and undefined filter values', async () => {
    const mockCounts = { gasoline: 150 };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCounts
    });

    const filters: CarListingFilterParams = {
      brands: undefined,
      models: undefined,
      minYear: undefined,
      maxYear: undefined,
      locations: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minMileage: undefined,
      maxMileage: undefined
    };

    const { result } = renderHook(() => useFuelTypeCounts(filters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.fuelTypeCounts).toEqual(mockCounts);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/api/listings/counts/fuel-types');
  });
}); 