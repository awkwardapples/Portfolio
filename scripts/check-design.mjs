#!/usr/bin/env node
/**
 * Design-constraint check for files ESLint does not parse (spec P.4, X;
 * ADR-0012): `.astro`, `.css`, `.md` and `.mdx` under apps/site/src, plus a
 * repository-wide "no spinners" check. TypeScript and React files get the
 * same bans from ESLint (apps/wizard/eslint-local/design-constraints.js).
 *
 *   node scripts/check-design.mjs        exit 1 and list file:line on any hit
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Files allowed to hold raw hex colours: the token definitions. */
const HEX_ALLOWED = new Set(['apps/site/src/styles/tokens.css']);

const MARKETING_WORDS = [
  'empower',
  'unleash',
  'seamless',
  'cutting-edge',
  'next-gen',
  'next generation',
  'revolutionary',
  'game-changer',
  'game changer',
  'supercharge',
  'effortless',
  'world-class',
  'best-in-class',
  'leverage',
  'synergy',
  'disrupt',
];

const RULES = [
  {
    id: 'gradient',
    re: /bg-gradient-|linear-gradient|radial-gradient|conic-gradient/,
    applies: () => true,
    message: 'Gradients are banned (ADR-0012, spec X). Use a flat token.',
  },
  {
    id: 'blur',
    re: /backdrop-blur|\bblur-|backdrop-filter|filter:\s*blur/,
    applies: () => true,
    message: 'Blur and glass effects are banned (ADR-0012, spec X).',
  },
  {
    id: 'spinner',
    re: /\bspinner\b|animate-spin|loading-spinner|@keyframes\s+[\w-]*(spin|loader|loading)/i,
    applies: () => true,
    message: 'Spinners are banned (spec P.4). Use a skeleton that matches the final layout.',
  },
  {
    id: 'hex',
    re: /#[0-9a-fA-F]{3,8}\b/,
    applies: (file) => /\.(astro|css)$/.test(file) && !HEX_ALLOWED.has(file),
    message: 'Raw hex colours are banned outside the token definitions (ADR-0012).',
  },
  {
    id: 'arbitrary-value',
    re: /\b[a-z-]+-\[[^\]\s]+\]/,
    applies: (file) => file.endsWith('.astro'),
    message: 'Tailwind arbitrary values are banned (ADR-0012). Use the token scale.',
  },
  {
    id: 'emoji',
    re: /[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\u{2B50}|\u{2728}|[\u{1F1E6}-\u{1F1FF}]|\u{FE0F}/u,
    applies: () => true,
    message: 'Emoji are banned (spec E.5). Use plain text or a Lucide icon.',
  },
  {
    id: 'marketing',
    re: new RegExp(`\\b(${MARKETING_WORDS.join('|')})\\b`, 'i'),
    applies: (file) => file.endsWith('.astro'),
    message: 'Marketing language is banned in interface copy (spec E.5).',
  },
];

/** Where each rule looks: site templates and styles, and every UI source for spinners. */
const TARGETS = [
  { dir: 'apps/site/src', exts: ['.astro', '.css', '.md', '.mdx'], rules: 'all' },
  { dir: 'apps/site/src', exts: ['.ts', '.tsx'], rules: ['spinner'] },
  { dir: 'apps/wizard/src', exts: ['.ts', '.tsx', '.css'], rules: ['spinner'] },
];

/**
 * Blank out comments (keeping newlines, so line numbers stay right): a
 * comment saying "no spinner here" is not a spinner. Markdown is content and
 * is checked as written.
 */
function stripComments(text, file) {
  const blank = (match) => match.replace(/[^\n]/g, ' ');
  if (/\.(md|mdx)$/.test(file)) return text;
  let out = text.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (file.endsWith('.astro')) out = out.replace(/<!--[\s\S]*?-->/g, blank);
  if (/\.(ts|tsx|astro)$/.test(file)) out = out.replace(/^\s*\/\/.*$/gm, blank);
  return out;
}

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else out.push(full);
  }
  return out;
}

const problems = [];
for (const target of TARGETS) {
  const rules =
    target.rules === 'all' ? RULES : RULES.filter((rule) => target.rules.includes(rule.id));
  for (const full of walk(join(ROOT, target.dir))) {
    if (!target.exts.some((ext) => full.endsWith(ext))) continue;
    const file = relative(ROOT, full).split(sep).join('/');
    // Tests assert on the banned literals themselves.
    if (/\.test\.tsx?$|\/__tests__\//.test(file)) continue;
    const lines = stripComments(readFileSync(full, 'utf8'), file).split('\n');
    lines.forEach((line, index) => {
      for (const rule of rules) {
        if (rule.applies(file) && rule.re.test(line)) {
          problems.push(`${file}:${index + 1}: [${rule.id}] ${rule.message}`);
        }
      }
    });
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\ncheck-design: ${problems.length} problem(s).`);
  process.exit(1);
}
console.log('check-design: no banned patterns found.');
