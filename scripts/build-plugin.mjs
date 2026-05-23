#!/usr/bin/env node
/**
 * build-plugin.mjs
 *
 * Builds the React wizard and copies its output into the WordPress plugin's
 * assets/dist/ directory.
 *
 * Usage (from repo root):
 *   pnpm build-plugin
 *
 * Behaviour:
 *   1. Runs `pnpm --filter @growth-ops/wizard build`.
 *   2. Empties plugins/quote-wizard/assets/dist/ (preserving .gitkeep).
 *   3. Copies apps/wizard/dist/* into plugins/quote-wizard/assets/dist/.
 *   4. Verifies the manifest is present and references real files.
 *
 * Fails hard if any input is missing. Never produces a half-built state.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  repoRoot,
  info,
  fatal,
  formatBytes,
  pathExists,
  readJson,
  emptyDir,
  copyDir,
  listFiles,
} from './lib/file-utils.mjs';

const ROOT = repoRoot(import.meta.url);
const WIZARD_DIST = path.join(ROOT, 'apps', 'wizard', 'dist');
const PLUGIN_DIST = path.join(ROOT, 'plugins', 'quote-wizard', 'assets', 'dist');

async function main() {
  info('Starting plugin build pipeline');
  info(`Repo root: ${ROOT}`);

  await runWizardBuild();
  await verifyWizardOutput();
  await refreshPluginDist();
  await verifyManifestReferences();

  info('Build complete.');
}

/**
 * Step 1: shell out to pnpm to build the wizard.
 */
async function runWizardBuild() {
  info('Running pnpm --filter @growth-ops/wizard build...');

  const result = spawnSync('pnpm', ['--filter', '@growth-ops/wizard', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    fatal(`pnpm wizard build failed with exit code ${result.status}`);
  }
}

/**
 * Step 2: verify the wizard build produced the expected outputs.
 */
async function verifyWizardOutput() {
  if (!(await pathExists(WIZARD_DIST))) {
    fatal(`Expected wizard build output at ${WIZARD_DIST}; not found.`);
  }

  const manifestPath = path.join(WIZARD_DIST, 'manifest.json');
  if (!(await pathExists(manifestPath))) {
    fatal(`Wizard build produced no manifest at ${manifestPath}.`);
  }

  let manifest;
  try {
    manifest = await readJson(manifestPath);
  } catch (err) {
    fatal(err.message);
  }

  if (!manifest['src/main.tsx']?.file) {
    fatal(`manifest.json missing "src/main.tsx" entry or its "file" key.`);
  }
  if (!manifest['style.css']?.file) {
    fatal(`manifest.json missing "style.css" entry or its "file" key.`);
  }

  info(`Wizard build verified: ${manifest['src/main.tsx'].file} + ${manifest['style.css'].file}`);
}

/**
 * Step 3: clear the plugin dist directory and copy fresh assets.
 *
 * Preserves .gitkeep so the directory remains tracked even when empty.
 *
 * Uses an EXPLICIT ALLOWLIST so source maps and any other non-shipping artefacts
 * never land in the plugin's dist directory. This matters because LocalWP (and
 * production WordPress) serves whatever sits in assets/dist/ — so having a
 * .map file here means the map is reachable over HTTP and exposes source
 * structure to anyone curious. The same allowlist concept is enforced again
 * at packaging time as defence in depth.
 */
async function refreshPluginDist() {
  await fs.mkdir(PLUGIN_DIST, { recursive: true });

  info(`Cleaning ${PLUGIN_DIST} (preserving .gitkeep)...`);
  await emptyDir(PLUGIN_DIST, { keep: ['.gitkeep'] });

  // Read the manifest to discover the hashed filenames Vite emitted.
  const manifestPath = path.join(WIZARD_DIST, 'manifest.json');
  const manifest = await readJson(manifestPath);
  const jsFile = manifest['src/main.tsx'].file;
  const cssFile = manifest['style.css'].file;

  // Explicit copy list. Nothing else is copied — no globs, no source maps,
  // no surprises.
  const filesToCopy = ['manifest.json', jsFile, cssFile];

  info(`Copying ${filesToCopy.length} allowlisted files from ${WIZARD_DIST} -> ${PLUGIN_DIST}...`);

  let copied = 0;
  for (const rel of filesToCopy) {
    // Defensive: refuse to copy source maps even if a future Vite config or
    // manifest change accidentally referenced one.
    if (rel.endsWith('.map')) {
      warn(`Refusing to copy source map: ${rel}`);
      continue;
    }

    const src = path.join(WIZARD_DIST, rel);
    const dst = path.join(PLUGIN_DIST, rel);

    if (!(await pathExists(src))) {
      fatal(`Expected file ${rel} missing in wizard dist; aborting copy.`);
    }

    await fs.copyFile(src, dst);
    const stat = await fs.stat(dst);
    info(`  ${rel} (${formatBytes(stat.size)})`);
    copied++;
  }

  info(`Copied ${copied} files.`);
}

/**
 * Step 4: verify every file referenced by the manifest actually exists in
 * the plugin's dist directory. Catches the rare case where the copy is
 * partial (e.g. file system races, permission issues).
 */
async function verifyManifestReferences() {
  const manifestPath = path.join(PLUGIN_DIST, 'manifest.json');
  const manifest = await readJson(manifestPath);

  const referenced = [manifest['src/main.tsx'].file, manifest['style.css'].file];

  for (const rel of referenced) {
    const abs = path.join(PLUGIN_DIST, rel);
    if (!(await pathExists(abs))) {
      fatal(`manifest references ${rel} but the file is missing in ${PLUGIN_DIST}`);
    }
    const stat = await fs.stat(abs);
    info(`  ${rel} (${formatBytes(stat.size)})`);
  }

  // List everything that landed for the operator's eyeball check.
  const finalFiles = await listFiles(PLUGIN_DIST);
  info(`Final plugin dist contents (${finalFiles.length} files):`);
  for (const f of finalFiles.sort()) {
    const rel = path.relative(PLUGIN_DIST, f);
    info(`  ${rel}`);
  }
}

main().catch((err) => {
  fatal(`Unhandled error: ${err.stack ?? err.message}`);
});
