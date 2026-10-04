#!/usr/bin/env node
/**
 * pnpm media:screens (spec T.3, J.4): captures stills of the SCB demo for
 * the GrowTrades frame's facade, so the case study shows the client site
 * without loading any of it until the visitor asks.
 *
 *   pnpm --filter @growth-ops/wizard build:demo   (once, to build the demo)
 *   pnpm media:screens
 *
 * Serves apps/site/public on a local port, opens /demo/scb-handyman/ in
 * Playwright's Chromium and writes PNGs beside the GrowTrades entry, where
 * Astro turns them into AVIF and WebP. The demo's own notice is hidden in
 * the stills; the frame's caption says it is a demo.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PUBLIC = join(ROOT, 'apps/site/public');
const DEMO = join(PUBLIC, 'demo/scb-handyman/index.html');
const OUT = join(ROOT, 'apps/site/src/content/work/growtrades/screens');

if (!existsSync(DEMO)) {
  console.error('The demo is not built. Run: pnpm --filter @growth-ops/wizard build:demo');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

const server = createServer((request, response) => {
  let path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(PUBLIC, path));
  if (!file.startsWith(PUBLIC) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = /** @type {import('node:net').AddressInfo} */ (server.address()).port;
const base = `http://127.0.0.1:${port}/demo/scb-handyman/`;

const require = createRequire(join(ROOT, 'apps/site/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
mkdirSync(OUT, { recursive: true });

const shots = [
  { name: 'scb-home-desktop', width: 1280, height: 800, path: '' },
  { name: 'scb-home-mobile', width: 390, height: 844, path: '' },
  { name: 'scb-quote-desktop', width: 1280, height: 800, path: '?path=%2Fquote' },
];

try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 1,
    });
    await page.goto(base + shot.path, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '[role="note"] { display: none !important; }' });
    await page.evaluate(() => document.fonts.ready);
    const file = join(OUT, `${shot.name}.png`);
    await page.screenshot({ path: file });
    console.log(`screens: ${file.slice(ROOT.length)} (${shot.width}x${shot.height})`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
