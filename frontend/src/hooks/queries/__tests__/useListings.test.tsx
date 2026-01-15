import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useListings, 
  useListing, 
  useMyListings, 
  useFeaturedListings,
  listingKeys 
} from '../useListings';
import * as listingsService from '@/services/listings';

// Mock the listings service
jest.mock('@/services/listings', () => ({
  getListings: jest.fn(),
  getListingById: jest.fn(),
  getMyListings: jest.fn(),
  getFeaturedListings: jest.fn(),
  createListing: jest.fn(),
  updateListing: jest.fn(),
  deleteListingById: jest.fn(),
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

describe('useListings hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listingKeys', () => {
    it('should generate correct query keys', () => {
      expect(listingKeys.all).toEqual(['listings']);
      expect(listingKeys.lists()).toEqual(['listings', 'list']);
      expect(listingKeys.list({ minPrice: '1000' })).toEqual(['listings', 'list', { minPrice: '1000' }]);
      expect(listingKeys.details()).toEqual(['listings', 'detail']);
      expect(listingKeys.detail('123')).toEqual(['listings', 'detail', '123']);
      expect(listingKeys.myListings()).toEqual(['listings', 'my']);
      expect(listingKeys.featured()).toEqual(['listings', 'featured']);
    });
  });

  describe('useListings', () => {
    it('should fetch listings with filters', async () => {
      const mockData = { listings: [{ id: 1 }], total: 1 };
      (listingsService.getListings as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useListings({ minPrice: '1000' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(listingsService.getListings).toHaveBeenCalledWith({ minPrice: '1000' });
      expect(result.current.data).toEqual(mockData);
    });

    it('should handle errors', async () => {
      (listingsService.getListings as jest.Mock).mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useListings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Failed');
    });
  });

  describe('useListing', () => {
    it('should fetch single listing by id', async () => {
      const mockListing = { id: '123', title: 'Test Car' };
      (listingsService.getListingById as jest.Mock).mockResolvedValue(mockListing);

      const { result } = renderHook(() => useListing('123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(listingsService.getListingById).toHaveBeenCalledWith('123');
      expect(result.current.data).toEqual(mockListing);
    });

    it('should not fetch when id is undefined', () => {
      renderHook(() => useListing(undefined), {
        wrapper: createWrapper(),
      });

      expect(listingsService.getListingById).not.toHaveBeenCalled();
    });
  });

  describe('useMyListings', () => {
    it('should fetch user listings', async () => {
      const mockListings = [{ id: 1 }, { id: 2 }];
      (listingsService.getMyListings as jest.Mock).mockResolvedValue(mockListings);

      const { result } = renderHook(() => useMyListings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockListings);
    });
  });

  describe('useFeaturedListings', () => {
    it('should fetch featured listings', async () => {
      const mockListings = [{ id: 1, featured: true }];
      (listingsService.getFeaturedListings as jest.Mock).mockResolvedValue(mockListings);

      const { result } = renderHook(() => useFeaturedListings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockListings);
    });
  });
});
