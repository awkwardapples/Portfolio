#!/usr/bin/env node
/**
 * pnpm new [post|work] [--title "..."] [--threads ai,music] [--date 2026-10-04]
 *          [--kind software] [--project <work-slug>] [--from <folder>]
 *
 * Creates a content entry folder with a correctly typed index.mdx (spec T.1),
 * asking for anything not given on the command line. New entries start as
 * drafts, so a half-written entry never goes live; set `draft: false` (or
 * delete the line) when it is ready.
 *
 * --from <folder> also brings in the media in that folder: photographs go
 * through `pnpm media:images`, PDFs through `pnpm media:pdf`, and audio files
 * are copied to public/media/audio/. Each is added to the entry's `media:`.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { createInterface } from 'node:readline/promises';

import { ROOT, SITE, ensureDir, fail, fromCwd, parseArgs, slugify } from './media/lib.mjs';

const KINDS = ['research', 'software', 'venture', 'music', 'writing'];
const THREADS = ['ai', 'research', 'software', 'venture', 'music', 'university', 'life'];
const IMAGES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif']);
const AUDIO = new Set(['.mp3', '.m4a', '.aac', '.ogg', '.opus', '.wav', '.flac']);

const { positional, flags } = parseArgs(process.argv.slice(2));
const interactive = process.stdin.isTTY;
const rl = interactive ? createInterface({ input: process.stdin, output: process.stdout }) : null;

async function ask(question, fallback) {
  if (!rl) {
    if (fallback !== undefined) return fallback;
    fail(
      `Missing ${question.toLowerCase()} (pass it as a flag; see the usage at the top of scripts/new.mjs).`,
    );
  }
  const answer = (await rl.question(`${question}${fallback ? ` (${fallback})` : ''}: `)).trim();
  return answer || fallback || ask(question, fallback);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const type = positional[0] ?? (await ask('Post or work', 'post'));
if (!['post', 'work'].includes(type)) fail('The first argument is "post" or "work".');

const title = typeof flags.title === 'string' ? flags.title : await ask('Title');
const date = typeof flags.date === 'string' ? flags.date : await ask('Date (YYYY-MM-DD)', today());
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('The date is YYYY-MM-DD.');
const threadsAnswer =
  typeof flags.threads === 'string'
    ? flags.threads
    : await ask(`Threads, comma-separated (${THREADS.join(', ')})`);
const threads = threadsAnswer
  .split(',')
  .map((thread) => thread.trim())
  .filter(Boolean);
const unknown = threads.filter((thread) => !THREADS.includes(thread));
if (threads.length === 0 || unknown.length > 0) {
  fail(
    `Threads are one or more of: ${THREADS.join(', ')}.${unknown.length ? ` Unknown: ${unknown.join(', ')}.` : ''}`,
  );
}
let kind;
if (type === 'work') {
  kind =
    typeof flags.kind === 'string'
      ? flags.kind
      : await ask(`Kind (${KINDS.join(', ')})`, 'software');
  if (!KINDS.includes(kind)) fail(`The kind is one of: ${KINDS.join(', ')}.`);
}
rl?.close();

const slug = slugify(title);
if (!slug) fail('The title needs at least one letter or digit.');
const folderName = type === 'post' ? `${date}-${slug}` : slug;
const folder = join(SITE, 'src', 'content', type === 'post' ? 'posts' : 'work', folderName);
if (existsSync(folder)) fail(`${relative(ROOT, folder)} already exists.`);
mkdirSync(folder, { recursive: true });

// Media from --from, added to the frontmatter below.
const media = [];
if (typeof flags.from === 'string') {
  const from = fromCwd(flags.from);
  if (!existsSync(from)) fail(`No folder at ${from}.`);
  for (const file of readdirSync(from).sort()) {
    const full = join(from, file);
    const ext = extname(file).toLowerCase();
    const name = slugify(basename(file, ext));
    if (IMAGES.has(ext)) {
      run('scripts/media/images.mjs', [full, '--to', folder, '--name', name]);
      media.push(['image', `    src: ./${name}.jpg\n    alt: "TODO(josh): what the photo shows"`]);
    } else if (ext === '.pdf') {
      run('scripts/media/pdf.mjs', [full, '--to', folder, '--name', name]);
      media.push([
        'document',
        `    file: ${name}.pdf\n    title: "TODO(josh): document title"\n    docType: paper\n    peerReviewed: false`,
      ]);
    } else if (AUDIO.has(ext)) {
      const audioDir = join(SITE, 'public', 'media', 'audio');
      ensureDir(audioDir);
      const target = `${folderName}-${name}${ext}`;
      copyFileSync(full, join(audioDir, target));
      media.push(['audio', `    src: /media/audio/${target}\n    title: "TODO(josh): title"`]);
    } else {
      console.warn(`Skipped ${file}: not an image, PDF or audio file.`);
    }
  }
}

function run(script, args) {
  const result = spawnSync(process.execPath, [join(ROOT, script), ...args], { stdio: 'inherit' });
  if (result.status !== 0) fail(`${script} failed for ${args[0]}.`);
}

const yaml = (value) => JSON.stringify(value);
const lines = [
  '---',
  `title: ${yaml(title)}`,
  ...(type === 'work' ? [`kind: ${kind}`] : []),
  `threads: [${threads.join(', ')}]`,
  'summary: "TODO(josh): one or two sentences, at most 220 characters"',
  `date: ${date}`,
  ...(type === 'work'
    ? [
        'status: complete',
        'role: "TODO(josh): your role, e.g. Sole author"',
        'authorship:',
        '  type: sole',
      ]
    : []),
  ...(type === 'post' && typeof flags.project === 'string' ? [`project: ${flags.project}`] : []),
  ...(media.length > 0
    ? ['media:', ...media.map(([kindOfMedia, rest]) => `  - type: ${kindOfMedia}\n${rest}`)]
    : []),
  'draft: true',
  '---',
  '',
  'TODO(josh): write the entry here, or delete this line for a post that is only a summary and media.',
  '',
];
writeFileSync(join(folder, 'index.mdx'), lines.join('\n'));

const entryFile = relative(ROOT, join(folder, 'index.mdx')).split('\\').join('/');
console.log(`\nCreated ${entryFile}.`);
console.log(
  type === 'post'
    ? `It will appear at /log/${slug} once it is published.`
    : `It will appear at /work/${slug} once it is published.`,
);
console.log(
  'Fill in the TODO(josh) placeholders, then remove `draft: true`. Preview it with pnpm dev at /dev/content.',
);
