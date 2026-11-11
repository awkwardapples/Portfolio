#!/usr/bin/env node
/**
 * pnpm media:screens [scb|arbiter] (spec T.3, J.4; Pass 11, E.6): captures
 * stills of the demos for their frames' facades, so a page shows the demo
 * without loading any of it until the visitor asks.
 *
 *   pnpm --filter @growth-ops/wizard build:demo   (once, for the SCB demo)
 *   pnpm media:screens            both demos
 *   pnpm media:screens arbiter    only Arbiter (it builds its demo first)
 *
 * Serves apps/site/public on a local port, opens each demo in Playwright's
 * Chromium and writes PNGs beside its work entry, where Astro turns them
 * into AVIF and WebP. The demos' own notices are hidden in the stills; the
 * frames' captions say they are demos. Arbiter's "Sample mode" chip, its own
 * label, stays.
 *
 *   SCB: the homepage (desktop and phone) and the quote page.
 *   Arbiter: the run view for Quillfeather once its ruling shows (the frame's
 *   still and the work's cover), the Assess page at 844 by 390 (the phone
 *   still, in a landscape outline), and the Quillfeather case's Decision tab.
 */
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PUBLIC = join(ROOT, 'apps/site/public');
const which = process.argv[2] ?? 'all';
if (!['all', 'scb', 'arbiter'].includes(which)) {
  console.error('Usage: pnpm media:screens [scb|arbiter]');
  process.exit(1);
}
if (
  (which === 'all' || which === 'scb') &&
  !existsSync(join(PUBLIC, 'demo/scb-handyman/index.html'))
) {
  console.error('The SCB demo is not built. Run: pnpm --filter @growth-ops/wizard build:demo');
  process.exit(1);
}
if (which === 'all' || which === 'arbiter') {
  // The stills must show the console as it is built now.
  execFileSync('pnpm', ['--filter', '@jl/arbiter-demo', 'build:demo'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
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
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
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
const origin = `http://127.0.0.1:${port}`;

const QUILLFEATHER = 'Quillfeather Payroll Cloud Ltd';

/** Runs Quillfeather's assessment and waits for its ruling and brief. */
async function quillfeatherRuling(page) {
  await page.getByRole('button', { name: `Start assessment of ${QUILLFEATHER}` }).click();
  const ruling = page.getByTestId('ruling-card');
  await ruling.getByText('Escalate to the TPRM lead').waitFor({ timeout: 120_000 });
  // Let the card's entrance finish.
  await page.waitForTimeout(1500);
  return ruling;
}

const DEMOS = {
  scb: {
    url: '/demo/scb-handyman/',
    out: 'apps/site/src/content/work/growtrades/screens',
    hide: '[role="note"] { display: none !important; }',
    shots: [
      { name: 'scb-home-desktop', width: 1280, height: 800, path: '' },
      { name: 'scb-home-mobile', width: 390, height: 844, path: '' },
      { name: 'scb-quote-desktop', width: 1280, height: 800, path: '?path=%2Fquote' },
    ],
  },
  arbiter: {
    url: '/demo/arbiter/',
    out: 'apps/site/src/content/work/arbiter/screens',
    // The demo banner (the frame's caption says it is a demo), and its offset.
    hide: `.demo-banner { display: none !important; } :root { --demo-banner: 0px !important; }`,
    shots: [
      {
        name: 'console-ruling-desktop',
        width: 1280,
        height: 800,
        path: '',
        prepare: quillfeatherRuling,
      },
      { name: 'console-assess-landscape', width: 844, height: 390, path: '' },
      {
        name: 'console-case-desktop',
        width: 1280,
        height: 800,
        path: '',
        prepare: async (page) => {
          const ruling = await quillfeatherRuling(page);
          await ruling.getByRole('link', { name: 'Open the case' }).click();
          await page.getByText("The vendor's word").first().waitFor();
          await page.waitForTimeout(800);
        },
      },
    ],
  },
};

const require = createRequire(join(ROOT, 'apps/site/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();

try {
  for (const [key, demo] of Object.entries(DEMOS)) {
    if (which !== 'all' && which !== key) continue;
    const out = join(ROOT, demo.out);
    mkdirSync(out, { recursive: true });
    for (const shot of demo.shots) {
      const page = await browser.newPage({
        viewport: { width: shot.width, height: shot.height },
        deviceScaleFactor: 1,
      });
      await page.goto(`${origin}${demo.url}${shot.path}`, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: demo.hide });
      await page.evaluate(() => document.fonts.ready);
      if (shot.prepare) await shot.prepare(page);
      const file = join(out, `${shot.name}.png`);
      await page.screenshot({ path: file });
      console.log(`screens: ${file.slice(ROOT.length)} (${shot.width}x${shot.height})`);
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
