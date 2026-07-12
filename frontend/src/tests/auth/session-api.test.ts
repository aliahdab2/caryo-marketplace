import { GET } from '@/app/api/auth/session/route';

// The route imports getServerSession from 'next-auth' (not 'next-auth/next')
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// jsdom's Response polyfill lacks the static Response.json that NextResponse.json
// relies on — mock next/server like the other route tests do
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: unknown, options?: { status?: number }) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
}));

describe('Session API Endpoint', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockGetServerSession = require('next-auth').getServerSession;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 200 with null data when no session exists', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/auth/session');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ user: null, accessToken: null, expires: null });
  });

  test('returns session data when authenticated', async () => {
    const mockSession = {
      user: {
        id: '123',
        name: 'testuser',
        email: 'test@example.com',
        image: null,
        roles: ['ROLE_USER']
      },
      accessToken: 'jwt-token-123',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    mockGetServerSession.mockResolvedValue(mockSession);

    const request = new Request('http://localhost:3000/api/auth/session');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      user: {
        id: '123',
        name: 'testuser',
        email: 'test@example.com',
        image: null,
        roles: ['ROLE_USER'],
        isAdmin: false
      },
      accessToken: 'jwt-token-123',
      expires: mockSession.expires
    });
  });

  test('flags admins via isAdmin', async () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'admin',
        email: 'admin@example.com',
        image: null,
        roles: ['ROLE_USER', 'ROLE_ADMIN']
      },
      accessToken: 'jwt-token-admin',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    mockGetServerSession.mockResolvedValue(mockSession);

    const request = new Request('http://localhost:3000/api/auth/session');
    const response = await GET(request);
    const data = await response.json();

    expect(data.user.isAdmin).toBe(true);
  });

  test('handles session without user data', async () => {
    const mockSession = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    mockGetServerSession.mockResolvedValue(mockSession);

    const request = new Request('http://localhost:3000/api/auth/session');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ user: null, accessToken: null, expires: null });
  });

  test('handles server errors gracefully with null session data', async () => {
    mockGetServerSession.mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost:3000/api/auth/session');
    const response = await GET(request);
    const data = await response.json();

    // The route intentionally returns 200 with null data on errors so
    // NextAuth's client doesn't treat it as a fetch failure
    expect(response.status).toBe(200);
    expect(data).toEqual({ user: null, accessToken: null, expires: null });
  });

  test('includes cookie header in request', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/auth/session', {
      headers: {
        'cookie': 'next-auth.session-token=test-token'
      }
    });

    await GET(request);

    expect(mockGetServerSession).toHaveBeenCalled();
  });
});
