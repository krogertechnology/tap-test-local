// ============================================================================
// SAMPLE UTILITIES — Use this pattern when creating shared helper functions.
// Delete or replace this file once you have real utilities.
// ============================================================================
//
// Place utility files in src/utils/ with a .ts suffix.
// Import them in tests or page objects using the @utils/ alias:
//   import { getPassword, formatDate } from '@utils/common-utils';
//
// import dotenv from 'dotenv';
// dotenv.config();
//
// /**
//  * Fetch a user's password from environment variables.
//  * Environment variable format: PASSWORD_{USERNAME} (uppercased)
//  */
// export function getPassword(username: string): string {
//   const key = `PASSWORD_${username.toUpperCase()}`;
//   const password = process.env[key];
//   if (!password) {
//     throw new Error(`Password not set for ${username} (env var: ${key})`);
//   }
//   return password;
// }
//
// /**
//  * Generate a unique string for test data isolation.
//  */
// export function uniqueId(prefix = 'test'): string {
//   return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
// }
//
// /**
//  * Wait for a condition with a custom timeout (useful for polling).
//  */
// export async function waitFor(
//   conditionFn: () => Promise<boolean>,
//   timeoutMs = 10000,
//   intervalMs = 500
// ): Promise<void> {
//   const start = Date.now();
//   while (Date.now() - start < timeoutMs) {
//     if (await conditionFn()) return;
//     await new Promise(r => setTimeout(r, intervalMs));
//   }
//   throw new Error(`waitFor timed out after ${timeoutMs}ms`);
// }
