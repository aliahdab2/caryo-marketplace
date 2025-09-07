/**
 * Auth Test Constants
 *
 * Simple constants that can be copied directly into test files.
 * No complex factories - just plain objects that work with Jest.
 */

// Standard mock user for consistent testing
export const MOCK_USER = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
  roles: ['ROLE_USER']
};

// Standard mock session
export const MOCK_SESSION = {
  user: MOCK_USER,
  accessToken: 'test-token',
  expires: '2030-01-01T00:00:00.000Z'
};

// Alternative user for navbar tests
export const TESTUSER_MOCK_USER = {
  id: '123',
  name: 'testuser',
  email: 'testuser@example.com',
  image: 'https://example.com/avatar.jpg',
  roles: ['ROLE_USER']
};

export const TESTUSER_MOCK_SESSION = {
  user: TESTUSER_MOCK_USER,
  accessToken: 'test-token',
  expires: '2030-01-01T00:00:00.000Z'
};
