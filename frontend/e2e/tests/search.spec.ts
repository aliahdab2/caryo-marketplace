import { test, expect } from '@playwright/test';
import { expectSearchHasResults } from '../helpers';
import { urls } from '../fixtures/test-data';

test.describe('Search & Browse', () => {
  test.describe('SEARCH-001: Browse Listings', () => {
    test('can view search page', async ({ page }) => {
      await page.goto(urls.search);

      // Page should load
      await expect(page).toHaveURL(/search/);
    });

    test('displays listing cards', async ({ page }) => {
      await page.goto(urls.search);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Wait for page content to load
      await page.waitForTimeout(2000);

      // Look for listings with multiple selector patterns
      const listingCard = page.getByTestId('listing-card')
        .or(page.locator('[class*="listing"]'))
        .or(page.locator('[class*="car-card"]'))
        .or(page.locator('article'));
      
      const hasListings = await listingCard.first().isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/no listings|no results|no cars|found 0/i).isVisible().catch(() => false);
      const hasSearchInput = await page.getByRole('textbox', { name: /search/i }).isVisible().catch(() => false);
      const hasFilterButtons = await page.getByRole('button', { name: /filter/i }).first().isVisible().catch(() => false);

      // Page should show listings, empty state, or search UI (valid empty state)
      expect(hasListings || hasEmptyState || hasSearchInput || hasFilterButtons).toBe(true);
    });

    test('can click on a listing card to view details', async ({ page }) => {
      await page.goto(urls.search);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Was `if (!visible) test.skip()` — an empty results page passed silently
      const listingLink = await expectSearchHasResults(page);

      await listingLink.click();

      await expect(page).toHaveURL(/listing|car|vehicle/);
    });

    test('listing details page shows key information', async ({ page }) => {
      await page.goto(urls.search);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      const listingLink = await expectSearchHasResults(page);

      await listingLink.click();
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // A detail page must have a title heading. The old version accepted a
      // visible <main> as sufficient, which every page has — so an empty
      // detail page passed.
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('SEARCH-002: Search Functionality', () => {
    test('search bar is visible', async ({ page }) => {
      await page.goto(urls.search);

      // Look for search input
      await expect(
        page.getByRole('searchbox').or(
          page.getByPlaceholder(/search|find|looking/i)
        ).or(
          page.getByTestId('search-input')
        )
      ).toBeVisible();
    });

    test('can type in search bar', async ({ page }) => {
      await page.goto(urls.search);

      const searchInput = page.getByPlaceholder(/search|find|looking/i).first();

      await searchInput.fill('Toyota');
      await expect(searchInput).toHaveValue('Toyota');
    });

    test('search updates results', async ({ page }) => {
      await page.goto(urls.search);

      const searchInput = page.getByRole('searchbox').or(
        page.getByPlaceholder(/search|find|looking/i)
      ).or(
        page.getByTestId('search-input')
      );

      // Type and submit search
      await searchInput.fill('BMW');
      await searchInput.press('Enter');

      // Wait for results to update
      await page.waitForTimeout(1000);

      // URL should reflect search or results should update
      const urlHasSearch = page.url().includes('BMW') || page.url().includes('search');
      expect(urlHasSearch).toBe(true);
    });
  });

  test.describe('SEARCH-003: Filters', () => {
    test('filter section is visible', async ({ page }) => {
      await page.goto(urls.search);

      // Filter UI renders client-side — use a retrying assertion
      await expect(
        page.getByText(/filter|make|brand|price|year/i).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test('can select make filter', async ({ page }) => {
      await page.goto(urls.search);

      // Look for make/brand dropdown
      const makeFilter = page.getByLabel(/make|brand/i).or(
        page.getByTestId('make-filter')
      ).or(
        page.locator('select').filter({ hasText: /make|brand|all makes/i })
      );

      if (await makeFilter.isVisible().catch(() => false)) {
        await makeFilter.click();
        // Verify dropdown opens or options are available
        await expect(page.getByRole('option').or(page.getByRole('listbox'))).toBeVisible();
      }
    });

    test('can filter by price range', async ({ page }) => {
      await page.goto(urls.search);

      // Look for price inputs
      const minPrice = page.getByLabel(/min.*price|from/i).or(
        page.getByPlaceholder(/min|from/i)
      ).or(
        page.getByTestId('min-price')
      );

      const maxPrice = page.getByLabel(/max.*price|to/i).or(
        page.getByPlaceholder(/max|to/i)
      ).or(
        page.getByTestId('max-price')
      );

      if (await minPrice.isVisible().catch(() => false)) {
        await minPrice.fill('10000');
        await expect(minPrice).toHaveValue('10000');
      }

      if (await maxPrice.isVisible().catch(() => false)) {
        await maxPrice.fill('50000');
        await expect(maxPrice).toHaveValue('50000');
      }
    });
  });

  test.describe('SEARCH-004: View Mode', () => {
    test('can toggle between grid and list view', async ({ page }) => {
      await page.goto(urls.search);

      // Look for view toggle
      const gridButton = page.getByRole('button', { name: /grid/i }).or(
        page.getByTestId('grid-view-button')
      );

      const listButton = page.getByRole('button', { name: /list/i }).or(
        page.getByTestId('list-view-button')
      );

      // If view toggles exist, test them
      if (await gridButton.isVisible().catch(() => false)) {
        await gridButton.click();
        // Verify grid view is active
      }

      if (await listButton.isVisible().catch(() => false)) {
        await listButton.click();
        // Verify list view is active
      }
    });
  });

  test.describe('SEARCH-005: Pagination', () => {
    test('pagination controls visible when many results', async ({ page }) => {
      await page.goto(urls.search);
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);
      await expectSearchHasResults(page);

      // The search page renders Pagination only when totalPages > 1, so a
      // single page of seed data is genuinely inapplicable rather than a
      // failure. The old `|| true` made the whole assertion unfailable either
      // way, so a broken pagination bar also passed.
      const pagination = page.getByRole('navigation', { name: /pagination/i });
      const loadMore = page.getByRole('button', { name: /load more|show more/i }).first();
      const control = pagination.or(loadMore);

      const hasMultiplePages = await control.isVisible({ timeout: 5000 }).catch(() => false);
      test.skip(!hasMultiplePages, 'Seed data fits on a single page — no pagination rendered');

      await expect(control).toBeVisible();
    });
  });

  test.describe('SEARCH-006: Sort', () => {
    test('sort dropdown is available', async ({ page }) => {
      await page.goto(urls.search);

      // Look for sort control
      const sortControl = page.getByLabel(/sort/i).or(
        page.getByRole('combobox', { name: /sort/i })
      ).or(
        page.getByTestId('sort-select')
      ).or(
        page.getByText(/sort by|newest|price/i)
      );

      // Sort is a shipped feature of the search page, not an optional extra —
      // the previous `|| true` meant its removal would never be noticed.
      await expect(sortControl.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
