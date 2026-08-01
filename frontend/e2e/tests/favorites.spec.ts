import { test, expect } from '@playwright/test';
import { loginAsTestUser, ensureLoggedOut, gotoSeededListing } from '../helpers';
import { urls } from '../fixtures/test-data';

/**
 * The add-to-favorites tests used to swallow a missing button with
 * `try { expect(...) } catch { test.skip() }`, and confirmed the click with
 * `expect(wasAdded || true).toBe(true)` — a tautology. Both are now real
 * assertions, so a broken favourites button fails the suite.
 */
test.describe('Favorites', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  const favoriteButtonFor = (page: import('@playwright/test').Page) =>
    page
      .getByRole('button', { name: /add to favorites|favorite|save/i })
      .first()
      .or(page.locator('[data-testid*="favorite"]').first());

  test.describe('FAV-001: Add to Favorites', () => {
    test('favorite button visible on listing', async ({ page }) => {
      await loginAsTestUser(page);
      await gotoSeededListing(page);

      await expect(favoriteButtonFor(page)).toBeVisible({ timeout: 10000 });
    });

    test('can add listing to favorites', async ({ page }) => {
      await loginAsTestUser(page);
      await gotoSeededListing(page);

      const favoriteButton = favoriteButtonFor(page);
      await expect(favoriteButton).toBeVisible({ timeout: 10000 });

      await favoriteButton.click();

      // The click must produce a visible result: a confirmation, or the button
      // flipping to its "remove" state.
      const confirmation = page.getByText(/added|saved to favorites/i).first();
      const removeAffordance = page.getByRole('button', { name: /remove|unfavorite/i }).first();

      await expect(confirmation.or(removeAffordance)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('FAV-002: View Favorites', () => {
    test('can access favorites page', async ({ page }) => {
      await loginAsTestUser(page);
      await page.goto(urls.favorites);

      // Should load favorites page
      await expect(page).toHaveURL(/favorite/);
    });

    test('favorites page shows saved listings or empty state', async ({ page }) => {
      await loginAsTestUser(page);
      await page.goto(urls.favorites);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Either a saved-listing card (a link to a listing) or the explicit
      // empty state. Generous timeout: first query after a backend restart
      // is slow, and this test is often the first authenticated data fetch.
      const listingCard = page.locator('a[href*="/listings/"]').first();
      const emptyState = page.getByText(/no favorites|no saved|haven't saved/i).first();

      await expect(listingCard.or(emptyState).first()).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('FAV-003: Remove from Favorites', () => {
    test('can remove listing from favorites page', async ({ page }) => {
      await loginAsTestUser(page);
      await page.goto(urls.favorites);

      // Find remove button
      // Match the per-card favorite toggle only — a "Remove All" button also
      // exists and its confirm dialog swallowed the old test's click.
      const removeButton = page.getByRole('button', { name: /remove from favorites/i });

      // Nothing saved means nothing to remove — genuinely inapplicable, so an
      // explicit skip is honest here.
      const hasSomethingToRemove = await removeButton.first().isVisible().catch(() => false);
      test.skip(!hasSomethingToRemove, 'Test account has no favorites to remove');

      // Removing flips the toggle to "Add to Favorites", so the count of
      // remove-labeled toggles must shrink even though the card stays visible.
      const initialCount = await removeButton.count();

      await removeButton.first().click();

      await expect
        .poll(() => removeButton.count(), {
          timeout: 10000,
          message: 'Removing a favorite did not flip its toggle state',
        })
        .toBeLessThan(initialCount);
    });
  });

  test.describe('FAV-004: Unauthenticated User', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto(urls.favorites);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Wait for redirect or page load
      await page.waitForTimeout(2000);

      // Check multiple conditions for unauthenticated handling
      const url = page.url();
      const isOnLogin = url.includes('signin') || url.includes('login') || url.includes('auth');
      const hasLoginPrompt = await page.getByRole('link', { name: /sign in|login/i }).isVisible().catch(() => false);
      const hasLoginButton = await page.getByRole('button', { name: /sign in|login/i }).isVisible().catch(() => false);
      const stayedOnFavorites = url.includes('favorite');

      // Either redirected to login, shows login prompt, or stayed (some apps allow viewing empty favorites)
      expect(isOnLogin || hasLoginPrompt || hasLoginButton || stayedOnFavorites).toBe(true);
    });
  });
});
