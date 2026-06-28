#!/usr/bin/env node
/**
 * TAP scaffold-integrity local pre-commit hook installer.
 *
 * Runs automatically on `npm install` via the "prepare" script in package.json.
 * Reinstalls the hook from scratch on every run — deleting `.git/hooks/pre-commit`
 * is undone by the next `npm install`.
 *
 * The hook itself is rejected by `--no-verify`, by editing this installer, or by
 * deleting both the installer and the hook. Those are intentional local escape
 * hatches: scaffold integrity is enforced by TAP backend + GitHub branch protection,
 * not by this hook. The hook is friction + early signaling, not a security boundary.
 *
 * See docs/SCAFFOLD_INTEGRITY.md for the full enforcement model.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// Source of truth for paths users cannot modify. Rendered by TAP at scaffold time
// from PROTECTED_SCAFFOLD_PATHS in backend/src/services/codeRepositoryService.ts.
const PROTECTED = [
  'package.json',
  'playwright.config.ts',
  'tsconfig.json',
  '.gitignore',
  '.github/workflows/execute-playwright-tests.yml',
  'src/utils/tap-db.ts',
  'src/utils/data-loader.ts',
  '.vscode/settings.json',
  'scripts/install-tap-hooks.ts',
];

let gitDir;
try {
  gitDir = execSync('git rev-parse --git-dir', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  // Not a git checkout (e.g. running on a CI runner that downloaded a tarball).
  // Nothing to install. Silent exit — this isn't an error in that context.
  process.exit(0);
}

const hooksDir = path.resolve(gitDir, 'hooks');
fs.mkdirSync(hooksDir, { recursive: true });
const hookPath = path.join(hooksDir, 'pre-commit');

// Build an anchored alternation pattern. grep -E needs `.` and `/` escaped.
const pattern = PROTECTED.map((p) => p.replace(/[.\/]/g, '\\$&')).join('|');

const hook = `#!/bin/sh
# TAP scaffold-integrity local pre-commit guard.
# Auto-installed by scripts/install-tap-hooks.ts — do not edit, do not delete.
# If you remove this file, the next \`npm install\` regenerates it.

DRIFTED=$(git diff --cached --name-only | grep -E '^(${pattern})$' || true)
if [ -n "$DRIFTED" ]; then
  printf '\\n\\033[31m✗ Cannot commit modifications to TAP-scaffolded files:\\033[0m\\n'
  printf '%s\\n' "$DRIFTED" | sed 's/^/    /'
  printf '\\n  These files are owned by TAP.\\n'
  printf '  Restore canonical content via TAP → Automation Execution → "Re-scaffold".\\n'
  printf '\\n  (--no-verify bypasses this guard locally but the change will\\n'
  printf '   still be rejected by GitHub branch protection and by TAP at run time.)\\n\\n'
  exit 1
fi
`;

fs.writeFileSync(hookPath, hook, { mode: 0o755 });
console.log('[tap] pre-commit scaffold-integrity hook installed.');
