#!/usr/bin/env node
/**
 * package-plugin.mjs
 *
 * Produces a distributable plugin ZIP at dist/quote-wizard-VERSION.zip.
 *
 * Usage (from repo root):
 *   pnpm package-plugin
 *
 * Behaviour:
 *   1. Runs build-plugin.mjs first to guarantee assets are fresh.
 *   2. Resolves the plugin version from quote-wizard.php (single source of truth).
 *   3. Enumerates files via an EXPLICIT ALLOWLIST (not a denylist).
 *   4. Applies hard-refusal safety rules:
 *        - rejects any path containing .env
 *        - rejects paths matching secret/credentials/token (with documented exceptions)
 *        - rejects files > 5MB
 *        - rejects total ZIP > 10MB
 *        - source maps (*.map) are NEVER included
 *   5. Builds the ZIP with sorted entries and preserved mtimes for reproducibility.
 *   6. Logs every included file for audit.
 *
 * Fails hard on any unmet expectation. No partial ZIPs.
 */

import { promises as fs } from 'node:fs';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import archiver from 'archiver';
import {
  repoRoot,
  info,
  warn,
  fatal,
  formatBytes,
  pathExists,
  listFiles,
  matchesGlob,
  toForwardSlash,
} from './lib/file-utils.mjs';

const ROOT = repoRoot(import.meta.url);
const PLUGIN_DIR = path.join(ROOT, 'plugins', 'quote-wizard');
const OUTPUT_DIR = path.join(ROOT, 'dist');

/**
 * The packaging ALLOWLIST. Anything not matching one of these globs is
 * silently excluded. Patterns are relative to PLUGIN_DIR.
 *
 * IMPORTANT: source maps (*.map) are not listed. They're useful in dev but
 * expose unminified source structure in production. See ADR-0010.
 */
const ALLOWLIST = [
  'quote-wizard.php',
  'uninstall.php',
  'readme.txt',
  'LICENSE',
  'src/**/*.php',
  'assets/dist/manifest.json',
  'assets/dist/*.js',
  'assets/dist/*.css',
  // Fonts (and other fingerprinted entry assets) Vite emits under assets/.
  // Self-hosted font files ship with the plugin; see ADR-0012 (typography).
  'assets/dist/assets/*.woff2',
  'assets/dist/assets/*.woff',
];

/**
 * Hard refusal rules. If any of these match a candidate file, packaging aborts.
 * Path comparisons are case-insensitive.
 */
const FORBIDDEN_SUBSTRINGS = ['.env', 'secret', 'credentials', 'token'];
const FORBIDDEN_EXCEPTIONS = ['/docs/', '/tests/']; // these dirs may legitimately mention the terms

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_ZIP_SIZE = 10 * 1024 * 1024; // 10 MB

async function main() {
  info('Starting plugin packaging pipeline');

  await runBuildPipeline();
  const version = await readPluginVersion();
  const files = await selectFiles();
  await refuseDangerousPaths(files);
  const outputPath = await buildZip(files, version);
  await verifyZipSize(outputPath);

  info('Packaging complete.');
  info(`  Output: ${path.relative(ROOT, outputPath)}`);
}

/**
 * Step 1: ensure the build is fresh by invoking build-plugin.mjs.
 */
async function runBuildPipeline() {
  info('Running build-plugin.mjs to ensure fresh assets...');

  const buildScript = path.join(ROOT, 'scripts', 'build-plugin.mjs');
  const result = spawnSync(process.execPath, [buildScript], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    fatal(`build-plugin.mjs failed with exit code ${result.status}`);
  }
}

/**
 * Step 2: read the plugin version from the plugin header in quote-wizard.php.
 * Plugin header is the single source of truth for version.
 */
async function readPluginVersion() {
  const headerPath = path.join(PLUGIN_DIR, 'quote-wizard.php');
  const content = await fs.readFile(headerPath, 'utf-8');
  const match = content.match(/^\s*\*\s*Version:\s*([^\s]+)/m);
  if (!match) {
    fatal(`Could not parse Version: header in ${headerPath}`);
  }
  const version = match[1].trim();
  info(`Plugin version (from quote-wizard.php header): ${version}`);
  return version;
}

/**
 * Step 3: enumerate files via the allowlist.
 *
 * For each file under PLUGIN_DIR, check if any allowlist pattern matches.
 * Returns an array of { absolute, relative } objects.
 */
