import { renderHook, waitFor } from '@testing-library/react';
import { useTransmissionCounts } from '../useTransmissionCounts';
import { CarListingFilterParams } from '@/services/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useTransmissionCounts', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should fetch transmission counts successfully', async () => {
    const mockResponse = {
      manual: 1200,
      automatic: 800,
      cvt: 150
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useTransmissionCounts());

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
      fuelTypeSlugs: ['gasoline'],
      bodyStyleIds: [1, 2]
    };

    const mockResponse = {
      manual: 500,
      automatic: 300
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useTransmissionCounts(filters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/listings/counts/transmissions?brandSlugs=toyota&brandSlugs=honda&modelSlugs=camry&modelSlugs=civic&minYear=2020&maxYear=2023&minPrice=10000&maxPrice=50000&maxMileage=100000&location=damascus&fuelTypeSlugs=gasoline&bodyStyleIds=1&bodyStyleIds=2')
    );
  });

  it('should handle HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => useTransmissionCounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('HTTP error! status: 500');
    expect(result.current.transmissionCounts).toEqual({});
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useTransmissionCounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.transmissionCounts).toEqual({});
  });

  it('should handle empty filters', async () => {
    const mockResponse = {
      manual: 1000,
      automatic: 600
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
      status: 200
    });

    const { result } = renderHook(() => useTransmissionCounts({}));

    // Wait for the effect to complete
    await waitFor(() => {
      expect(result.current.transmissionCounts).toEqual(mockResponse);
    }, { timeout: 5000 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/listings/counts/transmissions')
    );
  });

  it('should handle undefined filters', async () => {
    const mockResponse = {
      manual: 800,
      automatic: 400
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useTransmissionCounts(undefined));

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

    const mockResponse = { manual: 100 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useTransmissionCounts());

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

    const mockResponse = { manual: 100 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useTransmissionCounts());

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
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    mockFetch.mockReturnValueOnce(fetchPromise);

    const { result } = renderHook(() => useTransmissionCounts());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.transmissionCounts).toEqual({});
    expect(result.current.error).toBeNull();

    resolveFetch!({
      ok: true,
      json: async () => ({ manual: 100 })
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle partial filters', async () => {
    const filters: CarListingFilterParams = {
      brands: ['toyota'],
      minYear: 2020
    };

    const mockResponse = { manual: 300, automatic: 200 };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const { result } = renderHook(() => useTransmissionCounts(filters));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/listings/counts/transmissions?brandSlugs=toyota&minYear=2020')
    );
    expect(result.current.transmissionCounts).toEqual(mockResponse);
  });
}); 