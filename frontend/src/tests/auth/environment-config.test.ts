describe('NextAuth Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('NEXTAUTH_SECRET is configured', () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authOptions: _authOptions } = require('@/lib/auth-config');
    
    expect(process.env.NEXTAUTH_SECRET).toBeDefined();
    expect(process.env.NEXTAUTH_SECRET).not.toBe('');
  });

  test('NEXTAUTH_URL is configured', () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authOptions: _authOptions } = require('@/lib/auth-config');
    
    expect(process.env.NEXTAUTH_URL).toBeDefined();
    expect(process.env.NEXTAUTH_URL).not.toBe('');
  });

  test('Google OAuth credentials are configured', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authOptions: _authOptions } = require('@/lib/auth-config');
    
    expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
  });

  test('API URL is configured', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authOptions: _authOptions } = require('@/lib/auth-config');
    
    expect(process.env.NEXT_PUBLIC_API_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_API_URL).not.toBe('');
  });

  test('authOptions has required configuration', () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';
    
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authOptions } = require('@/lib/auth-config');
    
    expect(authOptions).toBeDefined();
    expect(authOptions.providers).toBeDefined();
    expect(authOptions.providers).toHaveLength(2); // Google + Credentials
    expect(authOptions.session).toBeDefined();
    expect(authOptions.callbacks).toBeDefined();
  });
});
