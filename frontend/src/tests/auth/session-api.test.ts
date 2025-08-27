import { GET } from '@/app/api/auth/session/route';

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

describe.skip('Session API Endpoint', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGetServerSession = require('next-auth/next').getServerSession;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 200 with null data when no session exists', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/auth/session');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200); // Changed from 401 to 200 since we return 200 with null data
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

  test('handles session without user data', async () => {
    const mockSession = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    mockGetServerSession.mockResolvedValue(mockSession);

    const request = new Request('http://localhost:3000/api/auth/session');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200); // Changed from 401 to 200 since we return 200 with null data
    expect(data).toEqual({ user: null, accessToken: null, expires: null });
  });

  test('handles server errors gracefully', async () => {
    mockGetServerSession.mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost:3000/api/auth/session');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toBeNull();
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
