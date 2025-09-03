/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { AutoLoginRequest } from '@/types/auto-login';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  encode: jest.fn().mockResolvedValue('mocked-jwt-token'),
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXTAUTH_SECRET: 'test-secret',
    NODE_ENV: 'test',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('/api/auth/auto-login', () => {
  const validRequest: AutoLoginRequest = {
    token: 'valid.jwt.token',
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['ROLE_USER'],
    },
  };

  const createRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/auth/auto-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  describe('Success Cases', () => {
    it('should successfully create session for valid request', async () => {
      const request = createRequest(validRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(response.headers.get('set-cookie')).toContain('next-auth.session-token');
    });

    it('should set secure cookie in production', async () => {
      process.env.NODE_ENV = 'production';
      const request = createRequest(validRequest);
      const response = await POST(request);

      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toContain('__Secure-next-auth.session-token');
      expect(setCookieHeader).toContain('Secure');
    });

    it('should handle user with multiple roles', async () => {
      const requestWithRoles = {
        ...validRequest,
        user: {
          ...validRequest.user,
          roles: ['ROLE_USER', 'ROLE_ADMIN'],
        },
      };

      const request = createRequest(requestWithRoles);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Validation Errors', () => {
    it('should reject request with missing token', async () => {
      const invalidRequest = {
        ...validRequest,
        token: '',
      };

      const request = createRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required authentication data');
    });

    it('should reject request with missing user data', async () => {
      const invalidRequest = {
        token: 'valid.jwt.token',
        user: null,
      };

      const request = createRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required authentication data');
    });

    it('should reject request with invalid user structure', async () => {
      const invalidRequest = {
        token: 'valid.jwt.token',
        user: {
          id: 'invalid', // should be number
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      const request = createRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required authentication data');
    });

    it('should reject request with invalid token format', async () => {
      const invalidRequest = {
        ...validRequest,
        token: 'invalid-token-format',
      };

      const request = createRequest(invalidRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid token format');
    });

    it('should handle missing NEXTAUTH_SECRET', async () => {
      delete process.env.NEXTAUTH_SECRET;

      const request = createRequest(validRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Authentication configuration error');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Authentication failed');
    });

    it('should handle JWT encoding errors', async () => {
      const nextAuthJwt = await import('next-auth/jwt');
      const mockEncode = nextAuthJwt.encode as jest.MockedFunction<typeof nextAuthJwt.encode>;
      mockEncode.mockRejectedValueOnce(new Error('JWT encoding failed'));

      const request = createRequest(validRequest);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Authentication failed');
    });
  });
});
