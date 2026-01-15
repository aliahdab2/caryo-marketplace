import { Page, expect } from '@playwright/test';

/**
 * Authentication helpers for E2E tests
 */

// Use existing dev users from DataInitializer
const TEST_USER = {
  username: 'user',
  email: 'user@caryo.sy',
  password: 'Password123!',
  name: 'Test User',
};

const ADMIN_USER = {
  username: 'admin',
  email: 'admin@caryo.sy',
  password: 'Admin123!',
  name: 'Admin User',
};

const DEALER_USER = {
  username: 'dealer',
  email: 'dealer@caryo.sy',
  password: 'Dealer123!',
  name: 'Test Dealer',
};

/**
 * Login as test user via UI
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await login(page, TEST_USER.email, TEST_USER.password);
}

/**
 * Login as dealer via UI
 */
export async function loginAsDealer(page: Page): Promise<void> {
  await login(page, DEALER_USER.email, DEALER_USER.password);
}

/**
 * Generic login function
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/auth/signin');
  
  // Wait for page to load
  await expect(page.getByLabel(/username or email/i)).toBeVisible();
  
  // Fill credentials (use username for login)
  await page.getByLabel(/username or email/i).fill(TEST_USER.username);
  await page.locator('#password').fill(TEST_USER.password);
  
  // Submit
  await page.locator('form button[type="submit"]').click();
  
  // Wait for redirect (dashboard or home)
  await page.waitForURL(/dashboard|\/[a-z]{2}\/?$/);
  
  // Verify logged in state
  await expect(page.getByTestId('user-menu-trigger').or(page.getByTestId('user-avatar'))).toBeVisible();
}

/**
 * Login via API (faster, for setup)
 */
export async function loginViaApi(page: Page, email: string, password: string): Promise<string> {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  
  const response = await page.request.post(`${apiUrl}/api/auth/signin`, {
    data: {
      username: email,
      password: password,
    },
  });
  
  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }
  
  const data = await response.json();
  return data.token || data.accessToken;
}

/**
 * Set auth token in browser storage (for API login)
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('accessToken', t);
  }, token);
}

/**
 * Logout via UI
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.getByTestId('user-menu-trigger').click();
  
  // Click logout button
  await page.getByTestId('logout-button').click();
  
  // Wait for redirect
  await page.waitForURL(/\/$|signin/);
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await expect(page.getByTestId('user-menu-trigger').or(page.getByTestId('user-avatar'))).toBeVisible({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure user is logged out
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  if (await isLoggedIn(page)) {
    await logout(page);
  }
}

export { TEST_USER, ADMIN_USER, DEALER_USER };
