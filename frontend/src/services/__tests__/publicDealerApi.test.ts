import { getPublicDealerProfile, getPublicDealerListings } from '../publicDealerApi';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Public Dealer API', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicDealerProfile', () => {
    it('should fetch dealer profile with correct endpoint', async () => {
      // Arrange
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
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockProfile),
      });

      // Act
      const result = await getPublicDealerProfile(1);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/dealers/1/public`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          next: { revalidate: 300 },
        }
      );
      expect(result).toEqual(mockProfile);
    });

    it('should throw error when dealer not found', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ message: 'Dealer not found' }),
      });

      // Act & Assert
      await expect(getPublicDealerProfile(999)).rejects.toThrow(
        'Dealer not found'
      );
    });

    it('should throw error on network failure', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(getPublicDealerProfile(1)).rejects.toThrow('Network error');
    });
  });

  describe('getPublicDealerListings', () => {
    it('should fetch dealer listings with default pagination', async () => {
      // Arrange
      const mockListings = {
        content: [
          { id: 1, title: '2020 Toyota Camry' },
          { id: 2, title: '2019 Honda Civic' },
        ],
        page: 0,
        size: 12,
        totalElements: 2,
        totalPages: 1,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockListings),
      });

      // Act
      const result = await getPublicDealerListings(1);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/dealers/1/listings?page=0&size=12&sort=createdAt&direction=desc`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          next: { revalidate: 120 },
        }
      );
      expect(result).toEqual(mockListings);
      expect(result.content).toHaveLength(2);
    });

    it('should fetch dealer listings with custom pagination', async () => {
      // Arrange
      const mockListings = {
        content: [],
        page: 2,
        size: 24,
        totalElements: 50,
        totalPages: 3,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockListings),
      });

      // Act
      const result = await getPublicDealerListings(1, 2, 24);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/dealers/1/listings?page=2&size=24&sort=createdAt&direction=desc`,
        expect.any(Object)
      );
      expect(result.page).toBe(2);
      expect(result.size).toBe(24);
    });

    it('should throw error when dealer not found', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ message: 'Dealer not found' }),
      });

      // Act & Assert
      await expect(getPublicDealerListings(999)).rejects.toThrow(
        'Dealer not found'
      );
    });

    it('should handle empty listings', async () => {
      // Arrange
      const mockEmptyListings = {
        content: [],
        page: 0,
        size: 12,
        totalElements: 0,
        totalPages: 0,
        empty: true,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockEmptyListings),
      });

      // Act
      const result = await getPublicDealerListings(1);

      // Assert
      expect(result.content).toHaveLength(0);
      expect(result.empty).toBe(true);
    });
  });
});
