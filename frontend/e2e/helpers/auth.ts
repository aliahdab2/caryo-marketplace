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
  await login(page, TEST_USER.username, TEST_USER.password);
}

/**
 * Login as dealer via UI
 */
export async function loginAsDealer(page: Page): Promise<void> {
  await login(page, DEALER_USER.username, DEALER_USER.password);
}

/**
 * Generic login function
 */
export async function login(page: Page, usernameOrEmail: string, password: string): Promise<void> {
  await page.goto('/auth/signin');
  
  // Wait for page to load - use ID selector for reliability
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  
  // Fill credentials using ID selectors
  await page.locator('#username').fill(usernameOrEmail);
  await page.locator('#password').fill(password);
  
  // Submit
  await page.locator('form button[type="submit"]').click();
  
  // Wait for redirect (dashboard or home) - increase timeout
  await page.waitForURL(/dashboard|\/[a-z]{2}\/?$/, { timeout: 30000 });
  
  // Verify logged in state (with flexible selectors)
  await expect(
    page.getByTestId('user-menu-trigger')
      .or(page.getByTestId('user-avatar'))
      .or(page.getByRole('button', { name: /profile|account|menu/i }))
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Login via API (faster, for setup)
 */
export async function loginViaApi(page: Page, username: string, password: string): Promise<string> {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  
  const response = await page.request.post(`${apiUrl}/api/auth/signin`, {
    data: {
      username: username,
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
 * Login via API and set auth in browser storage (fastest method)
 */
export async function loginViaApiAndSetStorage(page: Page, username: string, password: string): Promise<void> {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  
  // Call signin API
  const response = await page.request.post(`${apiUrl}/api/auth/signin`, {
    data: {
      username: username,
      password: password,
    },
  });
  
  if (!response.ok()) {
    throw new Error(`API Login failed: ${response.status()}`);
  }
  
  const data = await response.json();
  const token = data.token || data.accessToken;
  
  if (!token) {
    throw new Error('No token in response');
  }
  
  // Navigate to app first (needed to set localStorage on correct domain)
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Set token in localStorage using all keys the app might check
  await page.evaluate(({ token, userData }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('accessToken', token);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  }, { 
    token, 
    userData: {
      id: data.id,
      username: data.username,
      email: data.email,
      roles: data.roles,
      accessToken: token,
    }
  });
  
  // Reload to apply auth state
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  // Give React time to hydrate with auth state
  await page.waitForTimeout(1000);
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
