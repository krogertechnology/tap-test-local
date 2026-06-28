// ============================================================================
// SAMPLE DATABASE TEST — Use this as a reference for tests that verify
// data in a database after UI actions.
// Delete or replace this file once you have real tests.
// ============================================================================
//
// import { test, expect } from '@playwright/test';
// import { queryDb, closeAll } from '@utils/tap-db';
//
// // The connection name (e.g. 'KPADB') must match one configured in
// // TAP Project Settings → Database Connections.
// const DB_NAME = 'KPADB';
//
// test.describe('Database Verification', () => {
//
//   test.afterAll(async () => {
//     // Always close DB connections when tests are done
//     await closeAll();
//   });
//
//   test('should create a record in the database after form submission', async ({ page }) => {
//     // 1. Navigate to the form page
//     await page.goto('/items/new');
//
//     // 2. Fill out and submit the form
//     await page.getByRole('textbox', { name: 'Item Name' }).fill('Test Item');
//     await page.getByRole('textbox', { name: 'Description' }).fill('Created by automated test');
//     await page.getByRole('button', { name: 'Save' }).click();
//
//     // 3. Wait for success confirmation in the UI
//     await expect(page.getByText('Item created successfully')).toBeVisible();
//
//     // 4. Verify the record exists in the database
//     const rows = await queryDb(DB_NAME, 'SELECT * FROM items WHERE name = ?', ['Test Item']);
//     expect(rows.length).toBeGreaterThan(0);
//     expect((rows[0] as any).description).toBe('Created by automated test');
//   });
//
//   test('should verify database state before UI interaction', async ({ page }) => {
//     // 1. Query initial count from DB
//     const beforeRows = await queryDb(DB_NAME, 'SELECT COUNT(*) as cnt FROM items');
//     const beforeCount = (beforeRows[0] as any).cnt;
//
//     // 2. Perform UI action that modifies data
//     await page.goto('/items');
//     await page.getByRole('button', { name: 'Delete first item' }).click();
//     await page.getByRole('button', { name: 'Confirm' }).click();
//
//     // 3. Wait for UI confirmation
//     await expect(page.getByText('Item deleted')).toBeVisible();
//
//     // 4. Verify count decreased in DB
//     const afterRows = await queryDb(DB_NAME, 'SELECT COUNT(*) as cnt FROM items');
//     const afterCount = (afterRows[0] as any).cnt;
//     expect(afterCount).toBe(beforeCount - 1);
//   });
//
// });
