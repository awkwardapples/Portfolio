#!/usr/bin/env node
/**
 * pnpm media:images <files...> --to <entry-folder> [--name <name>]
 *
 * Prepares photographs for an entry (spec T.3, Q.5): resizes to a 2560 px
 * long edge, applies the camera's rotation, strips all metadata including
 * GPS location, and writes a high-quality JPEG into the entry folder. Astro
 * produces the AVIF and WebP versions at build time. Prints the `media:`
 * lines to paste, with alt-text placeholders to fill in.
 *
 * --name sets the output name when there is one file (e.g. --name portrait).
 */
import { existsSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

import sharp from 'sharp';

import { ensureDir, fail, formatBytes, fromCwd, parseArgs, slugify } from './lib.mjs';

const LONG_EDGE = 2560;
const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif']);

/** Resize, rotate, strip metadata, save as JPEG. Returns the output path and size. */
export async function prepareImage(source, outDir, name) {
  const output = join(outDir, `${name}.jpg`);
  const info = await sharp(source)
    .rotate()
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(output);
  return { output, width: info.width, height: info.height, bytes: info.size };
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  if (positional.length === 0 || typeof flags.to !== 'string') {
    fail('Usage: pnpm media:images <files...> --to <entry-folder> [--name <name>]');
  }
  if (typeof flags.name === 'string' && positional.length > 1) {
    fail('--name only works with a single file.');
  }
  const outDir = fromCwd(flags.to);
  ensureDir(outDir);

  const lines = [];
  for (const input of positional) {
    const source = fromCwd(input);
    if (!existsSync(source)) fail(`No file at ${source}.`);
    const ext = extname(source).toLowerCase();
    if (ext === '.heic' || ext === '.heif') {
      fail(
        `${basename(source)} is HEIC, which this tool cannot read. Export it as JPEG first (on an iPhone: Settings > Camera > Formats > Most Compatible, or share the photo as JPEG).`,
      );
    }
    if (!SUPPORTED.has(ext))
      fail(`${basename(source)} is not a supported image (JPEG, PNG, WebP, TIFF, AVIF).`);
    const name = slugify(
      typeof flags.name === 'string' ? flags.name : basename(source, extname(source)),
    );
    const result = await prepareImage(source, outDir, name);
    console.log(
      `Wrote ${relative(process.cwd(), result.output)} (${result.width} x ${result.height}, ${formatBytes(result.bytes)}, metadata removed).`,
    );
    lines.push(
      `  - type: image`,
      `    src: ./${name}.jpg`,
      `    alt: "TODO(josh): what the photo shows"`,
      `    caption: "TODO(josh): where and when, specifically"`,
    );
  }
  console.log('\nAdd these under `media:` in the entry, then replace the placeholders:\n');
  console.log(lines.join('\n'));
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) await main();
