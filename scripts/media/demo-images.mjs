#!/usr/bin/env node
/**
 * Lightens the SCB demo's images after `vite build --mode demo` (spec J.3,
 * ADR-0044). The source images in apps/wizard/src/assets/images/ are never
 * touched; only the copies in the demo build are re-encoded, at the same
 * dimensions and in the same format, and only when that makes them smaller.
 *
 *   node scripts/media/demo-images.mjs        (run by `pnpm --filter @growth-ops/wizard build:demo`)
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ASSETS = fileURLToPath(
  new URL('../../apps/site/public/demo/scb-handyman/assets/', import.meta.url),
);
const THRESHOLD = 250 * 1024;
const kb = (bytes) => `${Math.round(bytes / 1024)} kB`;

const encoders = {
  '.webp': (image) => image.webp({ quality: 72, effort: 6 }),
  '.jpg': (image) => image.jpeg({ quality: 74, mozjpeg: true }),
  '.jpeg': (image) => image.jpeg({ quality: 74, mozjpeg: true }),
  '.png': (image) => image.png({ compressionLevel: 9, palette: true, quality: 80 }),
};

let saved = 0;
for (const name of readdirSync(ASSETS)) {
  const extension = name.slice(name.lastIndexOf('.')).toLowerCase();
  const encode = encoders[extension];
  const path = join(ASSETS, name);
  const before = statSync(path).size;
  if (!encode || before < THRESHOLD) continue;
  const input = readFileSync(path);
  const { width, height } = await sharp(input).metadata();
  const output = await encode(sharp(input)).toBuffer();
  const after = await sharp(output).metadata();
  if (output.length < before && after.width === width && after.height === height) {
    writeFileSync(path, output);
    saved += before - output.length;
    console.log(`demo-images: ${name} ${kb(before)} -> ${kb(output.length)} (${width}x${height})`);
  } else {
    console.log(`demo-images: ${name} ${kb(before)} kept`);
  }
}
console.log(`demo-images: saved ${kb(saved)}`);
