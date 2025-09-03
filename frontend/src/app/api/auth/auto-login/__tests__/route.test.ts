/**
 * @jest-environment jsdom
 */
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { AutoLoginRequest } from '@/types/auto-login';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  encode: jest.fn(),
}));

// Mock crypto.randomUUID using Object.defineProperty
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-12345'),
  },
  writable: true,
});

// Mock NextResponse
const mockCookiesSet = jest.fn();

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
      headers: new Headers(),
      cookies: {
        set: mockCookiesSet,
      },
    })),
  },
  NextRequest: jest.fn().mockImplementation((url, init) => {
    const request = new Request(url, init);
    return Object.assign(request, {
      nextUrl: new URL(url),
    });
  }),
}));

describe('/api/auth/auto-login', () => {
  const mockEncode = jest.requireMock('next-auth/jwt').encode;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEncode.mockResolvedValue('mock-encoded-jwt-token');
    (global.crypto.randomUUID as jest.Mock).mockReturnValue('mock-uuid-12345');
    mockCookiesSet.mockClear();
    process.env.NEXTAUTH_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET;
  });

  const createValidRequest = (body: AutoLoginRequest) => {
    return new Request('http://localhost:3000/api/auth/auto-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  };

  const validAutoLoginRequest: AutoLoginRequest = {
    token: 'valid.jwt.token',
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['ROLE_USER'],
    },
  };

  describe('Successful Auto-Login', () => {
    it('should create NextAuth session for valid request', async () => {
      const request = createValidRequest(validAutoLoginRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEncode).toHaveBeenCalledWith({
        token: expect.objectContaining({
          sub: '1',
          name: 'testuser',
          email: 'test@example.com',
          id: '1',
          roles: ['ROLE_USER'],
          accessToken: 'valid.jwt.token',
          provider: 'credentials',
        }),
        secret: 'test-secret-key',
      });
    });

    it('should set NextAuth session cookies', async () => {
      const request = createValidRequest(validAutoLoginRequest);
      await POST(request);

      expect(mockCookiesSet).toHaveBeenCalledWith(
        'next-auth.session-token',
        'mock-encoded-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false, // NODE_ENV !== 'production'
          sameSite: 'lax',
          maxAge: 24 * 60 * 60,
          path: '/',
        })
      );
    });

    it('should handle user with multiple roles', async () => {
      const requestWithMultipleRoles: AutoLoginRequest = {
        ...validAutoLoginRequest,
        user: {
          ...validAutoLoginRequest.user,
          roles: ['ROLE_USER', 'ROLE_ADMIN'],
        },
      };

      const request = createValidRequest(requestWithMultipleRoles);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEncode).toHaveBeenCalledWith({
        token: expect.objectContaining({
          roles: ['ROLE_USER', 'ROLE_ADMIN'],
        }),
        secret: 'test-secret-key',
      });
    });

    it('should handle user with empty roles array', async () => {
      const requestWithEmptyRoles: AutoLoginRequest = {
        ...validAutoLoginRequest,
        user: {
          ...validAutoLoginRequest.user,
          roles: [],
        },
      };

      const request = createValidRequest(requestWithEmptyRoles);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEncode).toHaveBeenCalledWith({
        token: expect.objectContaining({
          roles: [],
        }),
        secret: 'test-secret-key',
      });
    });
  });

  describe('Validation Errors', () => {
    it('should reject request with missing token', async () => {
      const invalidRequest = {
        user: validAutoLoginRequest.user,
      };

      const request = createValidRequest(invalidRequest as AutoLoginRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required authentication data');
    });

    it('should reject request with missing user', async () => {
      const invalidRequest = {
        token: 'valid.jwt.token',
      };

      const request = createValidRequest(invalidRequest as AutoLoginRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required authentication data');
    });

    it('should reject request with invalid token format', async () => {
      const invalidRequest: AutoLoginRequest = {
        token: 'invalid-token-without-dots',
        user: validAutoLoginRequest.user,
      };

      const request = createValidRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid token format');
    });

    it('should reject request with non-string token', async () => {
      const invalidRequest = {
        token: 12345, // Should be string
        user: validAutoLoginRequest.user,
      };

      const request = createValidRequest(invalidRequest as unknown as AutoLoginRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid token format');
    });

    it('should reject request with invalid user structure', async () => {
      const invalidRequest: AutoLoginRequest = {
        token: 'valid.jwt.token',
        user: {
          id: 'invalid', // Should be number
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        } as unknown as AutoLoginRequest['user'],
      };

      const request = createValidRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required authentication data');
    });
  });

  describe('Configuration Errors', () => {
    it('should handle missing NEXTAUTH_SECRET', async () => {
      delete process.env.NEXTAUTH_SECRET;

      const request = createValidRequest(validAutoLoginRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication configuration error');
    });
  });

  describe('JWT Encoding Errors', () => {
    it('should handle JWT encoding failure', async () => {
      mockEncode.mockRejectedValue(new Error('JWT encoding failed'));

      const request = createValidRequest(validAutoLoginRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication failed');
    });
  });

  describe('Malformed Request Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/auth/auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"malformed": json}', // Invalid JSON
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication failed');
    });

    it('should handle empty request body', async () => {
      const request = new Request('http://localhost:3000/api/auth/auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication failed');
    });
  });

  describe('Production Environment', () => {
    it('should set secure cookies in production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const request = createValidRequest(validAutoLoginRequest);
      await POST(request);

      expect(mockCookiesSet).toHaveBeenCalledWith(
        '__Secure-next-auth.session-token',
        'mock-encoded-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true, // Should be true in production
          sameSite: 'lax',
          maxAge: 24 * 60 * 60,
          path: '/',
        })
      );

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Session Data Structure', () => {
    it('should create correct JWT payload structure', async () => {
      const request = createValidRequest(validAutoLoginRequest);
      await POST(request);

      expect(mockEncode).toHaveBeenCalledWith({
        token: expect.objectContaining({
          // Standard JWT claims
          sub: '1',
          name: 'testuser',
          email: 'test@example.com',
          picture: null,
          iat: expect.any(Number),
          exp: expect.any(Number),
          jti: 'mock-uuid-12345',
          
          // Custom claims
          id: '1',
          roles: ['ROLE_USER'],
          accessToken: 'valid.jwt.token',
          provider: 'credentials',
        }),
        secret: 'test-secret-key',
      });
    });

    it('should set correct expiration time (24 hours)', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      
      const request = createValidRequest(validAutoLoginRequest);
      await POST(request);

      const afterTime = Math.floor(Date.now() / 1000);
      const expectedExp = beforeTime + (24 * 60 * 60);
      const maxExpectedExp = afterTime + (24 * 60 * 60);

      expect(mockEncode).toHaveBeenCalledWith({
        token: expect.objectContaining({
          exp: expect.any(Number),
        }),
        secret: 'test-secret-key',
      });

      const callArgs = mockEncode.mock.calls[0][0];
      expect(callArgs.token.exp).toBeGreaterThanOrEqual(expectedExp);
      expect(callArgs.token.exp).toBeLessThanOrEqual(maxExpectedExp);
    });
  });
});
