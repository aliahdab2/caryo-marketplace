import { test, expect } from '@playwright/test';

test.describe('Subscription Management', () => {
  // Use global auth state from global-setup.ts (login happens once, reused by all tests)
  test.use({ storageState: 'e2e/.auth/dealer-auth.json' });

  test('should display subscription page and handle upgrade flow', async ({ page }) => {
    // ========================================
    // Set up API mocks BEFORE navigation
    // ========================================
    const mockTrialStatus = {
      active: true,
      canCreateListings: true,
      listingsUsed: 5,
      listingsLimit: 15,
      subscriptionTier: 'trial',
      daysRemaining: 10,
      usagePercent: 33,
      subscriptionStatus: 'active',
      expiresAt: '2026-02-01T00:00:00Z',
      inGracePeriod: false,
      graceEndsAt: null,
      listingsRemaining: 10
    };

    // 1. Set up API mocks BEFORE navigation
    await page.route('**/api/dealer/trial-status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: mockTrialStatus
      });
    });

    await page.route('**/api/dealer/can-create-listing', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          canCreate: true,
          reason: 'OK',
          trialStatus: mockTrialStatus
        }
      });
    });

    await page.route('**/api/pricing/tiers', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          data: [
            { id: 'basic', name: 'Basic', price: 99, currency: 'USD', listingLimit: 100, features: ['100 Active Listings', 'Basic Analytics'], recommended: false, popular: false },
            { id: 'advanced', name: 'Advanced', price: 199, currency: 'USD', listingLimit: 250, features: ['250 Active Listings', 'Advanced Analytics'], recommended: true, popular: true },
            { id: 'professional', name: 'Professional', price: 299, currency: 'USD', listingLimit: -1, features: ['Unlimited Listings', 'Premium Analytics'], recommended: false, popular: false }
          ]
        }
      });
    });

    await page.route('**/api/payments/subscription', async route => {
      // Verify request payload
      const postData = route.request().postDataJSON();
      expect(postData.tier).toBe('advanced');
      expect(postData.providerId).toBe('manual_transfer');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          success: true,
          message: 'Subscription created',
          paymentInstructions: 'Please transfer to account X'
        }
      });
    });

    // 2. Navigate to Subscription Page
    await page.goto('/dashboard/subscription');

    // 3. Verify Page Content (wait for page to load instead of networkidle)
    await expect(page.getByRole('heading', { name: /Subscription Management/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('5 / 15')).toBeVisible();
    // Use role=heading to avoid matching feature text like "Basic Analytics"
    await expect(page.getByRole('heading', { name: 'Basic' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Advanced' })).toBeVisible();

    // 4. Verify Subscription Status section
    await expect(page.getByText(/Subscription Status/i)).toBeVisible();
    await expect(page.getByText('Trial', { exact: true })).toBeVisible();

    // 5. Verify all plans show Upgrade button (since trial is not in the plans list)
    const upgradeButtons = page.getByRole('button', { name: /Upgrade/i });
    await expect(upgradeButtons.first()).toBeEnabled();

    // 6. Test Upgrade Interaction on Advanced plan
    // Setup dialog handler for the confirm() call BEFORE clicking
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      // Dialog message may have translation placeholders, so just verify it's a confirm dialog
      await dialog.accept();
    });

    // Find and click the Advanced plan's upgrade button
    // The cards are in order: Basic, Advanced, Professional
    const advancedUpgradeBtn = upgradeButtons.nth(1);
    await advancedUpgradeBtn.click();

    // 7. Verify Success Toast
    await expect(page.getByText(/Subscription upgraded successfully/i)).toBeVisible({ timeout: 5000 });
  });
});
