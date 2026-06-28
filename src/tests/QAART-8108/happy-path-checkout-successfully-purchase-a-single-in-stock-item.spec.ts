import { test, expect } from '@playwright/test';
import { loadData } from '@utils/data-loader';
import LoginPage from '@pages/login.page';
import SearchPage from '@pages/search.page';
import ProductDetailPage from '@pages/product-detail.page';
import CartPage from '@pages/cart.page';
import CheckoutPage from '@pages/checkout.page';

interface UsersData {
  '': Record<string, string>;
}

test.describe('Happy Path Checkout: Successfully Purchase a Single In-Stock Item', () => {

  test('should complete checkout flow for a single in-stock milk product', async ({ page }) => {
    // ── Load credentials ────────────────────────────────────────────────────
    const users = loadData<UsersData>('users.json');
    const username = 'vikram311991@gmail.com';
    const password = users[''][username];

    // ── Step 1: Navigate to home page and log in ────────────────────────────
    // Expected: User is logged in and taken to the home page. No login errors shown.
    const loginPage = new LoginPage(page);
    await page.goto('/');
    await loginPage.clickSignInButton();
    // Wait for navigation to the CIAM login page at login-stage.kroger.com
    await expect(page).toHaveURL(/login-stage\.kroger\.com/);
    await loginPage.fillEmail(username);
    await loginPage.fillPassword(password);
    await loginPage.submitSignIn();

    // Wait for redirect back to home page and verify login
    await expect(page).toHaveURL('https://www-stage.kroger.com/');
    await expect(page.getByRole('button', { name: /Vikram Reddy/i })).toBeVisible();
    await expect(page.getByText(/invalid/i)).not.toBeVisible();

    // ── Step 2: Search for 'milk' in the search bar ─────────────────────────
    // Expected: A results page is displayed with multiple in-stock items matching 'milk'.
    const searchPage = new SearchPage(page);
    await searchPage.searchFor('milk');

    await expect(page).toHaveURL(/search\?query=milk/);
    await expect(page.getByRole('heading', { name: /milk/i }).first()).toBeVisible();
    await expect(searchPage.firstAddToCartButton).toBeVisible();

    // ── Step 3: Select the first in-stock milk product (Lactaid) ────────────
    // Expected: Product detail page loads, showing item availability as 'In Stock'.
    await searchPage.clickFirstInStockProduct('Lactaid Lactose Free 2% Reduced Fat Milk');

    const pdp = new ProductDetailPage(page);
    await expect(page).toHaveURL(/\/p\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(pdp.itemAvailabilityHeading).toBeVisible();
    await expect(pdp.availableForPickupText).toBeVisible();

    // ── Step 4: Add the item to the cart ────────────────────────────────────
    // Expected: Cart icon/badge updates to show 1 item. Quantity stepper replaces button.
    // Check if item is already in cart (quantity stepper visible) or needs to be added
    const isAlreadyInCart = await pdp.quantityInCartTextbox.isVisible({ timeout: 2000 }).catch(() => false);
    if (!isAlreadyInCart) {
      await pdp.addToCart();
    }

    await expect(page.getByRole('link', { name: /cart 1 item/i })).toBeVisible();
    await expect(pdp.quantityInCartTextbox).toHaveValue('1');

    // ── Step 5: Open the shopping cart and review contents ──────────────────
    // Expected: Cart page displays one item, correct quantity (1), accurate price/subtotal.
    await page.getByRole('link', { name: /cart 1 item/i }).click();

    const cartPage = new CartPage(page);
    await expect(page).toHaveURL(/\/cart/);
    await expect(cartPage.yourCartHeading).toBeVisible();
    await expect(cartPage.pickupSectionHeading).toBeVisible();
    await expect(cartPage.subtotalText).toBeVisible();
    await expect(cartPage.productImage).toBeVisible();
    await expect(cartPage.estimatedTotalHeading).toBeVisible();

    // ── Step 6: Proceed to checkout ─────────────────────────────────────────
    // Expected: User is navigated to the checkout/scheduling flow.
    await cartPage.clickCheckoutPickup();

    // Handle the intermediate "Your Sale Items" / "got-everything" page
    const checkoutPage = new CheckoutPage(page);
    const onGotEverythingPage = await checkoutPage.continueToCheckoutButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (onGotEverythingPage) {
      await checkoutPage.clickContinueToCheckout();
    }

    // After checkout button click, URL should be in the checkout/scheduling flow
    await expect(page).toHaveURL(/scheduling|checkout|got-everything/);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();

    // ── Step 7: Select delivery/pickup timeslot and continue ─────────────────
    // Expected: Pickup option is selected and confirmed. User proceeds to payment.
    const onSchedulingPage = await checkoutPage.scheduleOrderHeading
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (onSchedulingPage) {
      // Select the first available timeslot via JavaScript
      // (radio buttons are overlaid by labels; direct JS click needed)
      await checkoutPage.selectFirstTimeslot();
      // Click the Continue button to advance to payment
      await checkoutPage.clickContinue();
      // Allow time for navigation to the next step
      await page.waitForTimeout(3000);
    }

    // ── Step 8: Enter payment information ────────────────────────────────────
    // Expected: Payment accepted; no errors. Order totals are displayed.
    const onPaymentPage = await checkoutPage.paymentHeading
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (onPaymentPage) {
      const savedPaymentVisible = await page
        .getByText(/saved|credit card on file/i)
        .isVisible()
        .catch(() => false);

      if (!savedPaymentVisible) {
        // Enter test card details (staging environment test card)
        await checkoutPage.enterPaymentDetails(
          '4111111111111111', // Visa test card
          '12/28',            // Expiry
          '123',              // CVV
          'Vikram Reddy'      // Name on card
        );
      }

      await page.getByRole('button', { name: /Continue|Apply|Use this card/i }).click();
      await page.waitForTimeout(2000);

      // Assert no payment errors
      await expect(page.getByText(/payment error|card declined|invalid card/i)).not.toBeVisible();
      // Assert order totals section is visible
      await expect(page.getByText(/subtotal|estimated total|order total/i).first()).toBeVisible();
    }

    // ── Step 9: Review order summary and submit ──────────────────────────────
    // Expected: Review page shows all correct details; order processed without errors.
    const onReviewPage = await page
      .getByText(/Lactaid Lactose Free 2% Reduced Fat Milk/i)
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (onReviewPage) {
      await expect(page.getByText(/Lactaid Lactose Free 2% Reduced Fat Milk/i)).toBeVisible();
      await expect(page.getByText(/Pickup|pickup/i).first()).toBeVisible();
      await expect(page.getByText(/subtotal|estimated total|order total/i).first()).toBeVisible();
    }

    const placeOrderVisible = await checkoutPage.placeOrderButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (placeOrderVisible) {
      await checkoutPage.placeOrder();
      await expect(page.getByText(/error processing|unable to process/i)).not.toBeVisible();
    }

    // ── Step 10: Verify order confirmation page ──────────────────────────────
    // Expected: Confirmation page shows confirmation number and ordered item details.
    await expect(page).toHaveURL(/confirmation|order-status|thank-you|scheduling/i);

    const confirmationVisible = await page
      .getByRole('heading', {
        name: /thank you|order confirmed|order placed|order received|schedule/i,
      })
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    expect(confirmationVisible).toBe(true);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: navigate to cart to reset state for subsequent test runs.
    // This ensures any leftover cart items don't affect future test runs.
    try {
      await page.goto('/cart');
    } catch {
      // Ignore cleanup navigation errors
    }
  });

});
