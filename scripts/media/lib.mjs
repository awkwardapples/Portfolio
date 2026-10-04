/**
 * Shared helpers for the media scripts (spec T.3). Plain Node, no
 * dependencies, so the scripts run the same on Windows and Linux.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE = join(ROOT, 'apps', 'site');
export const SITE_SRC = join(SITE, 'src');
export const DOCUMENTS_DIR = join(SITE, 'public', 'documents');
export const DOCUMENTS_MANIFEST = join(SITE_SRC, 'data', 'documents.json');

/** Lowercase, hyphenated, ASCII: "Iris identifier (2024_11_28).pdf" -> "iris-identifier-2024-11-28". */
export function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Minimal argument parser: positional arguments plus `--flag value` and
 * boolean `--flag`. `booleans` lists flags that never take a value.
 */
export function parseArgs(argv, booleans = []) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [name, inline] = arg.slice(2).split('=', 2);
      if (inline !== undefined) flags[name] = inline;
      else if (booleans.includes(name) || i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
        flags[name] = true;
      } else flags[name] = argv[++i];
    } else positional.push(arg);
  }
  return { positional, flags };
}

/** Print a clear message and exit non-zero. */
export function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** Resolve a path the user typed, relative to where they ran pnpm. */
export function fromCwd(path) {
  return resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
