// ============================================================================
// SAMPLE TEST — Use this as a reference when writing Playwright tests.
// Delete or replace this file once you have real tests.
// ============================================================================
//
// import { test, expect } from '@playwright/test';
// import { LoginPage } from '@pages/login.page';
//
// test.describe('User Authentication', () => {
//
//   test('should login with valid credentials', async ({ page }) => {
//     const loginPage = new LoginPage(page);
//
//     // 1. Navigate to the login page
//     await page.goto('/login');
//
//     // 2. Fill in credentials and submit
//     await loginPage.login('testuser', 'password123');
//
//     // 3. Verify successful login
//     await loginPage.expectLoggedIn();
//   });
//
//   test('should show error for invalid password', async ({ page }) => {
//     const loginPage = new LoginPage(page);
//
//     // 1. Navigate to the login page
//     await page.goto('/login');
//
//     // 2. Attempt login with wrong password
//     await loginPage.login('testuser', 'wrong-password');
//
//     // 3. Verify error message is displayed
//     await expect(page.getByText('Invalid credentials')).toBeVisible();
//   });
//
// });
