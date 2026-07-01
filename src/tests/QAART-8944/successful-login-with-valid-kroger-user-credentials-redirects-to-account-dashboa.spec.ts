import { test, expect } from '@playwright/test';
import KrogerLoginPage from '@pages/kroger-login.page';
import { loadData } from '@utils/data-loader';
import { skipIfNotInTapFilter } from '@utils/tap-test-filter';

interface UsersData {
  '': Record<string, string>;
}

test.describe('Kroger Login', () => {
  test.beforeEach(({}, testInfo) => skipIfNotInTapFilter(testInfo));

  test('Successful Login with Valid Kroger User Credentials Redirects to Account Dashboard', async ({ page }) => {
    // Load credentials from users.json — ENV references resolved automatically at runtime
    const users = loadData<UsersData>('users.json');
    const email = 'vikram311991@gmail.com';
    const password = users[''][email];

    const loginPage = new KrogerLoginPage(page);

    // Step 1: Navigate to the Kroger staging login page
    // Expected: The Kroger login page loads successfully and displays input fields for email and password
    await loginPage.goto();
    await loginPage.expectSignInPageVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    // Step 2: Enter the registered user's email address in the email field
    // Expected: The email field contains the entered registered user's email address
    await loginPage.fillEmail(email);
    await expect(loginPage.emailInput).toHaveValue(email);

    // Step 3: Enter the registered user's password in the password field
    // Expected: The password field is populated
    await loginPage.fillPassword(password);
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordInput).not.toHaveValue('');

    // Step 4: Click the 'Sign In' button
    // Expected: Login request is submitted; a loading indicator or transition appears
    await loginPage.clickSignIn();
    await expect(page).not.toHaveURL(/signin/);

    // Step 5: Verify that the user is successfully authenticated and redirected to their account dashboard
    // Expected: User is redirected to their account dashboard page and the welcome message is displayed
    await page.waitForURL('**/account/dashboard/**', { timeout: 30000 });
    await expect(page).toHaveURL(/account\/dashboard/);
    await expect(page).toHaveTitle('My Account - Kroger');
    await expect(
      page.getByRole('heading', { name: /Welcome,\s+Vikram Reddy/i, level: 1 })
    ).toBeVisible();
  });
});
