import { expect, type Page } from '@playwright/test';

/**
 * ProductDetailPage — encapsulates interactions with the Kroger Product Detail
 * Page (PDP). Handles "Add to Cart" and item availability checks.
 */
export default class ProductDetailPage {
  constructor(public page: Page) {}

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Click "Add to Cart" button on the PDP. After clicking, the button transforms
   * into a quantity stepper showing the item quantity in cart.
   */
  async addToCart() {
    const addToCartBtn = this.page.getByRole('button', { name: /Add to Cart:/i });
    if (await addToCartBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addToCartBtn.click();
    } else {
      // Fallback: use the data-testid
      await this.page.getByTestId('pdp-add-to-cart').click();
    }
  }

  /**
   * Assert the product detail page loaded correctly.
   */
  async expectPageLoaded() {
    await expect(this.page).toHaveURL(/\/p\//);
    await expect(this.productHeading).toBeVisible();
  }

  /**
   * Assert the item is available for pickup.
   */
  async expectAvailableForPickup() {
    await expect(this.itemAvailabilityHeading).toBeVisible();
    await expect(this.availableForPickupText).toBeVisible();
  }

  // ── Locators ─────────────────────────────────────────────────────────────

  /** Main H1 product name heading */
  get productHeading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** "Item Availability" section heading (h3) */
  get itemAvailabilityHeading() {
    return this.page.getByRole('heading', { name: 'Item Availability' });
  }

  /** "Available" text within the Item Availability section (Pickup Available) */
  get availableForPickupText() {
    return this.page.getByText('Available').first();
  }

  /** The "Add to Cart" CTA button on the PDP */
  get addToCartButton() {
    return this.page.getByRole('button', { name: /Add to Cart:/i });
  }

  /** Quantity textbox showing items in cart (replaces Add to Cart after adding) */
  get quantityInCartTextbox() {
    return this.page.getByRole('textbox', { name: /Quantity of .+ in Cart/i });
  }

  /** Increment button in the quantity stepper */
  get incrementButton() {
    return this.page.getByRole('button', { name: /Increment .+ in Cart/i });
  }

  /** Decrement button in the quantity stepper */
  get decrementButton() {
    return this.page.getByRole('button', { name: /Decrement .+ in Cart/i });
  }
}