import { renderHook, waitFor } from '@testing-library/react';
import { useAllCounts } from '../useAllCounts';
import { CarListingFilterParams } from '@/services/api';
import apiCache from '@/utils/apiCache';

jest.mock('@/utils/apiUtils', () => ({
  API_BASE_URL: 'http://localhost:8080',
  buildQueryParams: jest.requireActual('@/utils/apiUtils').buildQueryParams,
  getStandardErrorMessage: jest.requireActual('@/utils/apiUtils').getStandardErrorMessage,
}));

global.fetch = jest.fn();

describe('useAllCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    apiCache.clear();
    (global.fetch as jest.Mock).mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch counts successfully', async () => {
    const mockCounts = {
      fuelTypes: { gasoline: 100, diesel: 50 },
      bodyStyles: { sedan: 60, suv: 40 },
      transmissions: { automatic: 80, manual: 70 },
      brands: { toyota: 120, honda: 95 },
      models: { camry: 45, civic: 38 }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCounts
    });

    const { result } = renderHook(() => useAllCounts());
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.counts).toEqual(mockCounts);
    expect(result.current.error).toBe(null);
  });

  it('should handle API errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAllCounts());
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load counts');
    expect(result.current.counts).toEqual({
      fuelTypes: {},
      bodyStyles: {},
      transmissions: {},
      brands: {},
      models: {}
    });
  });

  it('should debounce API calls', async () => {
    const { result, rerender } = renderHook(() => useAllCounts());
    
    // Change filters multiple times quickly
    rerender();
    rerender();
    rerender();
    
    // Should only make one API call after debounce
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1); // Single consolidated endpoint
    });
  });

  it('should build correct query parameters', async () => {
    const filters: CarListingFilterParams = {
      brands: ['toyota'],
      models: ['camry'],
      minYear: 2020,
      maxYear: 2023
    };

    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });

    renderHook(() => useAllCounts(filters));
    jest.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8080/api/listings/counts/all?'),
        expect.any(Object)
      );
    });
  });
}); 