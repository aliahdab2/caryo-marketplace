import { test, expect } from '@playwright/test';
import { loginAsTestUser, loginAsDealer, ensureLoggedOut } from '../helpers';
import { urls } from '../fixtures/test-data';

/**
 * Role-aware dashboard: private sellers (ROLE_USER) share the dealer routes
 * but must not see dealer branding — no Storefront, "My Listings" instead of
 * "Stock", "Messages" instead of "Leads". Dealers keep the dealer experience.
 *
 * Also guards the /api/v1/conversations/stats contract: the endpoint used to
 * not exist, so the request fell into GET /{id} and returned 500 for every
 * dashboard load.
 */
test.describe('Dashboard roles', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test.describe('DASH-ROLE-001: Regular user', () => {
    test('sidebar shows user labels and hides Storefront', async ({ page }) => {
      await loginAsTestUser(page);
      await page.goto('/dashboard/dealer');
      await page.waitForLoadState('load');

      // Nav items render twice (desktop sidebar + mobile menu) — assert on the first.
      await expect(page.getByTestId(/nav-item-.*-dashboard-dealer-stock$/).first()).toContainText('My Listings', { timeout: 15000 });
      await expect(page.getByTestId(/nav-item-.*-dashboard-dealer-leads$/).first()).toContainText('Messages');
      await expect(page.getByTestId(/nav-item-.*-dashboard-dealer-storefront$/)).toHaveCount(0);
    });

    test('conversation stats endpoint returns 200 on dashboard load', async ({ page }) => {
      await loginAsTestUser(page);

      const statsResponse = page.waitForResponse(
        (res) => res.url().includes('/api/v1/conversations/stats'),
        { timeout: 30000 }
      );
      await page.goto('/dashboard/dealer');

      // Status only: the page may navigate on before the body can be read,
      // and the response shape is covered by backend unit tests.
      const res = await statsResponse;
      expect(res.status(), 'GET /api/v1/conversations/stats must not 500 (was swallowed by /{id})').toBe(200);
    });

    test('no dealer trial requests are fired for a regular user', async ({ page }) => {
      const trialRequests: string[] = [];
      page.on('request', (req) => {
        if (req.url().includes('/api/v1/dealer/trial-status')) trialRequests.push(req.url());
      });

      await loginAsTestUser(page);
      await page.goto('/dashboard/dealer');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      expect(trialRequests, 'ROLE_USER must not spam the dealer trial endpoint (403s)').toHaveLength(0);
    });

    test('messages page renders for a regular user', async ({ page }) => {
      await loginAsTestUser(page);
      await page.goto(urls.messages);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // A blank page is the regression this guards against.
      const conversations = page.getByTestId('conversation-item').first();
      const emptyState = page
        .getByText(/no messages|no conversations( yet)?|inbox empty|start a conversation/i)
        .first();
      await expect(conversations.or(emptyState)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('DASH-ROLE-002: Dealer', () => {
    test('sidebar keeps dealer labels and Storefront', async ({ page }) => {
      await loginAsDealer(page);
      await page.goto('/dashboard/dealer');
      await page.waitForLoadState('load');

      await expect(page.getByTestId(/nav-item-.*-dashboard-dealer-stock$/).first()).toContainText('Stock', { timeout: 15000 });
      await expect(page.getByTestId(/nav-item-.*-dashboard-dealer-leads$/).first()).toContainText('Leads');
      // The first DOM match is the hidden mobile-menu copy, so assert presence
      // by count (symmetric with the regular-user toHaveCount(0) check).
      await expect(page.getByTestId(/nav-item-.*-dashboard-dealer-storefront$/)).not.toHaveCount(0);
    });

    test('conversation stats endpoint returns 200 for dealer', async ({ page }) => {
      await loginAsDealer(page);

      const statsResponse = page.waitForResponse(
        (res) => res.url().includes('/api/v1/conversations/stats'),
        { timeout: 30000 }
      );
      await page.goto('/dashboard/dealer');

      const res = await statsResponse;
      expect(res.status()).toBe(200);
    });
  });
});
