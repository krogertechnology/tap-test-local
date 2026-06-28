// ============================================================================
// SAMPLE PAGE OBJECT — Use this pattern when creating page objects.
// Delete or replace this file once you have real page objects.
// ============================================================================
//
// Page objects encapsulate page interactions and locators in a reusable class.
// Place page objects in src/pages/ with a .page.ts suffix.
// Import them in tests using the @pages/ alias: import { LoginPage } from '@pages/login.page';
//
// import { expect, type Page } from '@playwright/test';
//
// export default class LoginPage {
//   constructor(public page: Page) {}
//
//   // ---- Actions ----
//
//   async login(username: string, password: string) {
//     await this.usernameInput.fill(username);
//     await this.passwordInput.fill(password);
//     await this.signInButton.click();
//   }
//
//   async expectLoggedIn() {
//     await expect(this.welcomeMessage).toBeVisible();
//   }
//
//   // ---- Locators ----
//
//   get usernameInput() {
//     return this.page.getByRole('textbox', { name: 'Username' });
//   }
//
//   get passwordInput() {
//     return this.page.getByRole('textbox', { name: 'Password' });
//   }
//
//   get signInButton() {
//     return this.page.getByRole('button', { name: 'Sign in' });
//   }
//
//   get welcomeMessage() {
//     return this.page.getByText('Welcome');
//   }
// }
