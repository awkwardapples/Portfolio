#!/usr/bin/env node
/**
 * JavaScript budgets (spec P.1, Pass 9), measured on the built site:
 *
 *   - the homepage's initial JavaScript, leaving out islands that hydrate
 *     when visible: 40 kB or less, gzipped;
 *   - everything /contact loads before the visitor acts, the contact wizard
 *     included (it is imported dynamically once the page has painted):
 *     120 kB or less, gzipped.
 *
 * For each page it takes the inline scripts, the scripts it links and the
 * islands it hydrates, and follows their imports through the chunks Vite
 * wrote. Dynamic import() counts only where a page makes it without being
 * asked (/contact); the Turnstile script, from another host, is not counted.
 * Every other page is listed for information. Lighthouse CI checks timings.
 *
 *   node scripts/check-budgets.mjs        (after pnpm build; CI runs it)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIST = fileURLToPath(new URL('../apps/site/dist/', import.meta.url));
const KB = 1024;

/**
 * Budgets in bytes, gzipped. `visible: false` leaves out client:visible
 * islands; `dynamic: true` follows dynamic import() as well.
 */
const BUDGETS = {
  '/': { limit: 40 * KB, visible: false, dynamic: false },
  '/contact': { limit: 120 * KB, visible: true, dynamic: true },
};

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('check-budgets: apps/site/dist is missing; run pnpm build first.');
  process.exit(1);
}

/** Every built page (not the demo, the editor or the documents), as [path, file]. */
function pages(directory = DIST) {
  const found = [];
  for (const name of readdirSync(directory)) {
    const file = join(directory, name);
    if (statSync(file).isDirectory()) {
      if (!['_astro', 'admin', 'demo', 'documents', 'media'].includes(name))
        found.push(...pages(file));
    } else if (name.endsWith('.html')) {
      const path = `/${relative(DIST, file).split(sep).join('/')}`
        .replace(/\.html$/, '')
        .replace(/(^|\/)index$/, '$1');
      found.push([path === '' ? '/' : path, file]);
    }
  }
  return found.sort(([a], [b]) => a.localeCompare(b));
}

const gzipped = (text) => gzipSync(text, { level: 9 }).length;
const IMPORTS = /(?:\bfrom|\bimport)\s*["']([^"']+\.m?js)["']/g;
// Vite writes dynamic imports with template literals: import(`./chunk.js`).
const DYNAMIC = /\bimport\(\s*["'`]([^"'`]+\.m?js)["'`]\s*\)/g;

/** A local script and everything it imports, as URL paths. */
function collect(url, seen, dynamic) {
  if (seen.has(url) || !url.startsWith('/')) return;
  const file = join(DIST, ...url.split('/'));
  if (!existsSync(file)) throw new Error(`check-budgets: ${url} is referenced but not built`);
  seen.add(url);
  const source = readFileSync(file, 'utf8');
  const specifiers = [...source.matchAll(IMPORTS), ...(dynamic ? source.matchAll(DYNAMIC) : [])];
  for (const [, specifier] of specifiers) {
    collect(
      specifier.startsWith('/') ? specifier : posix.join(posix.dirname(url), specifier),
      seen,
      dynamic,
    );
  }
}

function measure(html, { visible, dynamic }) {
  const files = new Set();
  let inline = '';
  for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/type="application\/(ld\+)?json"/.test(attributes)) continue;
    const src = /\bsrc="([^"]+)"/.exec(attributes)?.[1];
    if (src) collect(src, files, dynamic);
    else {
      inline += body;
      for (const [, specifier] of body.matchAll(IMPORTS)) collect(specifier, files, dynamic);
    }
  }
  let islands = 0;
  for (const [island] of html.matchAll(/<astro-island\b[^>]*>/g)) {
    if (!visible && /\bclient="visible"/.test(island)) continue;
    islands += 1;
    for (const attribute of ['component-url', 'renderer-url']) {
      const url = new RegExp(`${attribute}="([^"]+)"`).exec(island)?.[1];
      if (url) collect(url, files, dynamic);
    }
  }
  const bytes =
    gzipped(inline) +
    [...files].reduce(
      (sum, url) => sum + gzipped(readFileSync(join(DIST, ...url.split('/')), 'utf8')),
      0,
    );
  return { bytes, files: files.size, islands };
}

const kb = (bytes) => `${(bytes / KB).toFixed(1)} kB`;
const built = pages();
let failed = false;
console.log('JavaScript budgets (spec P.1), gzipped:');
for (const [path, file] of built) {
  const budget = BUDGETS[path];
  const result = measure(readFileSync(file, 'utf8'), {
    visible: budget?.visible ?? false,
    dynamic: budget?.dynamic ?? false,
  });
  const detail = `${result.files} files, ${result.islands} islands${budget?.visible === false ? ', client:visible left out' : ''}`;
  if (!budget) {
    console.log(`  ${path.padEnd(40)} ${kb(result.bytes).padStart(9)}  (${detail}; no budget)`);
    continue;
  }
  const over = result.bytes > budget.limit;
  failed ||= over;
  console.log(
    `  ${path.padEnd(40)} ${kb(result.bytes).padStart(9)} of ${kb(budget.limit)}  (${detail})${over ? '  OVER' : ''}`,
  );
  if (over && process.env.GITHUB_ACTIONS) {
    console.log(
      `::error::${path} loads ${kb(result.bytes)} of JavaScript; the budget is ${kb(budget.limit)} (spec P.1).`,
    );
  }
}
for (const path of Object.keys(BUDGETS)) {
  if (!built.some(([page]) => page === path)) {
    console.error(`check-budgets: ${path} has a budget but was not built.`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
