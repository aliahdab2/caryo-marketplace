/**
 * Custom error class for session expiration
 * Thrown when a 401 response is received from the API
 */
export class SessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}
