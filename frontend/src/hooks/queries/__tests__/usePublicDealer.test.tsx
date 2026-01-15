import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  usePublicDealerProfile, 
  usePublicDealerListings,
  publicDealerKeys 
} from '../usePublicDealer';
import * as publicDealerApi from '@/services/publicDealerApi';

// Mock the public dealer API
jest.mock('@/services/publicDealerApi', () => ({
  getPublicDealerProfile: jest.fn(),
  getPublicDealerListings: jest.fn(),
}));

// Create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe('usePublicDealer hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('publicDealerKeys', () => {
    it('should generate correct query keys', () => {
      expect(publicDealerKeys.all).toEqual(['publicDealer']);
      expect(publicDealerKeys.profile(1)).toEqual(['publicDealer', 'profile', 1]);
      expect(publicDealerKeys.listings(1, 0)).toEqual(['publicDealer', 'listings', 1, 0]);
    });
  });

  describe('usePublicDealerProfile', () => {
    it('should fetch dealer profile successfully', async () => {
      const mockProfile = {
        id: 1,
        businessName: 'Damascus Motors',
        businessPhone: '+963-11-XXX-XXXX',
        tradingAddress: 'Damascus, Syria',
        logoUrl: 'https://example.com/logo.png',
        stats: {
          totalListings: 10,
          activeListings: 8,
          soldCount: 2,
        },
      };
      (publicDealerApi.getPublicDealerProfile as jest.Mock).mockResolvedValue(mockProfile);

      const { result } = renderHook(() => usePublicDealerProfile(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(publicDealerApi.getPublicDealerProfile).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual(mockProfile);
      expect(result.current.data?.businessName).toBe('Damascus Motors');
    });

    it('should handle error when dealer not found', async () => {
      (publicDealerApi.getPublicDealerProfile as jest.Mock).mockRejectedValue(
        new Error('Dealer not found')
      );

      const { result } = renderHook(() => usePublicDealerProfile(999), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });

    it('should not fetch when disabled', () => {
      renderHook(() => usePublicDealerProfile(1, { enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(publicDealerApi.getPublicDealerProfile).not.toHaveBeenCalled();
    });
  });

  describe('usePublicDealerListings', () => {
    it('should fetch dealer listings successfully', async () => {
      const mockListings = {
        content: [
          { id: 1, title: '2020 Toyota Camry' },
          { id: 2, title: '2019 Honda Civic' },
        ],
        page: 0,
        size: 12,
        totalElements: 2,
        totalPages: 1,
        empty: false,
      };
      (publicDealerApi.getPublicDealerListings as jest.Mock).mockResolvedValue(mockListings);

      const { result } = renderHook(() => usePublicDealerListings(1, 0, 12), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(publicDealerApi.getPublicDealerListings).toHaveBeenCalledWith(1, 0, 12);
      expect(result.current.data?.content).toHaveLength(2);
      expect(result.current.data?.totalElements).toBe(2);
    });

    it('should handle pagination correctly', async () => {
      const mockPage2 = {
        content: [{ id: 3, title: 'Car on page 2' }],
        page: 1,
        size: 12,
        totalElements: 25,
        totalPages: 3,
        empty: false,
      };
      (publicDealerApi.getPublicDealerListings as jest.Mock).mockResolvedValue(mockPage2);

      const { result } = renderHook(() => usePublicDealerListings(1, 1, 12), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(publicDealerApi.getPublicDealerListings).toHaveBeenCalledWith(1, 1, 12);
      expect(result.current.data?.page).toBe(1);
    });

    it('should handle empty listings', async () => {
      const mockEmptyListings = {
        content: [],
        page: 0,
        size: 12,
        totalElements: 0,
        totalPages: 0,
        empty: true,
      };
      (publicDealerApi.getPublicDealerListings as jest.Mock).mockResolvedValue(mockEmptyListings);

      const { result } = renderHook(() => usePublicDealerListings(1, 0, 12), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.content).toHaveLength(0);
      expect(result.current.data?.empty).toBe(true);
    });

    it('should not fetch when disabled', () => {
      renderHook(() => usePublicDealerListings(1, 0, 12, { enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(publicDealerApi.getPublicDealerListings).not.toHaveBeenCalled();
    });
  });
});