async function selectFiles() {
  const allFiles = await listFiles(PLUGIN_DIR);
  const selected = [];
  const rejected = [];

  for (const abs of allFiles) {
    const rel = toForwardSlash(path.relative(PLUGIN_DIR, abs));
    const matched = ALLOWLIST.some((pattern) => matchesGlob(rel, pattern));
    if (matched) {
      selected.push({ absolute: abs, relative: rel });
    } else {
      rejected.push(rel);
    }
  }

  selected.sort((a, b) => a.relative.localeCompare(b.relative));

  info(`Allowlist selected ${selected.length} files. Excluded: ${rejected.length} files.`);
  info(`Included file list (sorted):`);
  for (const f of selected) {
    info(`  + ${f.relative}`);
  }

  // For the operator's audit comfort, surface a few notable exclusions.
  const notable = rejected.filter(
    (r) =>
      r.startsWith('composer') ||
      r.startsWith('phpcs') ||
      r.startsWith('phpstan') ||
      r.startsWith('tests/') ||
      r.startsWith('README') ||
      r.endsWith('.map') ||
      r === '.gitignore' ||
      r === '.distignore',
  );
  if (notable.length > 0) {
    info(`Notable exclusions (expected):`);
    for (const r of notable.slice(0, 10).sort()) {
      info(`  - ${r}`);
    }
    if (notable.length > 10) {
      info(`  - ... and ${notable.length - 10} more`);
    }
  }

  if (selected.length === 0) {
    fatal('No files matched the allowlist. Refusing to build an empty ZIP.');
  }

  return selected;
}

/**
 * Step 4: hard-refusal safety checks. Aborts before producing a ZIP if any
 * candidate file would expose secrets, exceed size budgets, or otherwise
 * violate distribution rules.
 */
async function refuseDangerousPaths(files) {
  let totalSize = 0;

  for (const { absolute, relative } of files) {
    const lowered = relative.toLowerCase();

    // Forbidden substring check (with documented exceptions).
    for (const banned of FORBIDDEN_SUBSTRINGS) {
      if (!lowered.includes(banned)) continue;
      const excepted = FORBIDDEN_EXCEPTIONS.some((except) => lowered.includes(except));
      if (excepted) continue;
      fatal(
        `Path "${relative}" contains forbidden substring "${banned}". ` +
          `If this is a false positive, update FORBIDDEN_EXCEPTIONS in package-plugin.mjs.`,
      );
    }

    // Per-file size limit.
    const stat = await fs.stat(absolute);
    if (stat.size > MAX_FILE_SIZE) {
      fatal(
        `File ${relative} is ${formatBytes(stat.size)} which exceeds the per-file limit ` +
          `of ${formatBytes(MAX_FILE_SIZE)}. If legitimate, raise MAX_FILE_SIZE and document why.`,
      );
    }
    totalSize += stat.size;
  }

  if (totalSize > MAX_ZIP_SIZE) {
    fatal(
      `Total payload is ${formatBytes(totalSize)} which exceeds the total limit ` +
        `of ${formatBytes(MAX_ZIP_SIZE)}.`,
    );
  }

  info(`Safety checks passed. Total payload size: ${formatBytes(totalSize)}.`);
}

/**
 * Step 5: build the ZIP.
 *
 * Reproducibility notes:
 *   - Files are added in sorted order (consistent across runs).
 *   - Each entry's mtime is set from the source file's mtime.
 *   - Compression level fixed at 9 (max compression, deterministic).
 *
 * The archive's root directory is named "quote-wizard/" so that extracting
 * the ZIP produces a plugin folder ready to drop into wp-content/plugins/.
 */
async function buildZip(files, version) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const outputName = `quote-wizard-${version}.zip`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  // Remove any previous zip with the same name (deterministic output).
  if (await pathExists(outputPath)) {
    await fs.rm(outputPath);
  }

  const output = createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      info(`ZIP written: ${formatBytes(archive.pointer())} (compressed)`);
      resolve(outputPath);
    });
    archive.on('warning', (err) => warn(`archiver warning: ${err.message}`));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    // Add each file with its source mtime preserved.
    (async () => {
      try {
        for (const { absolute, relative } of files) {
          const stat = await fs.stat(absolute);
          archive.file(absolute, {
            name: `quote-wizard/${relative}`,
            date: stat.mtime,
          });
        }
        await archive.finalize();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

/**
 * Step 6: post-build size verification (sanity check, defence-in-depth).
 */
async function verifyZipSize(outputPath) {
  const stat = await fs.stat(outputPath);
  if (stat.size > MAX_ZIP_SIZE) {
    fatal(`Final ZIP is ${formatBytes(stat.size)}, exceeds ${formatBytes(MAX_ZIP_SIZE)}.`);
  }
  info(`Final ZIP size: ${formatBytes(stat.size)}.`);
}

main().catch((err) => {
  fatal(`Unhandled error: ${err.stack ?? err.message}`);
});
