#!/usr/bin/env node
/**
 * node scripts/font-fallbacks.mjs
 *
 * Computes the metric overrides for the fallback faces in
 * apps/site/src/styles/fonts.css (spec E.3, P.2): `size-adjust` from the
 * average width of a representative English sample, and the ascent and
 * descent overrides from each web font's own metrics, so text set in the
 * fallback occupies the same space and the swap does not shift the layout.
 * Measured with @napi-rs/canvas, already used for PDF covers.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { GlobalFonts, createCanvas } from '@napi-rs/canvas';

import { SITE } from './media/lib.mjs';

const require = createRequire(join(SITE, 'package.json'));
const file = (pkg, name) => join(require.resolve(`${pkg}/package.json`), '..', 'files', name);

GlobalFonts.registerFromPath(
  file('@fontsource-variable/stix-two-text', 'stix-two-text-latin-wght-normal.woff2'),
  'Web STIX',
);
GlobalFonts.registerFromPath(
  file('@fontsource-variable/ibm-plex-sans', 'ibm-plex-sans-latin-wght-normal.woff2'),
  'Web Plex',
);

const SAMPLE =
  'The quick brown fox jumps over the lazy dog. Research, software, ventures and music; papers, a dissertation, code and a client platform.';
const ctx = createCanvas(10, 10).getContext('2d');

function measure(family) {
  ctx.font = `100px "${family}"`;
  const width = ctx.measureText(SAMPLE).width;
  const box = ctx.measureText('Hxg');
  return { width, ascent: box.fontBoundingBoxAscent, descent: box.fontBoundingBoxDescent };
}

for (const [label, web, local] of [
  ['STIX Two Text Fallback', 'Web STIX', 'Times New Roman'],
  ['IBM Plex Sans Fallback', 'Web Plex', 'Arial'],
]) {
  const a = measure(web);
  const b = measure(local);
  const sizeAdjust = a.width / b.width;
  const pct = (n) => `${(n * 100).toFixed(2)}%`;
  console.log(`@font-face {
  font-family: '${label}';
  src: local('${local}');
  size-adjust: ${pct(sizeAdjust)};
  ascent-override: ${pct(a.ascent / 100 / sizeAdjust)};
  descent-override: ${pct(a.descent / 100 / sizeAdjust)};
  line-gap-override: 0%;
}
`);
}
