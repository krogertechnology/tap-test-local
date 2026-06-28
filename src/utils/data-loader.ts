import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Data Loader Utility
 *
 * Loads JSON test data from src/data/ and resolves environment variable
 * references (ENV:VAR_NAME) to actual values at runtime.
 *
 * Usage in tests:
 *   import { loadData } from '@utils/data-loader';
 *
 *   const users = loadData<UserData>('users.json');
 *   // Passwords stored as "ENV:PASSWORD_TESTUSER1" are automatically
 *   // resolved to the actual environment variable value.
 */

// Cache parsed TAP_TEST_SECRETS so we only parse once
let _secretsCache: Record<string, string> | null = null;

function getTapSecrets(): Record<string, string> {
  if (_secretsCache) return _secretsCache;
  try {
    _secretsCache = JSON.parse(process.env.TAP_TEST_SECRETS || '{}');
  } catch {
    _secretsCache = {};
  }
  return _secretsCache!;
}

/**
 * Load a JSON file from src/data/ directory.
 * If TAP_DATA_FOLDER is set (e.g., "development"), checks the environment
 * subfolder first (src/data/development/filename.json) and falls back to
 * the shared root (src/data/filename.json).
 * Resolves any "ENV:VAR_NAME" string values to their runtime values.
 */
export function loadData<T = unknown>(filename: string): T {
  const dataFolder = process.env.TAP_DATA_FOLDER;

  // Try environment-specific path first
  if (dataFolder) {
    const envPath = path.join(process.cwd(), 'src', 'data', dataFolder, filename);
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf-8');
      const data = JSON.parse(raw);
      return resolveEnvVars(data) as T;
    }
  }

  // Fall back to shared path
  const filePath = path.join(process.cwd(), 'src', 'data', filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  return resolveEnvVars(data) as T;
}

/**
 * Recursively walk an object and replace "ENV:VAR_NAME" strings
 * with the corresponding environment variable or TAP secret value.
 */
function resolveEnvVars(obj: unknown): unknown {
  if (typeof obj === 'string' && obj.startsWith('ENV:')) {
    const varName = obj.slice(4);
    // Check direct env var first, then TAP_TEST_SECRETS
    if (process.env[varName]) return process.env[varName];
    const secrets = getTapSecrets();
    if (secrets[varName]) return secrets[varName];
    return '';
  }
  if (Array.isArray(obj)) {
    return obj.map(resolveEnvVars);
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = resolveEnvVars(val);
    }
    return result;
  }
  return obj;
}
