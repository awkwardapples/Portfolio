#!/usr/bin/env node
/**
 * pnpm content:todo
 *
 * Lists every TODO(josh) placeholder and note in the site's content, and
 * every draft, so Josh can see at a glance what is still waiting on him
 * (spec T.4, W). Exit code is always 0: this is a report, not a gate.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { ROOT, SITE } from './media/lib.mjs';

const MARK = 'TODO(josh)';
const CONTENT = join(SITE, 'src', 'content');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(CONTENT).filter((file) => /\.(mdx|md|ya?ml)$/.test(file));
let total = 0;
const drafts = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const shown = relative(ROOT, file).split('\\').join('/');
  if (/^draft:\s*true\s*$/m.test(text) && !file.endsWith('.yaml')) drafts.push(shown);
  const hits = text
    .split('\n')
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter(({ line }) => line.includes(MARK));
  if (hits.length === 0) continue;
  console.log(`\n${shown}`);
  for (const { line, number } of hits) {
    const note = line
      .slice(line.indexOf(MARK) + MARK.length)
      .replace(/^[:\s]+/, '')
      .replace(/['"]+$/, '');
    console.log(`  line ${String(number).padStart(3)}: ${note}`);
  }
  total += hits.length;
}

console.log(`\n${total} placeholder${total === 1 ? '' : 's'} in ${files.length} content files.`);
if (drafts.length > 0) {
  console.log(`\nDrafts (left out of production until \`draft: true\` is removed):`);
  for (const draft of drafts) console.log(`  ${draft}`);
}
