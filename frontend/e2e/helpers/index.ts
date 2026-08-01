/**
 * E2E Test Helpers
 * 
 * Export all helper functions for easy importing in tests.
 * 
 * Usage in tests:
 * import { loginAsTestUser, logout, TEST_USER } from '../helpers';
 */

export {
  loginAsTestUser,
  loginAsDealer,
  login,
  loginViaApi,
  setAuthToken,
  logout,
  isLoggedIn,
  ensureLoggedOut,
  TEST_USER,
  ADMIN_USER,
  DEALER_USER,
} from './auth';

export { gotoSeededListing, expectSearchHasResults, expectMessagesPageRendered } from './preconditions';
