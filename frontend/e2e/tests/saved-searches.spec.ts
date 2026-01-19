import { test, expect } from '@playwright/test';
import { urls } from '../fixtures/test-data';
import path from 'path';

const userAuthFile = path.join(__dirname, '../.auth/user-auth.json');

test.describe('Saved Searches', () => {
  
  test.describe('Unauthenticated', () => {
    // Clear auth for this group
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects to login when unauthenticated', async ({ page }) => {
      await page.goto(urls.savedAlerts);
      // Should be redirected to signin
      await expect(page).toHaveURL(/signin|auth/);
    });
  });

  test.describe('Authenticated', () => {
    // Reuse the auth state created in global-setup
    test.use({ storageState: userAuthFile });

    test('can load saved alerts page when authenticated', async ({ page }) => {
      await page.goto(urls.savedAlerts);
      await page.waitForLoadState('networkidle');
      
      // Verify page title
      await expect(page.getByRole('heading', { name: /alerts/i }).first()).toBeVisible();
      
      // Should show either list of alerts or empty state
      const hasEmptyState = await page.getByText(/no alerts yet/i).isVisible().catch(() => false);
      const hasAlertList = await page.getByText(/settings for my alerts/i).isVisible().catch(() => false);
      
      expect(hasEmptyState || hasAlertList).toBe(true);
    });

    test('renders empty state correctly', async ({ page }) => {
      // Mocking response is better for stability - set up route BEFORE navigation
      await page.route('**/api/saved-searches', route => {
        // Small delay to simulate real network for better test realism
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        }, 100);
      });

      await page.goto(urls.savedAlerts);
      await page.waitForLoadState('networkidle');
      
      // Wait for either loading to finish or content to appear
      await page.waitForTimeout(1000);

      // Use more robust selectors
      const emptyStateText = page.getByText(/no alerts yet|no saved searches/i);
      const searchLink = page.getByRole('link', { name: /search for cars|browse/i }).or(
        page.getByRole('button', { name: /search|create/i })
      );

      await expect(emptyStateText).toBeVisible({ timeout: 10000 });
      await expect(searchLink).toBeVisible();
    });
  });

});
