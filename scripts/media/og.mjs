#!/usr/bin/env node
/**
 * pnpm media:og (spec S): the default share image and the site icons,
 * rendered in Playwright's Chromium with the site's own fonts and palette,
 * so they match the pages. Work pages share their own cover instead; this is
 * the image for every other page.
 *
 *   pnpm media:og        (again whenever the name or headline changes)
 *
 * Writes into apps/site/public:
 *   og/default.png         1200 x 630, the name and headline on stage
 *   apple-touch-icon.png   180 x 180, the initials
 *   favicon-32.png         32 x 32
 *   favicon.ico            the 32 px PNG in an ICO wrapper, for crawlers
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SITE = join(ROOT, 'apps/site');
const PUBLIC = join(SITE, 'public');
const require = createRequire(join(SITE, 'package.json'));

// The words come from the profile, so the card never says anything it does not.
const profile = readFileSync(join(SITE, 'src/content/profile/profile.yaml'), 'utf8');
const field = (pattern) => {
  const match = pattern.exec(profile);
  if (!match) throw new Error(`media:og: ${pattern} not found in profile.yaml`);
  return match[1].trim();
};
const name = field(/^name:\s*(.+)$/m);
const role = field(/^\s+role:\s*(.+)$/m);
const initials = name
  .split(/\s+/)
  .map((word) => word[0])
  .join('');

// The palette (apps/site/src/design/tokens.ts) and the two variable fonts.
const STAGE = '#000000';
const PAPER = '#F3F4F2';
const FOG = '#A3A8AE';
const font = (pkg, file) =>
  readFileSync(require.resolve(`@fontsource-variable/${pkg}/files/${file}`)).toString('base64');
const stix = font('stix-two-text', 'stix-two-text-latin-wght-normal.woff2');
const plex = font('ibm-plex-sans', 'ibm-plex-sans-latin-wght-normal.woff2');
const fonts = `
  @font-face { font-family: STIX; src: url(data:font/woff2;base64,${stix}) format('woff2'); font-weight: 400 700; }
  @font-face { font-family: Plex; src: url(data:font/woff2;base64,${plex}) format('woff2'); font-weight: 100 700; }
  * { margin: 0; box-sizing: border-box; }
  html, body { background: ${STAGE}; color: ${PAPER}; }`;

const card = `<!doctype html><html><head><style>${fonts}
  body { width: 1200px; height: 630px; padding: 88px 96px; display: flex; flex-direction: column; justify-content: space-between; }
  h1 { font-family: STIX; font-weight: 600; font-size: 132px; line-height: 1; letter-spacing: -0.01em; }
  p { font-family: Plex; font-size: 40px; color: ${FOG}; margin-top: 28px; }
  footer { font-family: Plex; font-size: 30px; color: ${FOG}; }
</style></head><body><div><h1>${name}</h1><p>${role}</p></div><footer>joshlennon.com</footer></body></html>`;

const icon = `<!doctype html><html><head><style>${fonts}
  body { width: 512px; height: 512px; display: grid; place-items: center; }
  span { font-family: STIX; font-weight: 600; font-size: 280px; line-height: 1; letter-spacing: -0.02em; }
</style></head><body><span>${initials}</span></body></html>`;

const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
async function render(html, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  await page.close();
  return png;
}

/** An ICO file holding one PNG image (Windows Vista onwards reads PNG entries). */
function ico(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, png]);
}

try {
  mkdirSync(join(PUBLIC, 'og'), { recursive: true });
  const cardPng = await sharp(await render(card, 1200, 630))
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  writeFileSync(join(PUBLIC, 'og/default.png'), cardPng);
  const iconPng = await render(icon, 512, 512);
  const touch = await sharp(iconPng).resize(180, 180).png({ compressionLevel: 9 }).toBuffer();
  const small = await sharp(iconPng).resize(32, 32).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), touch);
  writeFileSync(join(PUBLIC, 'favicon-32.png'), small);
  writeFileSync(join(PUBLIC, 'favicon.ico'), ico(small, 32));
  console.log(
    `media:og: og/default.png (${Math.round(cardPng.length / 1024)} kB), apple-touch-icon.png, favicon-32.png, favicon.ico`,
  );
} finally {
  await browser.close();
}
