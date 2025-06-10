import { Session } from 'next-auth';

/**
 * Creates a mock session for tests
 * @param {Object} customProps - Optional custom properties to override defaults
 * @returns {Session} - A mock session object
 */
export function createMockSession(customProps = {}): Session {
  const defaultSession: Session = {
    user: {
      id: '123',
      name: 'Test User',
      email: 'testuser@example.com',
      image: 'https://via.placeholder.com/150',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    accessToken: 'mock-access-token',
  };

  return {
    ...defaultSession,
    ...customProps,
  };
}
