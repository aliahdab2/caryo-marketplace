import { renderHook, act, waitFor } from '@testing-library/react';
import { useListingCount } from '../useListingCount';

jest.useFakeTimers();

// Mock public API
jest.mock('@/services/publicApi', () => ({
  getCarListingCountsPublic: jest.fn(),
}));

import { getCarListingCountsPublic } from '@/services/publicApi';
const mockGetCount = getCarListingCountsPublic as jest.MockedFunction<typeof getCarListingCountsPublic>;

describe('useListingCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null count and not loading', () => {
    const { result } = renderHook(() => useListingCount({}));
    expect(result.current.count).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('debounces calls and updates count', async () => {
    mockGetCount.mockResolvedValueOnce(42);

    const { result, rerender } = renderHook(
      (props: { filters: { brands?: string[]; models?: string[]; locations?: string[] } }) => useListingCount(props.filters, 300),
      { initialProps: { filters: { brands: ['toyota'] } } }
    );

    // Trigger debounce window
    rerender({ filters: { brands: ['toyota'], models: ['corolla'] } });
    expect(result.current.isLoading).toBe(false);

    // Fast-forward debounce
    await act(async () => {
      jest.advanceTimersByTime(300);
      // let any pending promises settle
    });

    await waitFor(() => {
      expect(mockGetCount).toHaveBeenCalledTimes(1);
      expect(mockGetCount).toHaveBeenCalledWith({ brands: ['toyota'], models: ['corolla'] });
      expect(result.current.count).toBe(42);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('only uses the latest filters when multiple rapid changes occur', async () => {
    mockGetCount.mockResolvedValue(7);

    const { rerender } = renderHook(
      (props: { filters: { brands?: string[]; models?: string[]; locations?: string[] } }) => useListingCount(props.filters, 200),
      { initialProps: { filters: { brands: ['toyota'] } } }
    );

    // Rapid changes before debounce threshold
    rerender({ filters: { brands: ['toyota'], models: ['camry'] } });
    rerender({ filters: { brands: ['toyota'], models: ['corolla'], locations: ['damascus'] } });

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(mockGetCount).toHaveBeenCalledTimes(1);
      expect(mockGetCount).toHaveBeenLastCalledWith({ brands: ['toyota'], models: ['corolla'], locations: ['damascus'] });
    });
  });

  it('supports manual refresh that bypasses debounce', async () => {
    mockGetCount.mockResolvedValueOnce(100);

    const { result } = renderHook(() => useListingCount({ brands: ['bmw'] }, 1000));

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGetCount).toHaveBeenCalledWith({ brands: ['bmw'] });
    // allow state update to flush
    await waitFor(() => {
      expect(result.current.count).toBe(100);
    });
  });

  it('uses cached value for identical filters within TTL', async () => {
    mockGetCount.mockResolvedValue(55);

    const { rerender, result } = renderHook(
      (props: { filters: { brands?: string[]; models?: string[]; locations?: string[] } }) => useListingCount(props.filters, 10),
      { initialProps: { filters: { brands: ['a'] } } }
    );

    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    await waitFor(() => expect(result.current.count).toBe(55));

    // Rerender with same filters - should hit cache, not call API again immediately
    rerender({ filters: { brands: ['a'] } });
    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    await waitFor(() => {
      // First call only
      expect(mockGetCount).toHaveBeenCalledTimes(1);
      expect(result.current.count).toBe(55);
    });
  });
});


