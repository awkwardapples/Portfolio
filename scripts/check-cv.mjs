#!/usr/bin/env node
/**
 * The public CV's checks (Pass 11, C.1), run in the gates after the build:
 *
 *   - no UK phone number, no `tel:` link and no "Referee" anywhere in it:
 *     Josh's phone number and a referee's details must never be published;
 *   - every link to joshlennon.com resolves on the built site, to a page, a
 *     file or a short link in dist/_redirects (src/lib/short-links.ts).
 *
 * It prints what it checked but never the text it matched, so a phone
 * number can never reach a log.
 *
 *   node scripts/check-cv.mjs [path/to/cv.pdf]   (after pnpm build)
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'apps/site/dist');
const file = process.argv[2] ?? join(ROOT, 'apps/site/public/cv.pdf');

/**
 * A UK number: +44 or a leading 0, then nine or ten more digits, allowing
 * spaces, hyphens and brackets between them. Years ("2021 to 2025") and
 * figures ("547", "1,465") never start with a 0 or +44.
 */
export const UK_PHONE = /(?:\+\s?44|\b0)(?:[\s()-]*\d){9,10}\b/;

const problems = [];

if (!existsSync(file)) {
  console.error(`check-cv: no CV at ${file}.`);
  process.exit(1);
}

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(file)), verbosity: 0 })
  .promise;
let text = '';
const links = [];
for (let number = 1; number <= doc.numPages; number++) {
  const page = await doc.getPage(number);
  const content = await page.getTextContent();
  text += `${content.items.map((item) => ('str' in item ? item.str : '')).join(' ')}\n`;
  for (const annotation of await page.getAnnotations()) {
    if (annotation.subtype === 'Link' && annotation.url) links.push(annotation.url);
  }
}

if (UK_PHONE.test(text)) problems.push('the text contains what looks like a UK phone number');
if (/referee/i.test(text)) problems.push('the text mentions a referee');
if (links.some((url) => url.toLowerCase().startsWith('tel:')))
  problems.push('a link is a tel: link');
if (links.some((url) => UK_PHONE.test(url))) problems.push('a link contains a phone number');

/** True when the path is a page, a file or a short link on the built site. */
function resolves(path) {
  const clean = decodeURIComponent(path.split(/[?#]/)[0] ?? '/');
  if (clean === '/' || clean === '') return existsSync(join(DIST, 'index.html'));
  const bare = clean.replace(/\/$/, '');
  const redirects = existsSync(join(DIST, '_redirects'))
    ? readFileSync(join(DIST, '_redirects'), 'utf8')
        .split('\n')
        .map((line) => line.trim().split(/\s+/)[0])
    : [];
  return (
    redirects.includes(clean) ||
    redirects.includes(bare) ||
    existsSync(join(DIST, `${bare}.html`)) ||
    existsSync(join(DIST, bare, 'index.html')) ||
    existsSync(join(DIST, bare))
  );
}

const ownLinks = links.filter((url) => /^https?:\/\/(www\.)?joshlennon\.com(\/|$)/i.test(url));
if (ownLinks.length > 0 && !existsSync(join(DIST, 'index.html'))) {
  problems.push('apps/site/dist is missing: run pnpm build first, so the links can be checked');
} else {
  for (const url of ownLinks) {
    const { pathname } = new URL(url);
    if (!resolves(pathname)) problems.push(`${url} does not resolve on the site`);
  }
}

console.log(
  `check-cv: ${doc.numPages} pages, ${links.length} links (${ownLinks.length} to joshlennon.com).`,
);
for (const url of links) {
  if (!url.toLowerCase().startsWith('tel:') && !UK_PHONE.test(url)) console.log(`  ${url}`);
}
if (problems.length > 0) {
  console.error(`check-cv: ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('check-cv: no phone number, no referee, and every site link resolves.');
