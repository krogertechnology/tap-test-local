import { test, expect } from '@playwright/test';
import { loadData } from '@utils/data-loader';
import LoginPage from '@pages/login.page';
import { skipIfNotInTapFilter } from '@utils/tap-test-filter';

interface UsersData {
  '': Record<string, string>;
}

test.describe('Successful Login to Kroger Stage with Valid User Credentials', () => {
  test.beforeEach(({ }, testInfo) => {
    skipIfNotInTapFilter(testInfo);
  });

  test('Validates that a registered Kroger user can log in with correct credentials and is redirected to their account dashboard.', async ({ page }) => {
    // FIX: Increase timeout to account for OAuth redirect chain + React hydration latency.
    test.setTimeout(90000);
    // Load credentials from users.json — passwords resolved via TAP_TEST_SECRETS at runtime
    const users = loadData<UsersData>('users.json');
    const username = 'vikram311991@gmail.com';
    const password = users[''][username];

    const loginPage = new LoginPage(page);

    // Step 1: Navigate to the Kroger stage login page
    // Expected: The Kroger stage login page loads and the login form is visible.
    // Navigating to /signin triggers a CIAM OAuth redirect to login-stage.kroger.com
    await page.goto('/signin');
    await expect(page).toHaveURL(/login-stage\.kroger\.com/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    // Step 2: Enter a valid registered email address into the username/email field
    // Expected: The email address is accepted in the username/email field without errors.
    await loginPage.fillEmail(username);
    await expect(loginPage.emailInput).toHaveValue(username);

    // Step 3: Enter the corresponding password into the password field
    // Expected: The password is accepted in the password field without errors.
    await loginPage.fillPassword(password);
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // Step 4: Click on the 'Sign In' login button
    // Expected: The sign-in process is triggered and authentication flow begins.
    // Playwright auto-waits for the action to complete before proceeding.
    await loginPage.submitSignIn();

    // Step 5: Wait for the login response and redirection
    // Expected: User is redirected to their account dashboard page.
    // CIAM OAuth flow completes and redirects back to www-stage.kroger.com.
    // FIX: waitForURL matches the interim /connect-auth URL immediately; we must wait for
    // the final redirect to finish (connect-auth processes the OAuth code and redirects to /).
    await page.waitForURL(/www-stage\.kroger\.com\/(?!connect-auth)/, { timeout: 30000 });
    await expect(page).toHaveURL(/www-stage\.kroger\.com/);

    // Step 6: Verify that the dashboard is loaded by checking for a user-specific element
    // Expected: The user's account dashboard is displayed with user-specific elements visible.
    // The Kroger header renders a button with the user's display name "Vikram Reddy" when logged in.
    // FIX: The previous assertion used 'Omar' which doesn't match the account holder; the actual
    // display name shown in the header button is "Vikram Reddy" for vikram311991@gmail.com.
    await loginPage.expectLoggedIn('Vikram Reddy');
  });
});
