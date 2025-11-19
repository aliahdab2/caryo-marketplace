import { createSubscription, getPaymentHistory, getPaymentStatus } from '../dealerApi';

// Mock the apiRequest function from session-manager
jest.mock('@/services/auth/session-manager', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@/services/auth/session-manager';

const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('Dealer Payment API', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create subscription with correct endpoint and payload', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          transactionId: 'TXN-12345',
          message: 'Payment instructions sent',
        }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act
      const result = await createSubscription('basic');

      // Assert
      expect(mockedApiRequest).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/payments/subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            providerId: 'manual_transfer',
            tier: 'basic',
            paymentMethod: 'BANK_TRANSFER',
          }),
        }
      );
      expect(result).toEqual({
        success: true,
        paymentInstructions: 'Payment instructions sent',
        transactionId: 'TXN-12345',
      });
    });

    it('should handle subscription creation failure', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 400,
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act & Assert
      await expect(createSubscription('basic')).rejects.toThrow(
        'Failed to create subscription: 400'
      );
    });

    it('should handle network errors', async () => {
      // Arrange
      mockedApiRequest.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(createSubscription('basic')).rejects.toThrow('Network error');
    });

    it('should work with all tier types', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          transactionId: 'TXN-12345',
          message: 'Payment instructions sent',
        }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      const tiers = ['basic', 'advanced', 'professional'];

      // Act & Assert
      for (const tier of tiers) {
        mockedApiRequest.mockClear();
        await createSubscription(tier);
        
        expect(mockedApiRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining(`"tier":"${tier}"`),
          })
        );
      }
    });
  });

  describe('getPaymentHistory', () => {
    it('should fetch payment history with correct endpoint', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 1,
          transactionId: 'TXN-001',
          amount: 50.0,
          currency: 'USD',
          status: 'COMPLETED',
        },
        {
          id: 2,
          transactionId: 'TXN-002',
          amount: 100.0,
          currency: 'USD',
          status: 'PENDING_VERIFICATION',
        },
      ];

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          transactions: mockTransactions,
          count: 2,
          dealerId: 1,
          dealerName: 'Test Dealer',
        }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act
      const result = await getPaymentHistory();

      // Assert
      expect(mockedApiRequest).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/payments/history`,
        {
          method: 'GET',
        }
      );
      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array when no transactions exist', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          transactions: [],
          count: 0,
          dealerId: 1,
          dealerName: 'Test Dealer',
        }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act
      const result = await getPaymentHistory();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle missing transactions field in response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          count: 0,
          dealerId: 1,
          dealerName: 'Test Dealer',
        }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act
      const result = await getPaymentHistory();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle payment history fetch failure', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act & Assert
      await expect(getPaymentHistory()).rejects.toThrow(
        'Failed to fetch payment history: 500'
      );
    });

    it('should handle network errors', async () => {
      // Arrange
      mockedApiRequest.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(getPaymentHistory()).rejects.toThrow('Network error');
    });
  });

  describe('getPaymentStatus', () => {
    it('should fetch payment status with correct endpoint', async () => {
      // Arrange
      const transactionId = 'TXN-12345';
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          transactionId: 'TXN-12345',
          status: 'COMPLETED',
          message: 'Payment completed successfully',
        }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act
      const result = await getPaymentStatus(transactionId);

      // Assert
      expect(mockedApiRequest).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/payments/status/${transactionId}`,
        {
          method: 'GET',
        }
      );
      expect(result).toEqual({
        success: true,
        transactionId: 'TXN-12345',
        status: 'COMPLETED',
        message: 'Payment completed successfully',
      });
    });

    it('should handle payment status fetch failure', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 404,
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act & Assert
      await expect(getPaymentStatus('TXN-99999')).rejects.toThrow(
        'Failed to fetch payment status: 404'
      );
    });

    it('should handle network errors', async () => {
      // Arrange
      mockedApiRequest.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(getPaymentStatus('TXN-12345')).rejects.toThrow('Network error');
    });

    it('should work with different transaction ID formats', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          status: 'PENDING',
        }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      const transactionIds = [
        'TXN-12345',
        'PAY_abc123def456',
        'MTF-2024-001',
      ];

      // Act & Assert
      for (const txnId of transactionIds) {
        mockedApiRequest.mockClear();
        await getPaymentStatus(txnId);
        
        expect(mockedApiRequest).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/payments/status/${txnId}`,
          expect.any(Object)
        );
      }
    });
  });

  describe('API endpoint consistency', () => {
    it('should use consistent base URL across all payment endpoints', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act
      await createSubscription('basic');
      await getPaymentHistory();
      await getPaymentStatus('TXN-123');

      // Assert
      const calls = mockedApiRequest.mock.calls;
      expect(calls[0][0]).toContain(API_BASE_URL);
      expect(calls[1][0]).toContain(API_BASE_URL);
      expect(calls[2][0]).toContain(API_BASE_URL);
    });

    it('should use correct HTTP methods for all endpoints', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockedApiRequest.mockResolvedValue(mockResponse as unknown as Response);

      // Act
      await createSubscription('basic');
      await getPaymentHistory();
      await getPaymentStatus('TXN-123');

      // Assert
      const calls = mockedApiRequest.mock.calls;
      expect(calls[0][1]?.method).toBe('POST');   // createSubscription
      expect(calls[1][1]?.method).toBe('GET');    // getPaymentHistory
      expect(calls[2][1]?.method).toBe('GET');    // getPaymentStatus
    });
  });

  describe('Error handling and logging', () => {
    it('should log errors to console', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockedApiRequest.mockRejectedValue(new Error('Test error'));

      // Act
      try {
        await createSubscription('basic');
      } catch {
        // Expected error
      }

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating subscription:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

