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
      .or(page.getByRole('button', { name: /profile|account|menu/i })).first()
  ).toBeVisible({ timeout: 10000 });
}

/**
 * Login via API (faster, for setup)
 */
export async function loginViaApi(page: Page, username: string, password: string): Promise<string> {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  let retries = 3;
  
  while (retries > 0) {
    const response = await page.request.post(`${apiUrl}/api/auth/signin`, {
      data: {
        username: username,
        password: password,
      },
      failOnStatusCode: false
    });
    
    if (response.status() === 429) {
      const retryAfter = response.headers()['retry-after'];
      const waitTime = retryAfter ? (parseInt(retryAfter, 10) * 1000) + 1000 : 5000;
      console.log(`⚠️ Rate limited (429), waiting ${waitTime}ms before retry... (${retries} retries left)`);
      await page.waitForTimeout(waitTime);
      retries--;
      continue;
    }

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()}`);
    }
    
    const data = await response.json();
    return data.token || data.accessToken;
  }
  
  throw new Error('Login failed after retries due to rate limiting');
}

/**
 * Login via API and set auth in browser storage (fastest method)
 */
export async function loginViaApiAndSetStorage(
  page: Page, 
  username: string, 
  password: string,
  destinationUrl: string = '/'
): Promise<void> {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  let retries = 3;
  let data;
  
  while (retries > 0) {
    const response = await page.request.post(`${apiUrl}/api/auth/signin`, {
      data: {
        username: username,
        password: password,
      },
      failOnStatusCode: false
    });

    if (response.status() === 429) {
      const retryAfter = response.headers()['retry-after'];
      const waitTime = retryAfter ? (parseInt(retryAfter, 10) * 1000) + 1000 : 5000;
      console.log(`⚠️ Rate limited (429), waiting ${waitTime}ms before retry... (${retries} retries left)`);
      await page.waitForTimeout(waitTime);
      retries--;
      continue;
    }
  
    if (!response.ok()) {
      throw new Error(`API Login failed: ${response.status()}`);
    }
    
    data = await response.json();
    break;
  }

  if (!data) throw new Error('Login failed after retries');

  const token = data.token || data.accessToken;
  
  if (!token) {
    throw new Error('No token in response');
  }
  
  // Navigate to app first (needed to set localStorage on correct domain)
  // Use addInitScript to ensure localStorage is set before any code runs
  await page.addInitScript(({ token, userData }) => {
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

  await page.goto(destinationUrl);
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
  // Check if we're on mobile and need to open menu first
  const mobileToggle = page.getByTestId('mobile-menu-toggle');
  if (await mobileToggle.isVisible()) {
    await mobileToggle.click();
    await expect(page.getByTestId('mobile-user-profile').or(page.getByText('Logout'))).toBeVisible();
    
    // Find logout in mobile menu (it might be a specific button or just text)
    const mobileLogout = page.locator('button').filter({ hasText: /logout/i });
    if (await mobileLogout.isVisible()) {
      await mobileLogout.click();
    } else {
      // Fallback
      await page.getByTestId('logout-button').click();
    }
  } else {
    // Desktop: Click user menu
    await page.getByTestId('user-menu-trigger').click();
    // Click logout button
    await page.getByTestId('logout-button').click();
  }
  
  // Wait for redirect
  await page.waitForURL(/\/$|signin/);
}

/**
 * Verify that user is logged in, handling both Desktop and Mobile views
 */
export async function verifyLoggedIn(page: Page): Promise<void> {
  // Try desktop first (fast path)
  const desktopMenu = page.getByTestId('user-menu-trigger')
    .or(page.getByTestId('user-avatar'))
    .or(page.getByRole('button', { name: /profile|account|menu/i })).first();

  try {
    await expect(desktopMenu).toBeVisible({ timeout: 2000 });
    return;
  } catch (e) {
    // Specific mobile check
    const mobileToggle = page.getByTestId('mobile-menu-toggle');
    if (await mobileToggle.isVisible()) {
      // Open menu to verify
      await mobileToggle.click();
      
      // Check for user info in mobile menu
      const mobileUserInfo = page.getByTestId('mobile-user-profile');
      await expect(mobileUserInfo).toBeVisible({ timeout: 5000 });
      
      // Close menu to reset state
      await mobileToggle.click();
      return;
    }
    
    // Rerthrow original error if neither worked
    throw e;
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await verifyLoggedIn(page);
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

/**
 * Create a fresh dealer account and login with it
 * This avoids rate limiting issues with shared test accounts
 */
export async function createFreshDealerAndLogin(page: Page): Promise<any> {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8080';
  const timestamp = Date.now();
  const username = `dealer_${timestamp}`;
  const email = `dealer_${timestamp}@example.com`;
  const password = 'Dealer123!';

  // 1. Login as Admin first to create user (fastest way if admin endpoint exists, otherwise public reg)
  // Using public registration for now as it's safer assumption
  const response = await page.request.post(`${apiUrl}/api/auth/signup`, {
    data: {
      username,
      email,
      password,
      confirmPassword: password,
      name: `Test Dealer ${timestamp}`,
      sellerTypeId: 2, // Assuming 2 is Dealer
      businessName: `Test Dealership ${timestamp}`,
      roles: ['dealer']
    }
  });

  if (!response.ok()) {
    const text = await response.text();
    console.error(`Signup failed body: ${text}`);
    throw new Error(`Failed to create fresh dealer: ${response.status()} - ${text}`);
  }

  // 2. Login as the new dealer
  await loginViaApiAndSetStorage(page, username, password);
  
  return { username, email, password };
}

export { TEST_USER, ADMIN_USER, DEALER_USER };
