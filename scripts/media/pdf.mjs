#!/usr/bin/env node
/**
 * pnpm media:pdf <file> --to <entry-folder> [--name <name>] [--dry-run]
 *
 * Adds a PDF to the site (spec H.7, T.3):
 *   1. copies it to apps/site/public/documents/<name>.pdf, a clean and
 *      permanent URL (/documents/<name>.pdf); <name> defaults to the entry
 *      folder's name;
 *   2. renders page one to <entry-folder>/<name>.cover.png with pdfjs-dist
 *      and @napi-rs/canvas (no system dependencies, Windows and Linux);
 *   3. records page count, file size and the embedded title and author in
 *      apps/site/src/data/documents.json, and warns if the title is missing;
 *   4. prints the `documents:` entry to paste into the entry's frontmatter.
 *
 * --dry-run renders the cover into a temporary folder and changes nothing.
 */
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative } from 'node:path';

import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import {
  DOCUMENTS_DIR,
  DOCUMENTS_MANIFEST,
  SITE_SRC,
  ensureDir,
  fail,
  formatBytes,
  fromCwd,
  parseArgs,
  slugify,
} from './lib.mjs';

const COVER_WIDTH = 1200;

const { positional, flags } = parseArgs(process.argv.slice(2), ['dry-run']);
const [input] = positional;
if (!input) {
  fail('Usage: pnpm media:pdf <file.pdf> --to <entry-folder> [--name <name>] [--dry-run]');
}
const source = fromCwd(input);
if (!existsSync(source)) fail(`No file at ${source}.`);
if (extname(source).toLowerCase() !== '.pdf') fail(`${basename(source)} is not a PDF.`);
const dryRun = Boolean(flags['dry-run']);
if (!dryRun && typeof flags.to !== 'string') {
  fail('Say which entry the document belongs to: --to apps/site/src/content/work/<slug>');
}
const entryDir = dryRun ? mkdtempSync(join(tmpdir(), 'media-pdf-')) : fromCwd(flags.to);
if (!dryRun && !existsSync(entryDir)) fail(`No entry folder at ${entryDir}.`);

const name = slugify(
  typeof flags.name === 'string'
    ? flags.name
    : dryRun
      ? basename(source, '.pdf')
      : basename(entryDir),
);
if (!name) fail('Could not make a file name; pass --name <name>.');

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve('pdfjs-dist/package.json'));
const data = new Uint8Array(readFileSync(source));
const loadingTask = getDocument({
  data,
  // In Node, pdfjs reads these with fs, so they are paths, not URLs.
  standardFontDataUrl: join(pdfjsRoot, 'standard_fonts').replaceAll('\\', '/') + '/',
  cMapUrl: join(pdfjsRoot, 'cmaps').replaceAll('\\', '/') + '/',
  cMapPacked: true,
  isEvalSupported: false,
});
const pdf = await loadingTask.promise;

const { info } = await pdf.getMetadata().catch(() => ({ info: {} }));
const title = typeof info?.Title === 'string' && info.Title.trim() ? info.Title.trim() : null;
const author = typeof info?.Author === 'string' && info.Author.trim() ? info.Author.trim() : null;

const page = await pdf.getPage(1);
const base = page.getViewport({ scale: 1 });
const viewport = page.getViewport({ scale: COVER_WIDTH / base.width });
const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
const context = canvas.getContext('2d');
context.fillStyle = '#ffffff';
context.fillRect(0, 0, canvas.width, canvas.height);
await page.render({ canvas, canvasContext: context, viewport }).promise;
const cover = join(entryDir, `${name}.cover.png`);
writeFileSync(cover, await canvas.encode('png'));

const bytes = statSync(source).size;
const record = {
  pages: pdf.numPages,
  bytes,
  title,
  author,
  cover: relative(SITE_SRC, cover).split('\\').join('/'),
};
await loadingTask.destroy();

if (dryRun) {
  console.log(`Dry run: ${basename(source)}`);
  console.log(`  pages ${record.pages}, ${formatBytes(bytes)}, cover ${cover}`);
  console.log(`  embedded title: ${title ?? '(none)'}; author: ${author ?? '(none)'}`);
  process.exit(0);
}

ensureDir(DOCUMENTS_DIR);
const target = join(DOCUMENTS_DIR, `${name}.pdf`);
copyFileSync(source, target);

ensureDir(dirname(DOCUMENTS_MANIFEST));
const manifest = existsSync(DOCUMENTS_MANIFEST)
  ? JSON.parse(readFileSync(DOCUMENTS_MANIFEST, 'utf8'))
  : {};
manifest[`${name}.pdf`] = record;
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(DOCUMENTS_MANIFEST, JSON.stringify(sorted, null, 2) + '\n');

console.log(`Added /documents/${name}.pdf (${record.pages} pages, ${formatBytes(bytes)}).`);
console.log(`Cover: ${relative(process.cwd(), cover)}`);
if (!title) {
  console.warn(
    'Warning: the PDF has no embedded title. Set one in the source document (File > Properties) and export again, so search engines and screen readers get a real title.',
  );
} else {
  console.log(`Embedded title: ${title}${author ? `; author: ${author}` : ''}`);
}
console.log("\nAdd this to the entry's frontmatter under `documents:` and fill in the type:\n");
console.log(`  - file: ${name}.pdf`);
console.log(`    title: ${JSON.stringify(title ?? 'TODO(josh): document title')}`);
console.log('    docType: paper # paper, dissertation, report, slides or poster');
console.log('    peerReviewed: false');
