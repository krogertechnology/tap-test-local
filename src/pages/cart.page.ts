import { expect, type Page } from '@playwright/test';

/**
 * CartPage — encapsulates interactions with the Kroger shopping cart page (/cart).
 * Shows cart contents, payment summary, and checkout button.
 */
export default class CartPage {
  constructor(public page: Page) {}

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Navigate to the cart page directly.
   */
  async goto() {
    await this.page.goto('/cart');
  }

  /**
   * Click "Check Out Pickup" button to proceed to checkout.
   */
  async clickCheckoutPickup() {
    await this.checkoutPickupButton.click();
  }

  /**
   * Assert the cart page has loaded with the expected item.
   */
  async expectCartLoaded() {
    await expect(this.page).toHaveURL(/\/cart/);
    await expect(this.yourCartHeading).toBeVisible();
  }

  // ── Locators ─────────────────────────────────────────────────────────────

  /** "Your Cart" H1 heading on the cart page */
  get yourCartHeading() {
    return this.page.getByRole('heading', { name: 'Your Cart' });
  }

  /** "Pickup" section heading in the cart */
  get pickupSectionHeading() {
    return this.page.getByRole('heading', { name: 'Pickup' });
  }

  /** Subtotal text showing item count e.g. "Subtotal (1 items)" */
  get subtotalText() {
    return this.page.getByText(/Subtotal \(1 item/i);
  }

  /** Product image for Lactaid milk in the cart */
  get productImage() {
    return this.page.getByRole('img', { name: /Image of Lactaid Lactose Free 2% Reduced Fat Milk/i });
  }

  /** "Estimated Total" heading in the Payment Summary */
  get estimatedTotalHeading() {
    return this.page.getByRole('heading', { name: 'Estimated Total' });
  }

  /** "Check Out Pickup" CTA button — the primary checkout action */
  get checkoutPickupButton() {
    return this.page.getByRole('button', { name: 'Check Out Pickup' });
  }

  /** "Pickup Details" section heading */
  get pickupDetailsHeading() {
    return this.page.getByRole('heading', { name: 'Pickup Details' });
  }

  /** Cart icon/link in navigation showing item count */
  get cartNavLink() {
    return this.page.getByRole('link', { name: /cart \d+ item/i });
  }
}