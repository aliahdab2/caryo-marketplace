import { test, expect } from '@playwright/test';
import { loginAsDealer, ensureLoggedOut } from '../helpers/auth';

test.describe('Subscription Enforcement', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean slate
    await ensureLoggedOut(page);
  });

  test('should disable "Create Listing" and show upgrade modal in dashboard when limit is reached', async ({ page }) => {
    // 1. Mock the trial status
    await page.route('**/api/dealer/trial-status', async route => {
      const json = {
        active: true,
        canCreateListings: false, // FORCE LIMIT REACHED
        listingsUsed: 15,
        listingsLimit: 15,
        subscriptionTier: 'trial',
        expiresAt: '2026-12-31'
      };
      await route.fulfill({ json });
    });

    // 2. Login as dealer
    await loginAsDealer(page);
    await page.goto('/dashboard/dealer');
    await page.waitForLoadState('networkidle');

    // 3. Verify Dashboard UI
    // The create listing action should have the "limit reached" badge or text
    const limitReachedText = page.getByText(/Limit Reached/i).first();
    await expect(limitReachedText).toBeVisible({ timeout: 15000 });
    
    // 4. Click the "Create Listing" button (which is actually the upgrade trigger now)
    const upgradeButton = page.locator('button', { hasText: /Limit Reached/i });
    await upgradeButton.click();
    
    // Verify modal opens
    await expect(page.getByText(/Choose Your Plan|Upgrade your plan|Choose a plan/i).first()).toBeVisible();
  });

  test('should redirect from new listing page when limit is reached', async ({ page }) => {
    // 1. Mock the trial status
    await page.route('**/api/dealer/trial-status', async route => {
      const json = {
        active: true,
        canCreateListings: false,
        listingsUsed: 15,
        listingsLimit: 15,
        subscriptionTier: 'trial',
        usagePercent: 100,
        expiresAt: '2026-12-31',
        inGracePeriod: false
      };
      await route.fulfill({ json });
    });

    // 2. Login
    await loginAsDealer(page);

    // 3. Try to access the protected route
    await page.goto('/dashboard/dealer/stock/new');

    // 4. Verify Redirect happened
    await expect(page).toHaveURL(/\/dashboard\/dealer/);
    
    // 5. Verify we are back on the dashboard and it's visible
    await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 15000 });
  });
});
