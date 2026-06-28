import { expect, type Page } from '@playwright/test';

/**
 * CheckoutPage — encapsulates interactions with the Kroger checkout flow.
 *
 * The checkout flow includes multiple steps:
 * 1. "got-everything" page (Your Sale Items) — intermediate upsell page
 * 2. Scheduling page (/scheduling?fulfillmentType=CurbSide) — timeslot selection
 * 3. Payment page — payment method entry
 * 4. Review page — order review before placing
 * 5. Confirmation page — order confirmation after placing
 */
export default class CheckoutPage {
  constructor(public page: Page) {}

  // ── Actions ──────────────────────────────────────────────────────────────

  /**
   * Click "Continue to Checkout" on the intermediate "Your Sale Items" page.
   */
  async clickContinueToCheckout() {
    await this.continueToCheckoutButton.click();
  }

  /**
   * Select the first available pickup timeslot via JavaScript.
   * The radio buttons on the scheduling page are overlaid by labels,
   * so a direct JS click is required to bypass the label intercept.
   */
  async selectFirstTimeslot() {
    await this.page.evaluate(() => {
      const radios = document.querySelectorAll('input[type="radio"][name="Time Option"]');
      if (radios.length > 0) {
        (radios[0] as HTMLInputElement).click();
      }
    });
  }

  /**
   * Click the "Continue" button to advance past the scheduling/timeslot step.
   */
  async clickContinue() {
    await this.continueButton.click();
  }

  /**
   * Enter payment card details. Used when no saved payment method is available.
   */
  async enterPaymentDetails(
    cardNumber: string,
    expiry: string,
    cvv: string,
    nameOnCard: string
  ) {
    await this.page.getByLabel(/card number/i).fill(cardNumber);
    await this.page.getByLabel(/expir/i).fill(expiry);
    await this.page.getByLabel(/cvv|security code/i).fill(cvv);
    await this.page.getByLabel(/name on card/i).fill(nameOnCard);
  }

  /**
   * Click Place Order / Submit Order on the review page.
   */
  async placeOrder() {
    await this.placeOrderButton.click();
  }

  /**
   * Assert the checkout scheduling page is shown.
   */
  async expectSchedulingPage() {
    await expect(this.page).toHaveURL(/scheduling/);
    await expect(this.scheduleOrderHeading).toBeVisible();
  }

  /**
   * Assert the payment page is shown.
   */
  async expectPaymentPage() {
    await expect(this.paymentHeading).toBeVisible();
  }

  /**
   * Assert the order confirmation page is shown.
   */
  async expectOrderConfirmationPage() {
    await expect(this.page).toHaveURL(/confirmation|order-status|thank-you/i);
    await expect(this.confirmationHeading).toBeVisible();
    await expect(this.confirmationNumberText).toBeVisible();
  }

  // ── Locators ─────────────────────────────────────────────────────────────

  /** "Continue to Checkout" button on the intermediate "Your Sale Items" page */
  get continueToCheckoutButton() {
    return this.page.getByRole('button', { name: 'Continue to Checkout' }).first();
  }

  /** "Schedule your order" H1 heading on the scheduling page */
  get scheduleOrderHeading() {
    return this.page.getByRole('heading', { name: /Schedule your order/i });
  }

  /** "Continue" button on the scheduling page (after timeslot selection) */
  get continueButton() {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  /** Payment section heading (varies; matches "payment", "pay", etc.) */
  get paymentHeading() {
    return this.page.getByRole('heading', { name: /payment|pay/i }).first();
  }

  /** Place/Submit/Confirm Order button on the review page */
  get placeOrderButton() {
    return this.page.getByRole('button', { name: /Place Order|Submit Order|Confirm Order/i });
  }

  /** Order confirmation heading */
  get confirmationHeading() {
    return this.page.getByRole('heading', {
      name: /thank you|order confirmed|order placed|order received/i
    });
  }

  /** Confirmation number text element */
  get confirmationNumberText() {
    return this.page.getByText(/confirmation number|order number|order #/i);
  }

  /** Available time slot radio buttons on the scheduling page */
  get timeslotRadioButtons() {
    return this.page.getByRole('radio');
  }

  /** "Pickup Summary" heading on the scheduling page */
  get pickupSummaryHeading() {
    return this.page.getByRole('heading', { name: 'Pickup Summary' });
  }
}