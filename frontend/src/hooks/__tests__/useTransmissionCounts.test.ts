import { renderHook, waitFor } from '@testing-library/react';
import { useTransmissionCounts } from '../useTransmissionCounts';
import { CarListingFilterParams } from '@/services/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useTransmissionCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('should handle HTTP errors', async () => {
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

    expect(result.current.error).toBe('HTTP error! status: 500');
    expect(result.current.transmissionCounts).toEqual({});
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useTransmissionCounts());

    // Fast-forward the debounce timer
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.transmissionCounts).toEqual({});
  });

  it('should handle undefined filters', async () => {
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

  it('should use correct API URL', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = 'https://custom-api.com';

    const mockResponse = { automatic: 100 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useTransmissionCounts());

    // Fast-forward the debounce timer
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://custom-api.com/api/listings/counts/transmissions')
    );

    // Restore original environment
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it('should fallback to localhost when NEXT_PUBLIC_API_URL is not set', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    const mockResponse = { automatic: 100 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useTransmissionCounts());

    // Fast-forward the debounce timer
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:8080/api/listings/counts/transmissions')
    );

    // Restore original environment
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it('should handle loading state correctly', async () => {
    const { result } = renderHook(() => useTransmissionCounts());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.transmissionCounts).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('should handle partial filters', async () => {
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