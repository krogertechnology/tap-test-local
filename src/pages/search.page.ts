import { expect, type Page } from '@playwright/test';

/**
 * SearchPage — encapsulates interactions with the Kroger search functionality
 * and search results page.
 */
export default class SearchPage {
  constructor(public page: Page) {}

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Type a search term in the search bar and submit.
   */
  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  /**
   * Click the first in-stock product matching the given name in search results.
   */
  async clickFirstInStockProduct(productName: string) {
    await this.page.getByRole('link', { name: new RegExp(productName, 'i') }).first().click();
  }

  /**
   * Assert the search results page is loaded with results for the given query.
   */
  async expectResultsFor(query: string) {
    await expect(this.page).toHaveURL(new RegExp(`search\\?query=${encodeURIComponent(query)}`));
    await expect(this.page.getByRole('heading', { name: new RegExp(query, 'i') }).first()).toBeVisible();
  }

  // ── Locators ─────────────────────────────────────────────────────────────

  /** The main search input (combobox) in the header, identified by data-testid */
  get searchInput() {
    return this.page.getByTestId('SearchBar-input');
  }

  /** The search submit button adjacent to the search bar */
  get searchButton() {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  /** Status element showing loaded product count */
  get productStatus() {
    return this.page.getByRole('status');
  }

  /** First visible "Add to Cart" button on search results — confirms in-stock items */
  get firstAddToCartButton() {
    return this.page.getByRole('button', { name: /Add to Cart/i }).first();
  }
}