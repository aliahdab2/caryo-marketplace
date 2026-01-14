import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useSavedSearches, 
  useSavedSearch, 
  useCreateSavedSearch,
  useDeleteSavedSearch,
  savedSearchKeys 
} from '../useSavedSearches';
import * as savedSearchesService from '@/services/savedSearches';

// Mock the saved searches service
jest.mock('@/services/savedSearches', () => ({
  getUserSavedSearches: jest.fn(),
  getSavedSearchById: jest.fn(),
  createSavedSearch: jest.fn(),
  updateSavedSearch: jest.fn(),
  deleteSavedSearch: jest.fn(),
  getCarListingsForSavedSearch: jest.fn(),
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

describe('useSavedSearches hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('savedSearchKeys', () => {
    it('should generate correct query keys', () => {
      expect(savedSearchKeys.all).toEqual(['savedSearches']);
      expect(savedSearchKeys.lists()).toEqual(['savedSearches', 'list']);
      expect(savedSearchKeys.detail('abc')).toEqual(['savedSearches', 'detail', 'abc']);
      expect(savedSearchKeys.results('abc')).toEqual(['savedSearches', 'results', 'abc']);
    });
  });

  describe('useSavedSearches', () => {
    it('should fetch user saved searches', async () => {
      const mockSearches = [{ id: '1', nameEn: 'Search 1' }];
      (savedSearchesService.getUserSavedSearches as jest.Mock).mockResolvedValue(mockSearches);

      const { result } = renderHook(() => useSavedSearches(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockSearches);
    });
  });

  describe('useSavedSearch', () => {
    it('should fetch single saved search by id', async () => {
      const mockSearch = { id: 'abc', nameEn: 'My Search' };
      (savedSearchesService.getSavedSearchById as jest.Mock).mockResolvedValue(mockSearch);

      const { result } = renderHook(() => useSavedSearch('abc'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(savedSearchesService.getSavedSearchById).toHaveBeenCalledWith('abc');
      expect(result.current.data).toEqual(mockSearch);
    });

    it('should not fetch when id is undefined', () => {
      renderHook(() => useSavedSearch(undefined), {
        wrapper: createWrapper(),
      });

      expect(savedSearchesService.getSavedSearchById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateSavedSearch', () => {
    it('should create a new saved search', async () => {
      const mockRequest = {
        nameEn: 'New Search',
        filters: { minPrice: 1000 },
        notificationPreferences: { email: true, frequency: 'daily' as const },
      };
      const mockResponse = { id: '123', ...mockRequest };
      (savedSearchesService.createSavedSearch as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateSavedSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const response = await result.current.mutateAsync(mockRequest);
        expect(response).toEqual(mockResponse);
      });

      expect(savedSearchesService.createSavedSearch).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('useDeleteSavedSearch', () => {
    it('should delete a saved search', async () => {
      (savedSearchesService.deleteSavedSearch as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteSavedSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync('123');
      });

      expect(savedSearchesService.deleteSavedSearch).toHaveBeenCalledWith('123');
    });
  });
});
