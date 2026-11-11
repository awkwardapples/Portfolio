#!/usr/bin/env node
/**
 * pnpm arbiter:sync <path to an Arbiter checkout> <full commit sha>
 *
 * Copies Arbiter's analyst console (web/) into apps/arbiter-demo at one
 * commit, with the backend files the case study quotes into
 * apps/arbiter-demo/upstream/, and rewrites UPSTREAM.md (Pass 11, E.1;
 * ADR-0050). The checkout must be at exactly that commit.
 *
 * Upstream files are never edited here. The demo's own files are left
 * alone: src/demo/, public/data/ (the snapshot), demo.html,
 * vite.demo.config.ts, README.md. package.json is upstream's with only its
 * name and scripts replaced. After a sync, refresh the snapshot
 * (apps/arbiter-demo/README.md): the console and the data must match.
 */
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DEMO = join(ROOT, 'apps/arbiter-demo');
const REPOSITORY = 'https://github.com/awkwardapples/Arbiter';

/** What is copied from web/, and what never is. */
const KEPT = [
  'src',
  'public',
  'index.html',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'components.json',
  'eslint.config.js',
];
const LEFT_OUT = [
  '`dist/`, `node_modules/` and `package-lock.json`',
  '`scripts/` (`source-hash.mjs`, `record-fixtures.mjs`)',
  "upstream's tests (`src/**/__tests__/**`, `src/test/**`)",
  '`vite.config.ts` and its dev-server proxy: `vite.demo.config.ts` builds the demo instead',
];
/** The demo's own files, which a sync never touches. */
const OURS = ['src/demo', 'public/data'];

/** Backend files the case study quotes (F.5, F.6), kept verbatim. */
export const UPSTREAM_FILES = [
  'app/orchestrator.py',
  'app/policy/engine.py',
  'policy/arbiter_policy.v1.yaml',
  'app/actions/contracts.py',
  'app/audit/chain.py',
  'app/audit/replay.py',
  'app/guard/scout_guard.py',
  'app/data/queries.yaml',
  'logs/examples/live/trace-run-211916c1544d.jsonl',
  'docs/EVALUATION.md',
  // The README's figures, sources, agents table and trace lines are quoted too.
  'README.md',
];

/** The demo package's scripts, in place of upstream's. */
const SCRIPTS = {
  'build:demo': 'vite build -c vite.demo.config.ts',
  test: 'vitest run -c vite.demo.config.ts',
  typecheck: 'tsc -p tsconfig.app.json --noEmit',
  lint: 'eslint src/demo vite.demo.config.ts --max-warnings=0',
};

const fail = (message) => {
  console.error(`arbiter:sync: ${message}`);
  process.exit(1);
};

const [checkout, sha] = process.argv.slice(2);
if (!checkout || !sha || !/^[0-9a-f]{40}$/.test(sha)) {
  fail('Usage: pnpm arbiter:sync <path to an Arbiter checkout> <full 40-character commit sha>');
}
const head = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
if (head !== sha) fail(`${checkout} is at ${head}, not ${sha}. Check out the commit first.`);
const date = execFileSync('git', ['-C', checkout, 'log', '-1', '--format=%cI', sha], {
  encoding: 'utf8',
}).trim();
const web = join(checkout, 'web');

const skipped = (rel) =>
  /(^|\/)__tests__(\/|$)/.test(rel) || rel === 'src/test' || rel.startsWith('src/test/');
const ours = (rel) => OURS.some((path) => rel === path || rel.startsWith(`${path}/`));

/** Removes the previous copy of a kept path, sparing the demo's own files. */
function clear(rel) {
  const target = join(DEMO, rel);
  if (!existsSync(target)) return;
  if (!OURS.some((path) => path.startsWith(`${rel}/`))) {
    rmSync(target, { recursive: true, force: true });
    return;
  }
  for (const name of readdirSync(target)) {
    const child = `${rel}/${name}`;
    if (!ours(child)) clear(child);
  }
}

mkdirSync(DEMO, { recursive: true });
for (const rel of KEPT) {
  clear(rel);
  cpSync(join(web, rel), join(DEMO, rel), {
    recursive: true,
    filter: (source) => {
      const path = relative(web, source).split(sep).join('/');
      return !skipped(path) && !ours(path);
    },
  });
}

const upstreamPackage = JSON.parse(readFileSync(join(web, 'package.json'), 'utf8'));
const demoPackage = { ...upstreamPackage, name: '@jl/arbiter-demo', scripts: SCRIPTS };
writeFileSync(join(DEMO, 'package.json'), `${JSON.stringify(demoPackage, null, 2)}\n`);

rmSync(join(DEMO, 'upstream'), { recursive: true, force: true });
for (const rel of UPSTREAM_FILES) {
  const target = join(DEMO, 'upstream', rel);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(join(checkout, rel), target);
}

writeFileSync(
  join(DEMO, 'UPSTREAM.md'),
  `# Upstream

This package is Arbiter's analyst console, copied from [${REPOSITORY}](${REPOSITORY}) by \`pnpm arbiter:sync\` (\`scripts/arbiter/sync-console.mjs\`).

- **Commit:** [\`${sha}\`](${REPOSITORY}/tree/${sha})
- **Committed:** ${date}
- **Copied from \`web/\`:** ${KEPT.map((path) => `\`${path}\``).join(', ')}.
- **Left out:**
${LEFT_OUT.map((item) => `  - ${item};`)
  .join('\n')
  .replace(/;$/, '.')}
- **\`upstream/\`:** verbatim copies of the backend files the case study quotes: ${UPSTREAM_FILES.map((path) => `\`${path}\``).join(', ')}.

## The rule

Upstream files are never edited here. The demo adds its own files beside them (\`src/demo/\`, \`demo.html\`, \`vite.demo.config.ts\`, \`public/data/\`, \`README.md\`). The only change to an upstream file is \`package.json\`: its name is \`@jl/arbiter-demo\` and its scripts are the demo's.

To move to a newer commit, run \`pnpm arbiter:sync <checkout> <sha>\`, then refresh the snapshot (\`README.md\`).
`,
);

console.log(
  `arbiter:sync: copied the console and ${UPSTREAM_FILES.length} backend files at ${sha.slice(0, 7)} (${date}).`,
);
