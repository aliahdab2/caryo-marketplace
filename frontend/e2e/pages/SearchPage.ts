import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Search/Browse Page
 * Encapsulates all selectors and actions for the search page
 */
export class SearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly listingCards: Locator;
  readonly filterSection: Locator;
  readonly makeFilter: Locator;
  readonly modelFilter: Locator;
  readonly priceMinInput: Locator;
  readonly priceMaxInput: Locator;
  readonly viewModeGrid: Locator;
  readonly viewModeList: Locator;
  readonly sortDropdown: Locator;
  readonly pagination: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/search|find/i).or(page.locator('input[name="search"]'));
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.listingCards = page.getByTestId('listing-card').or(page.locator('[data-testid*="listing"]'));
    this.filterSection = page.getByTestId('filters').or(page.locator('[class*="filter"]'));
    this.makeFilter = page.getByLabel(/make/i).or(page.locator('select[name="make"]'));
    this.modelFilter = page.getByLabel(/model/i).or(page.locator('select[name="model"]'));
    this.priceMinInput = page.getByPlaceholder(/min/i).or(page.locator('input[name*="min"]'));
    this.priceMaxInput = page.getByPlaceholder(/max/i).or(page.locator('input[name*="max"]'));
    this.viewModeGrid = page.getByTestId('view-mode-grid').or(page.getByRole('button', { name: /grid/i }));
    this.viewModeList = page.getByTestId('view-mode-list').or(page.getByRole('button', { name: /list/i }));
    this.sortDropdown = page.getByLabel(/sort/i).or(page.locator('select[name*="sort"]'));
    this.pagination = page.getByRole('navigation', { name: /pagination/i }).or(page.locator('[class*="pagination"]'));
    this.noResultsMessage = page.getByText(/no results|no listings|nothing found/i);
  }

  async goto() {
    await this.page.goto('/search');
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectMake(make: string) {
    await this.makeFilter.selectOption({ label: make });
  }

  async setViewMode(mode: 'grid' | 'list') {
    if (mode === 'grid') {
      await this.viewModeGrid.click();
    } else {
      await this.viewModeList.click();
    }
  }

  async clickFirstListing() {
    await this.listingCards.first().click();
  }

  async getListingCount(): Promise<number> {
    return this.listingCards.count();
  }

  async expectListings() {
    await expect(this.listingCards.first()).toBeVisible({ timeout: 10000 });
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
  }
}
