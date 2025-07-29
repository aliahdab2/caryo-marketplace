import { renderHook, waitFor } from '@testing-library/react';
import { useAllCounts } from '../useAllCounts';
import { CarListingFilterParams } from '@/services/api';

// Mock the API utilities
jest.mock('@/utils/apiUtils', () => ({
  API_BASE_URL: 'http://localhost:8080',
  buildQueryParams: jest.requireActual('@/utils/apiUtils').buildQueryParams,
  getStandardErrorMessage: jest.requireActual('@/utils/apiUtils').getStandardErrorMessage,
}));

// Mock fetch
global.fetch = jest.fn();

describe('useAllCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useAllCounts());

    expect(result.current.counts).toEqual({
      fuelTypes: {},
      bodyStyles: {},
      transmissions: {}
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should fetch counts successfully', async () => {
    const mockCounts = {
      fuelTypes: { 'Petrol': 10, 'Diesel': 5 },
      bodyStyles: { 'Sedan': 8, 'SUV': 7 },
      transmissions: { 'Manual': 6, 'Automatic': 9 }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCounts
    });

    const { result } = renderHook(() => useAllCounts());

    // Advance timers to trigger the debounced fetch
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.counts).toEqual(mockCounts);
    expect(result.current.fuelTypeCounts).toEqual(mockCounts.fuelTypes);
    expect(result.current.bodyStyleCounts).toEqual(mockCounts.bodyStyles);
    expect(result.current.transmissionCounts).toEqual(mockCounts.transmissions);
    expect(result.current.error).toBe(null);
  });

  it('should handle API errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAllCounts());

    // Advance timers to trigger the debounced fetch
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load counts');
    expect(result.current.counts).toEqual({
      fuelTypes: {},
      bodyStyles: {},
      transmissions: {}
    });
  });

  it('should debounce API calls', async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useAllCounts(filters),
      { initialProps: { filters: { brands: ['toyota'] } } }
    );

    // Change filters multiple times quickly
    rerender({ filters: { brands: ['bmw'] } });
    rerender({ filters: { brands: ['audi'] } });
    rerender({ filters: { brands: ['mercedes'] } });

    // Should only make one API call due to debouncing
    expect(fetch).not.toHaveBeenCalled();

    // Advance timers to trigger the debounced fetch
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should build correct query parameters', async () => {
    const filters: CarListingFilterParams = {
      brands: ['toyota', 'bmw'],
      models: ['camry', 'x5'],
      minYear: 2020,
      maxYear: 2023,
      minPrice: 10000,
      maxPrice: 50000
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fuelTypes: {}, bodyStyles: {}, transmissions: {} })
    });

    renderHook(() => useAllCounts(filters));

    // Advance timers to trigger the debounced fetch
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/counts/all?')
      );
    });
  });
}); 