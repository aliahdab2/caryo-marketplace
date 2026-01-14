import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useFavorites, 
  useFavoriteStatus, 
  useAddToFavorites,
  useRemoveFromFavorites,
  favoriteKeys 
} from '../useFavorites';
import * as favoritesService from '@/services/favorites';

// Mock the favorites service
jest.mock('@/services/favorites', () => ({
  getUserFavorites: jest.fn(),
  addToFavorites: jest.fn(),
  removeFromFavorites: jest.fn(),
  checkFavoriteStatus: jest.fn(),
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
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useFavorites hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('favoriteKeys', () => {
    it('should generate correct query keys', () => {
      expect(favoriteKeys.all).toEqual(['favorites']);
      expect(favoriteKeys.list()).toEqual(['favorites', 'list']);
      expect(favoriteKeys.status('123')).toEqual(['favorites', 'status', '123']);
    });
  });

  describe('useFavorites', () => {
    it('should fetch user favorites', async () => {
      const mockData = { favorites: [{ id: 1 }], total: 1 };
      (favoritesService.getUserFavorites as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useFavoriteStatus', () => {
    it('should check favorite status for a listing', async () => {
      const mockStatus = { isFavorite: true, listingId: '123' };
      (favoritesService.checkFavoriteStatus as jest.Mock).mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useFavoriteStatus('123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(favoritesService.checkFavoriteStatus).toHaveBeenCalledWith('123');
      expect(result.current.data).toEqual(mockStatus);
    });

    it('should not fetch when listingId is undefined', () => {
      renderHook(() => useFavoriteStatus(undefined), {
        wrapper: createWrapper(),
      });

      expect(favoritesService.checkFavoriteStatus).not.toHaveBeenCalled();
    });
  });

  describe('useAddToFavorites', () => {
    it('should add listing to favorites', async () => {
      (favoritesService.addToFavorites as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAddToFavorites(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync('123');
      });

      expect(favoritesService.addToFavorites).toHaveBeenCalledWith('123');
    });
  });

  describe('useRemoveFromFavorites', () => {
    it('should remove listing from favorites', async () => {
      (favoritesService.removeFromFavorites as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useRemoveFromFavorites(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync('456');
      });

      expect(favoritesService.removeFromFavorites).toHaveBeenCalledWith('456');
    });
  });
});
