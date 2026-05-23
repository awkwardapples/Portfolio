/**
 * Shared utilities for build-plugin.mjs and package-plugin.mjs.
 *
 * Uses only Node's built-in fs/promises and path. No external dependencies
 * for these primitives — keeps the toolchain auditable and works on any
 * machine that has Node 20.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Resolve the repository root from a script file URL.
 *
 * Each script lives at scripts/whatever.mjs, so the repo root is two levels up.
 */
export function repoRoot(scriptFileUrl) {
  const scriptPath = fileURLToPath(scriptFileUrl);
  return path.resolve(path.dirname(scriptPath), '..');
}

/**
 * Stylised log prefix so build output is greppable and consistent across
 * scripts. The prefix matches our [GOQW] operational log convention.
 */
const PREFIX = '[GOQW][build]';

export function info(message) {
  console.log(`${PREFIX} ${message}`);
}

export function warn(message) {
  console.warn(`${PREFIX} WARN: ${message}`);
}

export function fatal(message, exitCode = 1) {
  console.error(`${PREFIX} ERROR: ${message}`);
  process.exit(exitCode);
}

/**
 * Format byte counts as a human-readable string for logs.
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Check whether a path exists (file or directory).
 */
export async function pathExists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a file with a clear error message if it doesn't exist or isn't valid.
 */
export async function readJson(absPath) {
  try {
    const raw = await fs.readFile(absPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read JSON at ${absPath}: ${err.message}`);
  }
}

/**
 * Recursively list every file under a directory (returns absolute paths).
 * Skips symlinks defensively.
 */
export async function listFiles(absDir) {
  const out = [];
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        await walk(next);
      } else if (entry.isFile()) {
        out.push(next);
      }
    }
  }
  await walk(absDir);
  return out;
}

/**
 * Empty a directory in place, preserving the directory itself.
 *
 * Optionally preserves files matching keepPatterns (exact filename match).
 */
export async function emptyDir(absDir, { keep = [] } = {}) {
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  for (const entry of entries) {
    if (keep.includes(entry.name)) continue;
    const target = path.join(absDir, entry.name);
    await fs.rm(target, { recursive: true, force: true });
  }
}

/**
 * Copy every file from srcDir into dstDir, recursively.
 *
 * Optionally filter files: filterFn(relativePath) -> boolean.
 * Skips symlinks. Preserves mtimes from source.
 */
export async function copyDir(srcDir, dstDir, { filter = null } = {}) {
  await fs.mkdir(dstDir, { recursive: true });
  const files = await listFiles(srcDir);
  let copied = 0;
  for (const absSrc of files) {
    const rel = path.relative(srcDir, absSrc);
    if (filter && !filter(rel)) continue;
    const absDst = path.join(dstDir, rel);
    await fs.mkdir(path.dirname(absDst), { recursive: true });
    await fs.copyFile(absSrc, absDst);
    // Preserve mtime for reproducibility.
    const stat = await fs.stat(absSrc);
    await fs.utimes(absDst, stat.atime, stat.mtime);
    copied += 1;
  }
  return copied;
}

/**
 * Match a path against a simple glob pattern with `*`, `**`, and literal segments.
 *
 * Supported syntax (intentionally limited):
 *   *.php          - filename glob in current "segment"
 *   src/**\/*.php   - recursive descent
 *   src/foo.php    - literal
 *
 * The caller passes a forward-slash path. We don't support negation or
 * bracket character classes — if needed later, switch to micromatch.
 */
export function matchesGlob(forwardSlashPath, pattern) {
  const regexSource = pattern
    .split('/')
    .map((segment) => {
      if (segment === '**') return '.*';
      // Escape regex meta-characters except `*`, which we translate.
      let escaped = segment.replace(/[.+^${}()|[\]\\]/g, '\\$&');
      escaped = escaped.replace(/\*/g, '[^/]*');
      return escaped;
    })
    .join('/');
  // Collapse double-slash that '**' can produce.
  const cleaned = regexSource.replace(/\.\*\//g, '(?:.*/)?');
  const regex = new RegExp('^' + cleaned + '$');
  return regex.test(forwardSlashPath);
}

/**
 * Convert any OS path to forward-slash form for matching.
 */
export function toForwardSlash(p) {
  return p.split(path.sep).join('/');
}
