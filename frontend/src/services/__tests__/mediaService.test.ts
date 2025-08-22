import { hasImageOrderChanged, getImageReorderMapping, reorderMediaItems } from '../mediaService';

// Mock next-auth/react
const mockGetSession = jest.fn();
jest.mock('next-auth/react', () => ({
  getSession: () => mockGetSession()
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('mediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasImageOrderChanged', () => {
    it('should return false when order is unchanged', () => {
      const original = ['url1', 'url2', 'url3'];
      const current = ['url1', 'url2', 'url3'];
      
      expect(hasImageOrderChanged(original, current)).toBe(false);
    });

    it('should return true when order is changed', () => {
      const original = ['url1', 'url2', 'url3'];
      const current = ['url3', 'url2', 'url1'];
      
      expect(hasImageOrderChanged(original, current)).toBe(true);
    });

    it('should return true when arrays have different lengths', () => {
      const original = ['url1', 'url2', 'url3'];
      const current = ['url1', 'url2'];
      
      expect(hasImageOrderChanged(original, current)).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(hasImageOrderChanged([], [])).toBe(false);
    });
  });

  describe('getImageReorderMapping', () => {
    const existingMediaItems = [
      { id: 1, url: 'url1' },
      { id: 2, url: 'url2' },
      { id: 3, url: 'url3' }
    ];

    it('should create correct mapping for reordered images', () => {
      const original = ['url1', 'url2', 'url3'];
      const current = ['url3', 'url1', 'url2'];
      
      const mapping = getImageReorderMapping(original, current, existingMediaItems);
      
      expect(mapping).toEqual([
        { id: 3, sortOrder: 0 }, // url3 moved to position 0
        { id: 1, sortOrder: 1 }, // url1 moved to position 1
        { id: 2, sortOrder: 2 }  // url2 moved to position 2
      ]);
    });

    it('should handle missing media items gracefully', () => {
      const original = ['url1', 'url2', 'url4']; // url4 doesn't exist in media items
      const current = ['url2', 'url1', 'url4'];
      
      const mapping = getImageReorderMapping(original, current, existingMediaItems);
      
      expect(mapping).toEqual([
        { id: 2, sortOrder: 0 }, // url2 moved to position 0
        { id: 1, sortOrder: 1 }  // url1 moved to position 1
        // url4 is ignored since it doesn't exist in existingMediaItems
      ]);
    });

    it('should return empty array for empty inputs', () => {
      const mapping = getImageReorderMapping([], [], []);
      expect(mapping).toEqual([]);
    });
  });

  describe('reorderMediaItems', () => {
    const mockSession = {
      accessToken: 'mock-token'
    };

    const reorderItems = [
      { id: 1, sortOrder: 2 },
      { id: 2, sortOrder: 0 },
      { id: 3, sortOrder: 1 }
    ];

    beforeEach(() => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';
    });

    it('should successfully reorder media items', async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await reorderMediaItems('123', reorderItems);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/listings/123/media/order',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify(reorderItems)
        }
      );
    });

    it('should throw error when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      await expect(reorderMediaItems('123', reorderItems))
        .rejects.toThrow('You need to log in to reorder media');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error when API request fails', async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Forbidden' })
      });

      await expect(reorderMediaItems('123', reorderItems))
        .rejects.toThrow('Forbidden');
    });

    it('should handle API error without message', async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(reorderMediaItems('123', reorderItems))
        .rejects.toThrow('Failed to reorder media: 500');
    });

    it('should handle network errors', async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(reorderMediaItems('123', reorderItems))
        .rejects.toThrow('Network error');
    });

    it('should use default API URL when env var not set', async () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      
      mockGetSession.mockResolvedValue(mockSession);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await reorderMediaItems('123', reorderItems);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/listings/123/media/order',
        expect.any(Object)
      );
    });
  });
});
